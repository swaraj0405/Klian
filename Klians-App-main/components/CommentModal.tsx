import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { postsAPI } from '../src/api/posts';
import { ICONS } from '../constants';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  initialComments: any[];
  onCommentAdded: () => void;
}

// Skeleton Loading Component
const CommentSkeleton = () => (
  <div className="flex gap-3 animate-pulse p-2">
    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32" />
      <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-full" />
      <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
    </div>
  </div>
);

const COMMENTS_PER_PAGE = 15;

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  initialComments,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [allComments, setAllComments] = useState<any[]>([]);
  const [displayedComments, setDisplayedComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const MAX_LENGTH = 500;
  const SHOW_COUNTER_AT = 400;
  const commonEmojis = ['😊', '😂', '❤️', '👍', '🔥', '✨', '🎉', '💯'];

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await postsAPI.getPost(postId);
      if (response.data && response.data.comments) {
        const comments = response.data.comments;
        setAllComments(comments);
        // Load first page only
        setDisplayedComments(comments.slice(0, COMMENTS_PER_PAGE));
        setHasMore(comments.length > COMMENTS_PER_PAGE);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadMoreComments = async () => {
    setIsLoadingMore(true);
    try {
      const startIdx = currentPage * COMMENTS_PER_PAGE;
      const newComments = allComments.slice(startIdx, startIdx + COMMENTS_PER_PAGE);
      setDisplayedComments([...displayedComments, ...newComments]);
      setCurrentPage(currentPage + 1);
      setHasMore(startIdx + COMMENTS_PER_PAGE < allComments.length);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreComments();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, currentPage, allComments]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await postsAPI.addComment(postId, newComment);
      // Add new comment to the top
      setAllComments([response.data, ...allComments]);
      setDisplayedComments([response.data, ...displayedComments]);
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Unable to add comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji: string) => {
    if (newComment.length < MAX_LENGTH) {
      setNewComment(newComment + emoji);
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const comment = displayedComments.find((c) => c._id === commentId);
      if (!comment) return;

      const isLiked = comment.likes?.some((like: any) => 
        (typeof like === 'string' ? like : like._id || like.id) === user?.id
      );

      if (isLiked) {
        await postsAPI.unlikeComment(postId, commentId);
      } else {
        await postsAPI.likeComment(postId, commentId);
      }

      // Update displayed comments
      setDisplayedComments(
        displayedComments.map((c) =>
          c._id === commentId
            ? {
                ...c,
                likes: isLiked
                  ? c.likes.filter((like: any) => (typeof like === 'string' ? like : like._id || like.id) !== user?.id)
                  : [...(c.likes || []), user?.id],
              }
            : c
        )
      );

      // Update all comments
      setAllComments(
        allComments.map((c) =>
          c._id === commentId
            ? {
                ...c,
                likes: isLiked
                  ? c.likes.filter((like: any) => (typeof like === 'string' ? like : like._id || like.id) !== user?.id)
                  : [...(c.likes || []), user?.id],
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const formatTimeAgo = (timestamp: string | Date | undefined) => {
    if (!timestamp) return 'now';
    
    try {
      const now = new Date();
      const commentTime = new Date(timestamp);
      
      if (isNaN(commentTime.getTime())) {
        return 'now';
      }
      
      const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'now';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={commentsListRef}>
          {isLoadingComments ? (
            // Show skeleton loaders while loading
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : displayedComments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet.</p>
              <p className="text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <>
              {displayedComments.map((comment) => {
                const isLiked = comment.likes?.some((like: any) => 
                  (typeof like === 'string' ? like : like._id || like.id) === user?.id
                );
                const likeCount = comment.likes?.length || 0;

                return (
                  <div key={comment._id} className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 p-2 rounded-lg transition-colors">
                    <img
                      src={comment.user?.profilePicture || '/default-avatar.png'}
                      alt={comment.user?.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {comment.user?.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTimeAgo(comment.date || comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-100 break-words mb-2">
                        {comment.text}
                      </p>
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        {isLiked ? (
                          <svg className="w-4 h-4 text-red-500 fill-red-500" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {likeCount > 0 && (
                          <span className={isLiked ? 'text-red-500' : ''}>{likeCount}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Load more indicator */}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center py-4">
                  {isLoadingMore ? (
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Scroll for more</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
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
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_LENGTH) {
                      setNewComment(e.target.value);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500"
                />
                {newComment.length >= SHOW_COUNTER_AT && (
                  <span className={`text-xs ${newComment.length >= MAX_LENGTH ? 'text-red-500' : 'text-slate-500'}`}>
                    {newComment.length}/{MAX_LENGTH}
                  </span>
                )}
              </div>
            </div>
            {newComment.trim() && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
