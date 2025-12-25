const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /@kluniversity\.in$/
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty'],
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  cabinNumber: {
    type: String,
    match: /^[a-zA-Z]\d{3}$/,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Middleware to hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user is a student (email starts with 10 digits)
UserSchema.methods.isStudent = function() {
  return this.role === 'student' && /^\d{10}@kluniversity\.in$/.test(this.email);
};

// Method to check if user is faculty
UserSchema.methods.isFaculty = function() {
  return this.role === 'faculty' && /^[a-zA-Z]+@kluniversity\.in$/.test(this.email);
};

module.exports = mongoose.model('User', UserSchema);