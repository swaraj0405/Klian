const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/postController');
const { protect, facultyOnly } = require('../middleware/auth');
const Post = require('../models/Post');

// All routes are protected
router.route('/')
  .post(protect, createPost)
  .get(protect, getPosts);

router.get('/broadcasts', protect, getBroadcasts);

// Specific action routes MUST come before generic /:id route
router.put('/like/:id', protect, likePost);
router.put('/unlike/:id', protect, unlikePost);

router.post('/comment/:id', protect, commentOnPost);
router.delete('/comment/:id/:comment_id', protect, deleteComment);
router.put('/comment/like/:id/:comment_id', protect, likeComment);
router.put('/comment/unlike/:id/:comment_id', protect, unlikeComment);

// Generic /:id route comes last
router.route('/:id')
  .get(protect, getPostById)
  .delete(protect, deletePost);

// Share post route
router.post('/share/:id', protect, async (req, res) => {
  try {
    const { recipientEmails } = req.body;
    if (!recipientEmails || !Array.isArray(recipientEmails)) {
      return res.status(400).json({ message: 'Recipients list is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add to post's shares array if it exists
    if (!post.shares) {
      post.shares = [];
    }
    post.shares.push({
      sharedBy: req.user.id,
      sharedWith: recipientEmails,
      sharedAt: Date.now()
    });
    await post.save();

    res.json({ message: 'Post shared successfully', post });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ 
      message: 'Server error while sharing post',
      error: error.message 
    });
  }
});

module.exports = router;