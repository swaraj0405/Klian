const express = require('express');
const router = express.Router();
const { 
  sendMessage,
  getMessagesWith,
  getConversations,
  sharePost
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.route('/')
  .post(protect, sendMessage)
  .get(protect, getConversations);

router.get('/:userId', protect, getMessagesWith);

// Share post via message
router.post('/share', protect, sharePost);

module.exports = router;