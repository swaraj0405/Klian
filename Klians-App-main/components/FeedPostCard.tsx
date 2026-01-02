import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';
import { Avatar } from './ui/Avatar';
import { ICONS } from '../constants';
import { Card } from './ui/Card';
import { postsAPI } from '../src/api/posts';
import { messagesAPI } from '../src/api/messages';
import { useAuth } from '../hooks/useAuth';
import { ShareModal } from './ShareModal';
import { LikesModal } from './LikesModal';
import { CommentModal } from './CommentModal';

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const interval = seconds / 86400;
    if (interval > 7) return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return `${hours}h ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return `${minutes}m ago`;
    return 'Just now';
};

const parseMarkdownToHTML = (text: string | undefined): string => {
  if (!text) return '';
  
  let escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  escapedText = escapedText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>');
    
  // Match hashtags and wrap them in links
  escapedText = escapedText.replace(/(#\w+)/g, '<a href="#" class="text-red-500 hover:underline">$1</a>');

  return escapedText;
};

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
}> = ({ icon, label, onClick, isActive }) => {
    const activeClasses = 'text-red-500 dark:text-red-400';
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? activeClasses : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};


export const FeedPostCard: React.FC<{ post: Post; onDelete?: (postId: string) => void }> = ({ post, onDelete }) => {
    const { user } = useAuth();
    
    // Safety check: ensure post.author exists
    if (!post.author) {
        return null;
    }
    
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentCount, setCommentCount] = useState(post.comments);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [likes, setLikes] = useState<User[]>([]);

    const handleLike = async () => {
        if (isLikeLoading) return;
        
        if (!post.id) {
            console.error('Post ID is missing');
            alert('Error: Post ID is missing');
            return;
        }
        
        setIsLikeLoading(true);
        const previousLiked = isLiked;
        const previousCount = likeCount;
        
        // Optimistically update UI first
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        
        try {
            if (isLiked) {
                await postsAPI.unlikePost(post.id);
            } else {
                await postsAPI.likePost(post.id);
            }
        } catch (error: any) {
            console.error('Error toggling like:', error);
            // Reset to previous state on error
            setIsLiked(previousLiked);
            setLikeCount(previousCount);
            
            // Show user-friendly error message
            if (error.response?.status === 400) {
                const message = error.response?.data?.message;
                if (message?.includes('already liked')) {
                    // This is fine - post is already liked, just update UI
                    setIsLiked(true);
                    return;
                } else if (message?.includes('has not yet been liked')) {
                    // Post hasn't been liked yet, just update UI
                    setIsLiked(false);
                    return;
                }
            }
            
            alert('Unable to process your like. Please try again.');
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleShowLikes = async () => {
        try {
            const response = await postsAPI.getPost(post.id);
            if (response.data && response.data.likes) {
                setLikes(response.data.likes);
                setShowLikesModal(true);
            }
        } catch (error) {
            console.error('Error fetching likes:', error);
            alert('Unable to load likes. Please try again.');
        }
    };
    
    const handleCommentClick = async () => {
        // Modal will load comments when opened
        setShowCommentsModal(true);
    };
    
    const handleCommentAdded = () => {
        setCommentCount(prev => prev + 1);
    };

    const handleDeletePost = async () => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await postsAPI.deletePost(post.id);
            setShowOptionsMenu(false);
            if (onDelete) {
                onDelete(post.id);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Check if current user is the post author and is faculty
    const isOwnPost = user ? post.author.email === user.email : false;
    const isFaculty = user ? user.role === 'faculty' : false;

    return (
        <Card className="mb-4">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                    <Avatar src={post.author.avatar} alt={post.author.name} size="md" />
                    <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{post.author.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{post.author.username} · {timeAgo(post.timestamp)}</p>
                    </div>
                </div>
                {/* More Options Button */}
                <div className="relative">
                    <button 
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        className="p-2 -mr-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {ICONS.moreHorizontal}
                    </button>

                    {/* Options Dropdown Menu */}
                    {showOptionsMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 min-w-max">
                            {isOwnPost && isFaculty && (
                                <button
                                    onClick={handleDeletePost}
                                    disabled={isDeleting}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {ICONS.trash}
                                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                                </button>
                            )}
                            {!isOwnPost && (
                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg">
                                    Report Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Post Content */}
            <div 
                className="px-4 pb-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(post.content) }}
             />

            {/* Post Image */}
            {post.image && (
                <div className="bg-slate-200 dark:bg-slate-700">
                    <img
                        src={post.image}
                        alt={post.imageDescription || 'Post image'}
                        className="w-full h-auto max-h-[400px] object-cover"
                    />
                </div>
            )}

            {/* Stats */}
            {(likeCount > 0 || commentCount > 0) && (
                 <div className="flex justify-between items-center px-4 pt-3 text-sm text-slate-500 dark:text-slate-400">
                    <button
                        onClick={handleShowLikes}
                        className="hover:text-red-500 hover:underline transition-colors"
                    >
                        {likeCount.toLocaleString()} Likes
                    </button>
                    <span>{commentCount.toLocaleString()} Comments</span>
                </div>
            )}
           
            {/* Actions */}
            <div className="px-2 py-1 mt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-around items-center">
                    <ActionButton
                        icon={isLiked ? React.cloneElement(ICONS.likeSolid, { className: "h-5 w-5" }) : ICONS.like}
                        label="Like"
                        onClick={handleLike}
                        isActive={isLiked}
                    />
                     <ActionButton
                        icon={ICONS.comment}
                        label="Comment"
                        onClick={handleCommentClick}
                    />
                     <ActionButton
                        icon={ICONS.share}
                        label="Share"
                        onClick={async () => {
                            setIsShareModalOpen(true);
                        }}
                    />
                </div>
            </div>
            
            {/* Comment Modal */}
            <CommentModal
                isOpen={showCommentsModal}
                onClose={() => setShowCommentsModal(false)}
                postId={post.id}
                initialComments={comments}
                onCommentAdded={handleCommentAdded}
            />

            {/* Likes Modal */}
            <LikesModal
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
                likes={likes}
                title="Likes"
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={async (recipientEmail, message, shareType) => {
                    const postId = post.id || post._id;
                    if (!postId) {
                        throw new Error('Invalid post ID');
                    }

                    try {
                        // Search for user by email
                        const searchResponse = await messagesAPI.searchByEmail(recipientEmail);
                        if (!searchResponse.data || searchResponse.data.length === 0) {
                            throw new Error(`User with email ${recipientEmail} not found`);
                        }

                        const recipientId = searchResponse.data[0]._id;
                        
                        // Share post via messaging system
                        const shareMessage = message || `Check out this post: ${post.content?.substring(0, 50)}...`;
                        await messagesAPI.sharePost(recipientId, postId, shareMessage);
                    } catch (error: any) {
                        throw new Error(error.message || 'Failed to share post');
                    }
                }}
            />
        </Card>
    );
};