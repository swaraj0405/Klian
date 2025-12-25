const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, image, isBroadcast } = req.body;

    // Validate that at least content or image is provided
    if (!content?.trim() && !image) {
      return res.status(400).json({ message: 'Post must have either content or an image' });
    }

    // If it's a broadcast, check if user is faculty
    if (isBroadcast && req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can create broadcasts' });
    }

    const newPost = new Post({
      user: req.user._id,
      content: content || '',
      image,
      isBroadcast: isBroadcast || false
    });

    const post = await newPost.save();
    
    // Populate user data
    const populatedPost = await Post.findById(post._id).populate('user', 'name email profilePicture coverPhoto role bio');
    
    // Emit real-time update to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('new-post', populatedPost);
    }
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    console.time('getPosts-query');
    
    // Optimized query: only populate user, don't fetch full likes/comments arrays
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email profilePicture coverPhoto role bio')
      .lean()
      .exec();
    
    console.timeEnd('getPosts-query');
    console.log(`[API] getPosts returned ${posts.length} posts`);
    
    res.json(posts);
  } catch (error) {
    console.error('[API] getPosts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get broadcasts only
// @route   GET /api/posts/broadcasts
// @access  Private
const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Post.find({ isBroadcast: true })
      .sort({ createdAt: -1 })
      .populate('user', 'name email profilePicture coverPhoto role bio')
      .populate('comments.user', 'name email profilePicture')
      .populate('likes', 'name email profilePicture');
    
    res.json(broadcasts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res) => {
  try {
    console.time('getPostById-query');
    
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email profilePicture coverPhoto role bio')
      .populate('comments.user', 'name email profilePicture')
      .select('+likes +comments')
      .lean()
      .exec();
    
    console.timeEnd('getPostById-query');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Return post with likes count but don't populate full likes array for performance
    // This saves massive bandwidth when there are 1000+ likes
    res.json({
      ...post,
      likesCount: post.likes?.length || 0,
      likes: [] // Don't send full likes array to frontend for now
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post (only post owner can delete)
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    // Faculty role check - only faculty can create and delete posts (optional additional check)
    // Removed: this is redundant since they can only delete their own posts anyway
    
    await post.deleteOne();
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/like/:id
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if post has already been liked by this user
    if (post.likes.some(like => like.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Post already liked' });
    }
    
    post.likes.unshift(req.user._id);
    
    await post.save();
    
    res.json(post.likes);
  } catch (error) {
    console.error('Error in likePost:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/unlike/:id
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if post has not been liked by this user
    if (!post.likes.some(like => like.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Post has not yet been liked' });
    }
    
    // Remove the like
    post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
    
    await post.save();
    
    res.json(post.likes);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/comment/:id
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const newComment = {
      text: req.body.text,
      user: req.user._id
    };
    
    post.comments.unshift(newComment);
    
    await post.save();
    
    // Populate the user data in comments
    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'name email profilePicture');
    
    res.json(updatedPost.comments);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/comment/:id/:comment_id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Pull out comment
    const comment = post.comments.find(comment => comment._id.toString() === req.params.comment_id);
    
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ message: 'Comment does not exist' });
    }
    
    // Check if user is comment owner or faculty
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'faculty') {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Remove comment
    post.comments = post.comments.filter(comment => comment._id.toString() !== req.params.comment_id);
    
    await post.save();
    
    res.json(post.comments);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post or comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a comment
// @route   PUT /api/posts/comment/like/:id/:comment_id
// @access  Private
const likeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = post.comments.find(comment => comment._id.toString() === req.params.comment_id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if already liked
    if (comment.likes.some(like => like.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Comment already liked' });
    }
    
    comment.likes.unshift(req.user._id);
    await post.save();
    
    res.json(post.comments);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post or comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a comment
// @route   PUT /api/posts/comment/unlike/:id/:comment_id
// @access  Private
const unlikeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = post.comments.find(comment => comment._id.toString() === req.params.comment_id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if not liked
    if (!comment.likes.some(like => like.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Comment has not been liked' });
    }
    
    comment.likes = comment.likes.filter(like => like.toString() !== req.user._id.toString());
    await post.save();
    
    res.json(post.comments);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post or comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getBroadcasts,
  getPostById,
  deletePost,
  likePost,
  unlikePost,
  commentOnPost,
  deleteComment,
  likeComment,
  unlikeComment
};