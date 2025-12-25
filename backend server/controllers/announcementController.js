const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Create announcement (teachers and admins only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, target } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      author: req.user._id,
      target: target || 'All'
    });

    await announcement.save();
    await announcement.populate('author', 'name avatar role');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      message: 'Server error while creating announcement',
      error: error.message
    });
  }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    let query = {};
    
    // Admins can see all announcements
    if (req.user.role === 'Admin') {
      query = {}; // No filter needed
    } else {
      // Map backend roles to announcement target values
      const userRole = req.user.role === 'faculty' ? 'Teacher' : 'Student';
      
      // Students see: 'All' + 'Student' announcements
      // Teachers see: 'All' + 'Teacher' announcements
      query = {
        $or: [
          { target: 'All' },
          { target: userRole }
        ]
      };
    }
    
    // Fetch announcements based on user role
    const announcements = await Announcement.find(query)
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 });

    // Check if user has read each announcement
    const announcementsWithReadStatus = announcements.map(announcement => {
      const isRead = announcement.readBy.some(
        read => read.userId.toString() === req.user._id.toString()
      );
      return {
        ...announcement.toObject(),
        isRead
      };
    });

    res.json({
      announcements: announcementsWithReadStatus
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      message: 'Server error while fetching announcements',
      error: error.message
    });
  }
};

// Get unread announcements count
exports.getUnreadCount = async (req, res) => {
  try {
    let query = {
      readBy: {
        $not: {
          $elemMatch: { userId: req.user._id }
        }
      }
    };
    
    // Admins can see all unread announcements
    if (req.user.role !== 'Admin') {
      // Map backend roles to announcement target values
      const userRole = req.user.role === 'faculty' ? 'Teacher' : 'Student';
      
      // Students see: 'All' + 'Student' announcements
      // Teachers see: 'All' + 'Teacher' announcements
      query.$or = [
        { target: 'All' },
        { target: userRole }
      ];
    }
    
    // Count unread announcements based on user role
    const unreadAnnouncements = await Announcement.countDocuments(query);

    res.json({
      unreadCount: unreadAnnouncements
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      message: 'Server error while fetching unread count',
      error: error.message
    });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user has already read this
    const alreadyRead = announcement.readBy.some(
      read => read.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        userId: req.user._id
      });
      await announcement.save();
    }

    res.json({
      message: 'Announcement marked as read',
      announcement
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      message: 'Server error while marking announcement as read',
      error: error.message
    });
  }
};

// Delete announcement (author or admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    if (
      announcement.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await Announcement.findByIdAndDelete(announcementId);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      message: 'Server error while deleting announcement',
      error: error.message
    });
  }
};

// Update announcement (author or admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content, target } = req.body;

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    if (
      announcement.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this announcement' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (target) announcement.target = target;

    await announcement.save();
    await announcement.populate('author', 'name avatar role');

    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      message: 'Server error while updating announcement',
      error: error.message
    });
  }
};
