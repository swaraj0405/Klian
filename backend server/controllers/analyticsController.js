const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');

// Get dashboard analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last6Months = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Key Metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      updatedAt: { $gte: last30Days } 
    });
    const postsToday = await Post.countDocuments({ 
      createdAt: { $gte: today } 
    });
    const messagesToday = await Message.countDocuments({ 
      createdAt: { $gte: today } 
    });

    // User Engagement (Last 6 Months) - Monthly data
    const userEngagement = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: last6Months }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0,
          name: {
            $let: {
              vars: {
                monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              },
              in: { $arrayElemAt: ['$$monthsInString', { $subtract: ['$_id.month', 1] }] }
            }
          },
          value: "$count"
        }
      }
    ]);

    // Post Activity by Role
    const postActivityByRole = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $group: {
          _id: '$authorInfo.role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: {
            $cond: [
              { $eq: ['$_id', 'student'] },
              'Students',
              'Teachers'
            ]
          },
          value: '$count'
        }
      }
    ]);

    // Add admin count if needed (admins are faculty with special permissions)
    const postActivity = postActivityByRole.map(item => ({
      ...item,
      fill: item.name === 'Students' ? '#3B82F6' : '#10B981'
    }));

    // Messaging Activity (Last 7 days)
    const messagingActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dms = await Message.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd },
        conversationId: { $exists: false }
      });

      const groupMsgs = await Message.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd },
        conversationId: { $exists: true }
      });

      messagingActivity.push({
        name: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        DMs: dms,
        Groups: groupMsgs
      });
    }

    // Additional Stats
    const totalPosts = await Post.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();

    // User Growth (Last 30 days)
    const userGrowth = await User.countDocuments({
      createdAt: { $gte: last30Days }
    });

    // Most Active Users (Top 5)
    const mostActiveUsers = await Post.aggregate([
      {
        $group: {
          _id: '$author',
          postCount: { $sum: 1 }
        }
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 0,
          name: '$userInfo.name',
          postCount: 1
        }
      }
    ]);

    res.json({
      keyMetrics: {
        totalUsers,
        activeUsers,
        postsToday,
        messagesSent: messagesToday,
        totalPosts,
        totalGroups,
        totalEvents,
        totalAnnouncements,
        userGrowth
      },
      userEngagement,
      postActivity,
      messagingActivity,
      mostActiveUsers
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get real-time stats (for live updates)
exports.getRealTimeStats = async (req, res) => {
  try {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: last5Minutes }
    });

    const recentMessages = await Message.countDocuments({
      createdAt: { $gte: last5Minutes }
    });

    const onlineUsers = await User.countDocuments({
      updatedAt: { $gte: last5Minutes }
    });

    res.json({
      recentPosts,
      recentMessages,
      onlineUsers,
      timestamp: now
    });
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    res.status(500).json({ message: 'Error fetching real-time stats', error: error.message });
  }
};
