// Authentication Utilities
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Generate JWT token
 */
const generateToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
  } catch {
    throw new Error('Invalid token');
  }
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword
};
