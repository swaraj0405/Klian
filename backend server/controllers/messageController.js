const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message to another user
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipient, content, type, postId } = req.body;

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const newMessage = new Message({
      sender: req.user._id,
      recipient,
      content,
      type: type || 'text',
      ...(postId && { postId })
    });

    const message = await newMessage.save();
    
    // Populate sender and recipient data
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getMessagesWith = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Find messages where current user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture')
      .populate({
        path: 'postId',
        populate: {
          path: 'user',
          select: 'name email profilePicture role'
        }
      });
    
    // Mark messages as read if current user is recipient
    const unreadMessages = messages.filter(
      message => 
        message.recipient._id.toString() === currentUserId.toString() && 
        !message.read
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { 
          recipient: currentUserId,
          sender: otherUserId,
          read: false
        },
        { read: true }
      );
    }
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations of current user
// @route   GET /api/messages
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all messages where current user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture')
      .populate({
        path: 'postId',
        populate: {
          path: 'user',
          select: 'name email profilePicture role'
        }
      });
    
    // Get unique conversations
    const conversations = [];
    const conversationUsers = new Set();
    
    messages.forEach(message => {
      const otherUser = message.sender._id.toString() === currentUserId.toString() 
        ? message.recipient 
        : message.sender;
      
      if (!conversationUsers.has(otherUser._id.toString())) {
        conversationUsers.add(otherUser._id.toString());
        conversations.push({
          user: otherUser,
          lastMessage: message,
          unread: message.recipient._id.toString() === currentUserId.toString() && !message.read
        });
      }
    });
    
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getMessagesWith,
  getConversations,
  
  // @desc    Share a post via message
  // @route   POST /api/messages/share
  // @access  Private
  sharePost: async (req, res) => {
    try {
      const { recipient, postId, message } = req.body;

      // Input validation
      if (!recipient || !postId) {
        return res.status(400).json({ message: 'Recipient and postId are required' });
      }

      // Check if recipient exists
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        return res.status(404).json({ message: 'Recipient not found' });
      }

      // Create a new message
      const newMessage = new Message({
        sender: req.user._id,
        recipient,
        content: message || '',
        type: 'post',
        postId
      });

      const savedMessage = await newMessage.save();
      
      // Populate sender, recipient, and post details
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'name email profilePicture')
        .populate('recipient', 'name email profilePicture')
        .populate({
          path: 'postId',
          select: 'content image createdAt user',
          populate: {
            path: 'user',
            select: 'name email profilePicture'
          }
        });
      
      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Error sharing post via message:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};