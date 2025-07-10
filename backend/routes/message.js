const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT auth middleware
function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, content } = req.body;
    if (!receiver || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }
    const message = new Message({
      sender: req.user.userId,
      receiver,
      content,
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.userId },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



router.get('/summary/:userId', auth, async (req, res) => {
  const userId = req.user.userId;
  const otherUserId = req.params.userId;

  try {
    const lastMessage = await Message.findOne({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .sort({ timestamp: -1 })
      .lean();

    const unseenCount = await Message.countDocuments({
      sender: otherUserId,
      receiver: userId,
      seen: false,
    });

    res.json({
      lastMessage: lastMessage || null,
      unseenCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/seen/:userId', auth, async (req, res) => {
  const currentUserId = req.user.userId;
  const senderId = req.params.userId;

  try {
    const updated = await Message.updateMany(
      { sender: senderId, receiver: currentUserId, seen: false },
      { $set: { seen: true } }
    );

    res.json({ message: 'Messages marked as seen', modifiedCount: updated.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Get a user's public profile
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router; 
