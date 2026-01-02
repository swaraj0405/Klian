import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from '../hooks/useAuth';
import { messagesAPI } from '../src/api/messages';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture: string;
  };
  recipient: {
    _id: string;
    name: string;
    email: string;
    profilePicture: string;
  };
  content: string;
  type: 'text' | 'post';
  postId?: any; // Can be string ID or full post object with content, image, user
  read: boolean;
  createdAt: string;
}

interface Conversation {
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture: string;
  };
  lastMessage: Message;
  unread: boolean;
}

interface MessagesContextType {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Message[];
  sendMessage: (recipientId: string, content: string, type?: 'text' | 'post', postId?: string) => Promise<void>;
  sharePost: (recipientId: string, postId: string, message?: string) => Promise<void>;
  setCurrentConversation: (userId: string | null) => void;
  unreadCount: number;
}

const MessagesContext = createContext<MessagesContextType>({
  conversations: [],
  currentConversation: null,
  messages: [],
  sendMessage: async () => {},
  sharePost: async () => {},
  setCurrentConversation: () => {},
  unreadCount: 0
});

export const useMessages = () => useContext(MessagesContext);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper function to get user ID (handle both _id and id)
  const getUserId = (userObj: any) => userObj?._id || userObj?.id;

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      try {
        const response = await messagesAPI.getConversations();
        setConversations(response.data);
        setUnreadCount(response.data.filter((conv: Conversation) => conv.unread).length);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, [user]);

  // Load messages for current conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversation || !user) return;
      try {
        const response = await messagesAPI.getMessagesWith(currentConversation);
        setMessages(response.data);
        
        // Mark messages as read
        if (socket && user) {
          socket.emit('mark-messages-read', {
            userId: getUserId(user),
            senderId: currentConversation
          });
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [currentConversation, user, socket]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('new-message', (message: Message) => {
      console.log('Received new message:', message);
      
      // Update messages if in current conversation
      const userId = getUserId(user);
      const otherUserId = message.sender._id === userId ? message.recipient._id : message.sender._id;
      if (currentConversation === otherUserId) {
        setMessages(prev => {
          // Remove any temporary messages (optimistic updates)
          const filteredMessages = prev.filter(msg => !msg._id.startsWith('temp_'));
          
          // Check if message already exists (avoid duplicates)
          const existingMessage = filteredMessages.find(msg => msg._id === message._id);
          if (existingMessage) {
            return filteredMessages;
          }
          
          return [...filteredMessages, message];
        });
      }
      
      // Mark as read if we're the recipient and in current conversation
      if (message.recipient._id === userId && currentConversation === message.sender._id) {
        socket.emit('mark-messages-read', {
          userId: userId,
          senderId: message.sender._id
        });
      }

      // Update conversations list
      setConversations(prev => {
        const userId = getUserId(user);
        const otherUser = message.sender._id === userId ? message.recipient : message.sender;
        const existingConversation = prev.find(c => c.user._id === otherUser._id);

        if (existingConversation) {
          return prev.map(conv => {
            if (conv.user._id === otherUser._id) {
              return {
                ...conv,
                lastMessage: message,
                unread: message.sender._id !== userId && !message.read
              };
            }
            return conv;
          });
        }

        // Add new conversation
        return [{
          user: otherUser,
          lastMessage: message,
          unread: message.sender._id !== userId
        }, ...prev];
      });

      // Update unread count
      setUnreadCount(prev => message.sender._id !== userId && !message.read ? prev + 1 : prev);
    });

    socket.on('messages-marked-read', ({ by }) => {
      if (by === currentConversation) {
        setMessages(prev =>
          prev.map(msg => ({
            ...msg,
            read: true
          }))
        );
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('messages-marked-read');
    };
  }, [socket, user, currentConversation]);

  const sendMessage = async (recipientId: string, content: string, type: 'text' | 'post' = 'text', postId?: string) => {
    if (!socket || !user) {
      console.log('Cannot send message: missing socket or user', { socket: !!socket, user: !!user });
      return;
    }

    console.log('Sending message:', { recipientId, content, type, postId });
    console.log('User object:', user);
    const currentUserId = getUserId(user);
    console.log('User ID:', currentUserId);

    // Find recipient info
    let recipientInfo = conversations.find(c => c.user._id === recipientId)?.user;
    
    // If not found in conversations, create minimal recipient info
    if (!recipientInfo) {
      recipientInfo = {
        _id: recipientId,
        name: 'Unknown User',
        email: '',
        profilePicture: ''
      };
    }

    // Create optimistic message with timestamp-based temporary ID
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      sender: {
        _id: currentUserId,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || user.avatar
      },
      recipient: recipientInfo,
      content,
      type,
      postId,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Update messages optimistically only if this is the current conversation
    if (currentConversation === recipientId) {
      setMessages(prev => [...prev, optimisticMessage]);
    }

    // Update conversations optimistically
    setConversations(prev => {
      const existingConversation = prev.find(c => c.user._id === recipientId);
      if (existingConversation) {
        return prev.map(conv => {
          if (conv.user._id === recipientId) {
            return {
              ...conv,
              lastMessage: optimisticMessage,
            };
          }
          return conv;
        });
      }
      // Add new conversation if it doesn't exist
      return [{
        user: recipientInfo,
        lastMessage: optimisticMessage,
        unread: false
      }, ...prev];
    });

    // Send to server
    console.log('Emitting private-message event to server');
    socket.emit('private-message', {
      senderId: currentUserId,
      recipientId,
      content,
      type,
      postId
    });
  };

  const sharePost = async (recipientId: string, postId: string, message?: string) => {
    if (!socket || !user) return;

    socket.emit('share-post', {
      senderId: user._id,
      recipientId,
      postId,
      message
    });
  };

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        sendMessage,
        sharePost,
        setCurrentConversation,
        unreadCount
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};