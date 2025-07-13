const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, profileUrl } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, profileUrl });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileUrl: user.profileUrl
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(token);
    
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, profileUrl: user.profileUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// ... existing code ...
<<<<<<< HEAD

=======
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
>>>>>>> 2fb4438495bdb0a6051a59c9950525d0cc0fd50b

// Middleware to protect routes
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

// Get all users except current
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router; 
