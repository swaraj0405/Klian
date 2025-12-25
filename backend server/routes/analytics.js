const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Get full analytics dashboard data
router.get('/', protect, analyticsController.getAnalytics);

// Get real-time stats (for live updates)
router.get('/realtime', protect, analyticsController.getRealTimeStats);

module.exports = router;
