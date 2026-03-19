const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'CollabDocs Backend Running!' });
});

// Socket.io — Real-time
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(' User connected:', socket.id);

  socket.on('join-document', ({ docId, userName }) => {
    socket.join(docId);
    socket.userName = userName;
    socket.docId = docId;
    if (!activeUsers[docId]) activeUsers[docId] = [];
    activeUsers[docId] = activeUsers[docId].filter(u => u.socketId !== socket.id);
    activeUsers[docId].push({ socketId: socket.id, name: userName });
    io.to(docId).emit('online-users', activeUsers[docId]);
  });

  socket.on('send-changes', ({ docId, content }) => {
    socket.to(docId).emit('receive-changes', content);
  });

  socket.on('disconnect', () => {
    for (const docId in activeUsers) {
      activeUsers[docId] = activeUsers[docId].filter(u => u.socketId !== socket.id);
      io.to(docId).emit('online-users', activeUsers[docId]);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});