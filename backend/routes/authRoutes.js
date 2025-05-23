const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: process.env.JWT_ALGORITHM || 'HS256'
};

// Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = {};

  if (!username?.trim()) errors.username = 'Username is required';
  if (!email?.trim()) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors 
    });
  }
  
  // Sanitize inputs
  req.body.username = username.trim();
  req.body.email = email.toLowerCase().trim();
  next();
};

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authLimiter, validateRegisterInput, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log(`Registration attempt for: ${email}`);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      JWT_CONFIG.secret,
      { 
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithm 
      },
      (err, token) => {
        if (err) {
          console.error('JWT Error:', err);
          return res.status(500).json({ 
            success: false,
            message: 'Error generating authentication token' 
          });
        }
        
        res.status(201).json({
          success: true,
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration Error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).reduce((acc, e) => {
        acc[e.path] = e.message;
        return acc;
      }, {});
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide both email and password' 
    });
  }

  try {
    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Use the model's matchPassword method to compare passwords
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log(`Login attempt failed: Invalid password for email ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last seen and online status
    user.lastSeen = new Date();
    user.online = true;
    await user.save();

    // Generate JWT token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, JWT_CONFIG.secret, { 
      expiresIn: JWT_CONFIG.expiresIn,
      algorithm: JWT_CONFIG.algorithm
    });

    // Get user data without password
    const userData = user.toJSON();

    console.log(`Login successful for user: ${user.email}`);

    res.json({ 
      success: true,
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login Error:', {
      message: err.message,
      stack: err.stack,
      email: email
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/auth/verify
// @desc    Verify JWT and return user data
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Verify Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;