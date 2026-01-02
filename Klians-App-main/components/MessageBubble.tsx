import React, { useState } from 'react';
import { Message, User } from '../types';
import { Avatar } from './ui/Avatar';
import { ICONS } from '../constants';

interface SharedPost {
  _id: string;
  user: {
    name: string;
    email: string;
    profilePicture: string;
  };
  content?: string;
  image?: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: {
    type: 'text' | 'post';
    sender?: {
      name: string;
      profilePicture: string;
    };
    content?: string;
    text?: string;
    postId?: SharedPost;
    createdAt: string;
    timestamp?: string;
  };
  isOwnMessage: boolean;
  showSenderInfo?: boolean; // For group chats
  onDelete?: () => void;
}

const parseMarkdownToHTML = (text: string): string => {
  let escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  escapedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escapedText = escapedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escapedText = escapedText.replace(/__(.*?)__/g, '<u>$1</u>');

  return escapedText;
};


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, showSenderInfo = false, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPostMessage = message.type === 'post' && message.postId;
  const post = isPostMessage ? message.postId : null;
  const hasContent = post?.content && post.content.trim();
  const postAuthor = post?.user;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`flex items-end gap-1 mb-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}
      onMouseEnter={() => isOwnMessage && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Received message avatar */}
      {!isOwnMessage && message.sender && (
        <Avatar src={message.sender.profilePicture} alt={message.sender.name} size="sm" />
      )}

      {/* Delete Button - Appears on hover for own messages (before message) */}
      {isOwnMessage && isHovered && (
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all duration-200 border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md"
          title="Delete message"
        >
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5V3H9zm0 5h2v8H9V8zm4 0h2v8h-2V8z" />
          </svg>
        </button>
      )}

      {/* Shared Post Message */}
      {isPostMessage && post ? (
        <div className="space-y-0 w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
          {/* Post Header - Light Grey */}
          {postAuthor && (
            <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2.5 flex items-center gap-2 min-w-0">
              <Avatar src={postAuthor.profilePicture} alt={postAuthor.name} size="sm" />
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{postAuthor.name || 'Unknown'}</p>
            </div>
          )}
          
          {/* Post Image */}
          {post.image && (
            <div className="bg-slate-950 overflow-hidden flex items-center justify-center">
              <img
                src={post.image}
                alt={`Post by ${post.user?.name || 'author'}`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', post.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Post Content - Light Grey */}
          {hasContent && (
            <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2.5">
              <p className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2 break-words">{post.content}</p>
            </div>
          )}
        </div>
      ) : (
        /* Text Message Bubble */
        <div
          className={`max-w-[70%] px-4 py-2 rounded-3xl text-sm break-words transition-all duration-200 ${
            isOwnMessage
              ? `bg-blue-500 text-white rounded-br-md shadow-md ${isHovered ? '-translate-x-8' : 'translate-x-0'}`
              : 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded-bl-md'
          }`}
        >
          {showSenderInfo && !isOwnMessage && message.sender && (
            <p className="font-semibold text-xs mb-1 text-red-500 dark:text-red-400">{message.sender.name}</p>
          )}
          <p
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(message.content || message.text) }}
          />
          <span className={`text-xs mt-1 block ${isOwnMessage ? 'text-white/70 text-right' : 'text-slate-500 dark:text-slate-300'}`}>
            {formatTime(message.timestamp || message.createdAt)}
          </span>
        </div>
      )}
    </div>
  );
};