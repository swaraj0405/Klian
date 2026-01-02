import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
import { usePosts, useCreatePost } from '../hooks/usePosts';
import { MOCK_POSTS, MOCK_BROADCASTS } from '../constants';
import { Post, Broadcast, Role } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { SuggestedUsers } from '../components/SuggestedUsers';
import { TrendingTopics } from '../components/TrendingTopics';
import { BroadcastCard } from '../components/BroadcastCard';
import { FeedPostCard } from '../components/FeedPostCard';
import { Card } from '../components/ui/Card';
import { CreatePostCard } from '../components/CreatePostCard';
import { CreatePostModal } from '../components/CreatePostModal';

const PostSkeleton: React.FC = () => (
    <Card className="mb-4">
        <div className="flex items-center space-x-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
        <Skeleton className="h-4 w-5/6 mx-4 mb-2" />
        <Skeleton className="h-4 w-4/6 mx-4 mb-4" />
        <Skeleton className="w-full h-[400px] rounded-none" />
        <div className="p-2 flex justify-around">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
        </div>
    </Card>
);


type FeedItem = (Post & { type: 'post' }) | (Broadcast & { type: 'broadcast' });


export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { data: postsData = [], isLoading, isFetching, isError } = usePosts();
  const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
  const { mutate: createPost } = useCreatePost();
  const { socket } = useSocket();

  // Transform API posts to feed items - memoized to prevent infinite loops
  const feedItems = React.useMemo(() => {
    if (!user || !postsData) return [];

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const userId = typeof user._id === 'string' ? user._id : user._id?.toString();

      // Convert DB posts to FeedItems with normalized user data
      const postsForFeed: FeedItem[] = postsData.map((p: any) => {
        const postUserId = typeof p.user._id === 'string' ? p.user._id : p.user._id?.toString();
        return {
          id: p._id || p.id,
          author: {
            id: p.user._id || p.user.id,
            name: p.user.name,
            username: p.user.email?.split('@')[0] || '',
            email: p.user.email,
            avatar: p.user.profilePicture || p.user.avatar || '',
            coverPhoto: p.user.coverPhoto || '',
            bio: p.user.bio || '',
            role: p.user.role,
            createdAt: p.user.createdAt || new Date().toISOString(),
          },
          content: p.content,
          image: p.image,
          timestamp: p.createdAt || p.timestamp,
          likes: p.likes?.length || 0,
          comments: p.comments?.length || 0,
          isLiked: p.likes?.some((like: any) => {
            const likeId = typeof like._id === 'string' ? like._id : like._id?.toString();
            return likeId === userId || like === userId;
          }),
          type: 'post'
        };
      });

      // Add mock broadcasts
      const broadcastsForFeed: FeedItem[] = MOCK_BROADCASTS.map(b => ({ ...b, type: 'broadcast' }));

      // Combine and sort
      const combinedFeed = [...postsForFeed, ...broadcastsForFeed];

      combinedFeed.sort((a, b) => {
        const aIsRecentBroadcast = a.type === 'broadcast' && new Date(a.timestamp) > twentyFourHoursAgo;
        const bIsRecentBroadcast = b.type === 'broadcast' && new Date(b.timestamp) > twentyFourHoursAgo;
        if (aIsRecentBroadcast && !bIsRecentBroadcast) return -1;
        if (!aIsRecentBroadcast && bIsRecentBroadcast) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      console.log('[React Query] Feed computed with', postsForFeed.length, 'posts');
      return combinedFeed;
    } catch (error) {
      console.error('Error transforming posts:', error);
      
      // Fallback to mock data if transformation fails
      const postsForFeed: FeedItem[] = MOCK_POSTS.map(p => ({ ...p, type: 'post' }));
      const broadcastsForFeed: FeedItem[] = MOCK_BROADCASTS.map(b => ({ ...b, type: 'broadcast' }));
      return [...postsForFeed, ...broadcastsForFeed];
    }
  }, [postsData, user?._id, user?.name]); // Only depend on primitive user values
  
  // Listen for real-time post updates via Socket
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-post', (newPost) => {
      console.log('[Socket] New post received:', newPost);
    });
    
    return () => {
      socket.off('new-post');
    };
  }, [socket]);

  const handleCreatePost = async (content: string, image?: string) => {
    if (!content.trim() && !image || !user) return;
    
    try {
      // Use React Query mutation - optimistic update happens automatically
      createPost({
        content,
        image,
        isBroadcast: false
      }, {
        onSuccess: (newPost: any) => {
          console.log('[React Query] Post created successfully via mutation');
          setCreatePostModalOpen(false);
        },
        onError: (error: any) => {
          console.error('[React Query] Error creating post:', error);
          alert('Failed to create post. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error in handleCreatePost:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-slate-500">Loading user profile...</p>
      </div>
    );
  }
  
  const isStudent = user.role === Role.STUDENT;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <>
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
            {!isStudent && (
                <CreatePostCard user={user} onComposeClick={() => setCreatePostModalOpen(true)} />
            )}

            {isLoading ? (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            ) : feedItems.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-slate-400 mb-4 text-4xl">{ICONS.messages}</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">Be the first to share something!</p>
                </Card>
            ) : (
                feedItems.map((item, index) => {
                    if (item.type === 'post') {
                        return (
                            <FeedPostCard 
                                key={`${item.id || index}-post`} 
                                post={item}
                                onDelete={(postId) => {
                                    // Post deletion is handled by React Query cache invalidation
                                    console.log('[React Query] Post deleted, cache will update automatically:', postId);
                                }}
                            />
                        );
                    } else {
                        const isPinned = new Date(item.timestamp) > twentyFourHoursAgo;
                        return <BroadcastCard key={`${item.id || index}-broadcast`} broadcast={item} isPinned={isPinned} />;
                    }
                })
            )}
      </div>
      <aside className="hidden lg:block lg:col-span-4">
        <div className="sticky top-8 space-y-6">
            <SuggestedUsers />
            <TrendingTopics />
        </div>
      </aside>
    </div>
    <CreatePostModal 
        isOpen={isCreatePostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        user={user}
        onPost={handleCreatePost}
    />
    </>
  );
};