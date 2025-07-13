require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth.js');
const messageRoutes = require('./routes/message.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Chat app backend is running!');
});

// MongoDB connection
const mongoURI = process.env.MONGO_URI ;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('sendMessage', (data) => {
    // data: { sender, receiver, content }
    io.to(data.receiver).emit('receiveMessage', data);
  });

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
