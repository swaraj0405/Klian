const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate email format based on role
    if (role === 'student' && !/^\d{10}@kluniversity\.in$/.test(email)) {
      return res.status(400).json({ 
        message: 'Student email must be in format: 10digitnumber@kluniversity.in' 
      });
    }

    if (role === 'faculty' && !/^[a-zA-Z]+@kluniversity\.in$/.test(email)) {
      return res.status(400).json({ 
        message: 'Faculty email must be in format: name@kluniversity.in' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        cabinNumber: user.cabinNumber,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        cabinNumber: user.cabinNumber,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update fields if provided in request
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;
      if (req.body.coverPhoto !== undefined) user.coverPhoto = req.body.coverPhoto;
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      
      // Only faculty can update cabin number
      if (user.role === 'faculty' && req.body.cabinNumber) {
        // Validate cabin number format (e.g., C001)
        if (/^[a-zA-Z]\d{3}$/.test(req.body.cabinNumber)) {
          user.cabinNumber = req.body.cabinNumber;
        } else {
          return res.status(400).json({ 
            message: 'Cabin number must be in format: letter followed by 3 digits (e.g., C001)' 
          });
        }
      }

      if (req.body.password !== undefined) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        coverPhoto: updatedUser.coverPhoto,
        bio: updatedUser.bio,
        cabinNumber: updatedUser.cabinNumber,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};