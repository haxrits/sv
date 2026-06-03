const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message'); // For saving real-time chats
const User = require('./models/User'); // For follow checking

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// --------------- Middleware ---------------
// Security Headers
app.use(helmet());

// Rate Limiting (Prevent Brute Force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Expose Socket.io to routes (useful for broadcasting events from standard HTTP routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --------------- Routes ---------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SocialVibe API + Sockets is running 🚀' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// --------------- Realtime WebSockets ---------------

// Keep track of connected users (Map: userId -> socketId)
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // User logs in / connects
  socket.on('register_user', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} registered socket ${socket.id}`);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });

  // Chat Messaging
  socket.on('send_message', async (data) => {
    try {
      const { sender, receiver, text } = data;
      
      // Access Control: check if accepted follow relation exists
      const senderUser = await User.findById(sender);
      const receiverUser = await User.findById(receiver);

      if (!senderUser || !receiverUser) return;

      const isAccepted = senderUser.following.some(id => id.toString() === receiverUser._id.toString()) ||
                         senderUser.followers.some(id => id.toString() === receiverUser._id.toString());

      if (!isAccepted) {
        console.log(`Blocked socket chat: User ${sender} cannot chat with User ${receiver}`);
        socket.emit('chat_blocked', { message: 'You can only chat with accepted follow relationships' });
        return;
      }

      // Save message to database
      const newMessage = await Message.create({ sender, receiver, text });
      // Populate sender data for the receiver's UI
      await newMessage.populate('sender', 'username profilePic');
      
      // Send to specific receiver if they are online
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', newMessage);
      }
      
      // Also send back to sender for client-side confirmation
      socket.emit('receive_message', newMessage);
      
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Typing Indicators
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('display_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('hide_typing', { senderId });
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`❌ User ${disconnectedUserId} disconnected`);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API & Sockets available at http://localhost:${PORT}`);
});
