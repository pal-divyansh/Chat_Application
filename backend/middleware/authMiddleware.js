// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT token and attach user to request
 */
const auth = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    // 2. Check if token exists and is in correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in Authorization header');
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, authorization denied' 
      });
    }

    // 3. Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('No token provided after Bearer');
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    // 4. Verify token
    let decoded;
    try {
      // Make sure JWT_SECRET is set in your .env file
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }
      
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log the decoded token for debugging (remove in production)
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
      
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token payload: missing userId');
      }
      
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired, please login again',
          error: 'Token expired'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token, please login again',
          error: 'Invalid token'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: jwtError.message
      });
    }

    // 5. Find user by ID from token
    try {
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
      }

      // 6. Attach user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = auth;