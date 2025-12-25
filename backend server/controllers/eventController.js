const Event = require('../models/Event');

// @desc    Create a new event (faculty only)
// @route   POST /api/events
// @access  Private/Faculty
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      createdBy: req.user._id
    });

    const event = await newEvent.save();
    
    // Populate creator data
    const populatedEvent = await Event.findById(event._id).populate('createdBy', 'name email profilePicture');
    
    // Emit real-time update to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('new-event', populatedEvent);
    }
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate('createdBy', 'name email profilePicture')
      .populate('attendees', 'name email profilePicture');
    
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email profilePicture')
      .populate('attendees', 'name email profilePicture');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update event (faculty only)
// @route   PUT /api/events/:id
// @access  Private/Faculty
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the creator of the event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this event' });
    }
    
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    
    await event.save();
    
    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete event (faculty only)
// @route   DELETE /api/events/:id
// @access  Private/Faculty
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the creator of the event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this event' });
    }
    
    const eventId = event._id;
    await event.deleteOne();
    
    // Emit real-time update to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('event-deleted', eventId.toString());
    }
    
    res.json({ message: 'Event removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Attend an event
// @route   PUT /api/events/attend/:id
// @access  Private
const attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is already attending
    if (event.attendees.some(attendee => attendee.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already attending this event' });
    }
    
    event.attendees.push(req.user._id);
    
    await event.save();
    
    // Populate attendees and emit real-time update
    const updatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email profilePicture')
      .populate('attendees', 'name email profilePicture');
    
    const io = req.app.get('io');
    if (io) {
      io.emit('event-updated', updatedEvent);
    }
    
    res.json(updatedEvent.attendees);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unattend an event
// @route   PUT /api/events/unattend/:id
// @access  Private
const unattendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is not attending
    if (!event.attendees.some(attendee => attendee.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Not attending this event' });
    }
    
    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== req.user._id.toString()
    );
    
    await event.save();
    
    // Populate attendees and emit real-time update
    const updatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email profilePicture')
      .populate('attendees', 'name email profilePicture');
    
    const io = req.app.get('io');
    if (io) {
      io.emit('event-updated', updatedEvent);
    }
    
    res.json(updatedEvent.attendees);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  attendEvent,
  unattendEvent
};