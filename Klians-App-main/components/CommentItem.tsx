import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Comment } from './CommentSection';

interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: (content: string) => void;
  level: number;
  isNested?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  level,
  isNested = false,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showPlusOne, setShowPlusOne] = useState(false);

  const handleLike = () => {
    setIsLiking(true);
    setShowPlusOne(!comment.isLiked);
    onLike();
    
    setTimeout(() => {
      setIsLiking(false);
    }, 300);

    if (!comment.isLiked) {
      setTimeout(() => {
        setShowPlusOne(false);
      }, 1000);
    }
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Prevent nesting beyond 2 levels
  const canReply = level < 2;

  return (
    <div
      className={`group px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
        isNested ? 'bg-slate-25 dark:bg-slate-800/50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <img
          src={comment.author.avatar || '/default-avatar.png'}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Username & Timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {comment.author.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimeAgo(comment.timestamp)}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-slate-900 dark:text-slate-100 break-words whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-2">
            {/* Like Button with Animation */}
            <button
              onClick={handleLike}
              className="relative flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              <span
                className={`transition-all duration-300 ${
                  isLiking
                    ? comment.isLiked
                      ? 'animate-heart-unlike'
                      : 'animate-heart-like'
                    : ''
                }`}
              >
                {comment.isLiked ? (
                  <svg
                    className="w-4 h-4 text-red-500 fill-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
              </span>
              {comment.likes > 0 && (
                <span className={comment.isLiked ? 'text-red-500' : ''}>
                  {comment.likes}
                </span>
              )}

              {/* +1 Floating Animation */}
              {showPlusOne && (
                <span className="absolute -top-6 left-0 text-red-500 font-bold text-xs animate-float-up">
                  +1
                </span>
              )}
            </button>

            {/* Reply Button */}
            {canReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit()}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-full outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
