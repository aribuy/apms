// JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Use same secret as login for consistency
const JWT_SECRET = process.env.JWT_SECRET || 'staging-jwt-secret-key-2025-different-from-production';

/**
 * Express middleware to verify JWT token and extract user info
 * Sets req.user with decoded token data if valid
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    // Extract token - handle "Bearer TOKEN" format
    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ err: error }, 'Auth middleware validation failed');
    // Token invalid, but continue without setting req.user
    // Let individual routes handle authentication
    next();
  }
};

module.exports = { authenticateToken };
