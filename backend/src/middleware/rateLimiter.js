const rateLimit = require('express-rate-limit');

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: message }
  });

const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later.'
});

const refreshLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many token refresh attempts, please try again later.'
});

const workspaceCreationLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many workspace creation attempts, please try again later.'
});

const workspaceMemberLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many member management attempts, please try again later.'
});

module.exports = {
  loginLimiter,
  refreshLimiter,
  workspaceCreationLimiter,
  workspaceMemberLimiter
};
