import React, { useState, forwardRef } from 'react';
import { ICONS } from '../constants';

interface CommentInputProps {
  userAvatar: string;
  onSubmit: (content: string) => void;
}

export const CommentInput = forwardRef<HTMLInputElement, CommentInputProps>(
  ({ userAvatar, onSubmit }, ref) => {
    const [comment, setComment] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const MAX_LENGTH = 500;
    const SHOW_COUNTER_AT = 400;

    const handleSubmit = () => {
      if (comment.trim()) {
        onSubmit(comment);
        setComment('');
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const commonEmojis = ['😊', '😂', '❤️', '👍', '🔥', '✨', '🎉', '💯'];

    const insertEmoji = (emoji: string) => {
      if (comment.length < MAX_LENGTH) {
        setComment(comment + emoji);
        setShowEmojiPicker(false);
      }
    };

    return (
      <div className="sticky bottom-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <img
            src={userAvatar || '/default-avatar.png'}
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />

          {/* Input Field */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              {/* Emoji Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Emoji Picker Dropdown */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 grid grid-cols-4 gap-1 z-10">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-xl hover:bg-slate-100 dark:hover:bg-slate-600 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                ref={ref}
                type="text"
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_LENGTH) {
                    setComment(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500"
              />

              {/* Character Counter (shown at 400+) */}
              {comment.length >= SHOW_COUNTER_AT && (
                <span
                  className={`text-xs ${
                    comment.length >= MAX_LENGTH
                      ? 'text-red-500'
                      : 'text-slate-500'
                  }`}
                >
                  {comment.length}/{MAX_LENGTH}
                </span>
              )}
            </div>
          </div>

          {/* Send Button - Only shows when typing */}
          {comment.trim() && (
            <button
              onClick={handleSubmit}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-95"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

CommentInput.displayName = 'CommentInput';
