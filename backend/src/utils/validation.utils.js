// Validation Utilities

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, errors: ['Email is required'] };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, errors: ['Invalid email format'] };
  }

  return { valid: true };
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Validate site code
 */
const validateSiteCode = (code) => {
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['Site code is required'] };
  }

  if (code.length < 3 || code.length > 50) {
    errors.push('Site code must be between 3 and 50 characters');
  }

  if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.push('Site code must contain only uppercase letters, numbers, hyphens, and underscores');
  }

  const parts = code.split('-');
  if (parts.length < 2 || parts.length > 3) {
    errors.push('Site code must include 1-2 hyphens');
  }

  if (!/^[A-Z]/.test(code)) {
    errors.push('Site code must start with a letter');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Validate ATP code
 */
const validateATPCode = (code) => {
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['ATP code is required'] };
  }

  if (!/^ATP-/.test(code)) {
    errors.push('ATP code must start with "ATP-"');
  }

  if (code.length < 5 || code.length > 50) {
    errors.push('ATP code must be between 5 and 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateSiteCode,
  validateATPCode
};
