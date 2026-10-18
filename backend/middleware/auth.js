const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Verify only with the deployment's configured secret. A fallback turns a
// public source string into a token-signing key.
function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Protect routes - require JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      code: 'TOKEN_MISSING', 
      message: 'Not authorized. Please log in.' 
    });
  }

  try {
    const decoded = verifyToken(token);
    let user = null;

    // 1. Try finding in MongoDB if active
    if (global.USE_MONGODB) {
      try {
        if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
          user = await User.findById(decoded.id).select('-password');
        }
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
      } catch (dbErr) {
        console.warn('MongoDB user lookup error in protect:', dbErr.message);
      }
    }

    // 2. Fallback to mockDb (or if MongoDB not active or user not found)
    if (!user) {
      const mockDb = require('../utils/mockDb');
      user = (mockDb.users || []).find(u => 
        (decoded.id && String(u._id) === String(decoded.id)) || 
        (decoded.email && u.email && u.email.toLowerCase() === decoded.email.toLowerCase())
      );
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        code: 'USER_NOT_FOUND', 
        message: 'Your user account could not be found. Please log in again.' 
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false, 
        code: 'ACCOUNT_DEACTIVATED', 
        message: 'Your account has been deactivated.' 
      });
    }

    // Normalize the database-backed role. Never promote based on e-mail or a
    // claim embedded in the token.
    if (user.role) {
      user.role = String(user.role).toLowerCase();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        code: 'TOKEN_EXPIRED', 
        message: 'Your admin session has expired. Please log in again.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      code: 'TOKEN_INVALID', 
      message: 'Your admin session is invalid or expired. Please log in again.' 
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = verifyToken(token);
      let user = null;
      if (global.USE_MONGODB) {
        if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
          user = await User.findById(decoded.id).select('-password');
        }
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
      }
      if (!user) {
        const mockDb = require('../utils/mockDb');
        user = (mockDb.users || []).find(u => 
          (decoded.id && String(u._id) === String(decoded.id)) || 
          (decoded.email && u.email && u.email.toLowerCase() === decoded.email.toLowerCase())
        );
      }
      req.user = user;
    } catch {}
  }
  next();
};

module.exports = { protect, optionalAuth };
