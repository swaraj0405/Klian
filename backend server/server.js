const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import socket handlers
const setupMessageHandlers = require('./socket/messageHandlers');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join rooms based on user role and ID
  socket.on('join', (userData) => {
    if (userData.id) {
      socket.join(userData.id); // Join personal room for private messages
    }
    socket.join('all-users');
    if (userData.role) {
      socket.join(`role-${userData.role}`);
    }
    console.log(`User joined: ${userData.name}, Role: ${userData.role}`);
  });

  // Set up message handlers
  setupMessageHandlers(io, socket);

  // Handle new announcement
  socket.on('new-announcement', (data) => {
    console.log('New announcement broadcast:', data);
    // Broadcast to all users
    io.emit('announcement-created', data);
  });

  // Handle announcement read
  socket.on('announcement-read', (data) => {
    console.log('Announcement marked as read:', data);
    io.emit('announcement-read', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to our routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic route
app.get('/', (req, res) => {
  res.send('KL University API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});