const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get all users (for chat)
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== Users API Call ===');
    console.log('Request headers:', req.headers);
    console.log('Authenticated user ID:', req.user._id);
    
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar online lastSeen bio');
    
    console.log('MongoDB Query Result:', {
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        hasAvatar: !!u.avatar,
        online: u.online,
        hasLastSeen: !!u.lastSeen
      }))
    });

    res.json(users);
  } catch (error) {
    console.error('Error in /api/users:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 