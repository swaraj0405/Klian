const express = require('express');
const router = express.Router();
const { 
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
} = require('../controllers/groupController');
const { protect, facultyOnly } = require('../middleware/auth');

// All routes are protected
router.route('/')
  .post(protect, facultyOnly, createGroup)
  .get(protect, getGroups);

router.route('/:id')
  .get(protect, getGroupById)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

router.put('/join/:id', protect, joinGroup);
router.put('/leave/:id', protect, leaveGroup);

module.exports = router;