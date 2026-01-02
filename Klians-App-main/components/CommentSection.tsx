import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { useAuth } from '../hooks/useAuth';

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
  isOpen?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onReply,
  isOpen = false,
}) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
        {comments.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full px-4 py-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-left transition-colors"
          >
            View all {comments.length} comments
          </button>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {displayedComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onLike={() => onLikeComment(comment.id)}
                onReply={(content) => onReply(comment.id, content)}
                level={0}
              />

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10">
                  {!expandedReplies.has(comment.id) ? (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      View replies ({comment.replies.length})
                    </button>
                  ) : (
                    <>
                      {comment.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onLike={() => onLikeComment(reply.id)}
                          onReply={(content) => onReply(reply.id, content)}
                          level={1}
                          isNested
                        />
                      ))}
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        Hide replies
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};
