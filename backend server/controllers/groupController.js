const Group = require('../models/Group');

// @desc    Create a new group (faculty only)
// @route   POST /api/groups
// @access  Private/Faculty
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newGroup = new Group({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    const group = await newGroup.save();
    
    // Populate creator data
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture');
    
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture');
    
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update group (admin only)
// @route   PUT /api/groups/:id
// @access  Private/Admin
const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is an admin of the group
    const isAdmin = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'User not authorized to update this group' });
    }
    
    group.name = name || group.name;
    group.description = description || group.description;
    
    await group.save();
    
    res.json(group);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete group (admin only)
// @route   DELETE /api/groups/:id
// @access  Private/Admin
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is an admin of the group
    const isAdmin = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'User not authorized to delete this group' });
    }
    
    await group.deleteOne();
    
    res.json({ message: 'Group removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a group
// @route   PUT /api/groups/join/:id
// @access  Private
const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is already a member
    if (group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }
    
    group.members.push({ user: req.user._id, role: 'member' });
    
    await group.save();
    
    // Populate members data
    const updatedGroup = await Group.findById(req.params.id)
      .populate('members.user', 'name email profilePicture');
    
    res.json(updatedGroup.members);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a group
// @route   PUT /api/groups/leave/:id
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member
    if (!group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }
    
    // Check if user is the only admin
    const isAdmin = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    const adminCount = group.members.filter(member => member.role === 'admin').length;
    
    if (isAdmin && adminCount === 1) {
      return res.status(400).json({ message: 'Cannot leave group as the only admin. Transfer admin role first.' });
    }
    
    // Remove user from members
    group.members = group.members.filter(
      member => member.user.toString() !== req.user._id.toString()
    );
    
    await group.save();
    
    res.json({ message: 'Left the group successfully' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
};