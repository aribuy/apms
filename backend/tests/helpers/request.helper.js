// HTTP Request Test Helper
const request = require('supertest');
const express = require('express');

// Import app after it's properly configured
let app;

/**
 * Setup Express app for testing
 */
const setupApp = () => {
  if (!app) {
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());

    // Import routes
    app.use('/api/v1/auth', require('../../src/routes/authRoutes'));
    app.use('/api/v1/atp', require('../../src/routes/atpRoutes'));
    app.use('/api/v1/sites', require('../../src/routes/siteRoutes'));
    app.use('/api/v1/tasks', require('../../src/routes/taskRoutes'));
    app.use('/api/v1/users', require('../../src/routes/userRoutes'));

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        success: false,
        error: err.message
      });
    });
  }
  return app;
};

/**
 * Make authenticated request
 */
const authenticatedRequest = (app, token) => {
  return request(app)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json');
};

/**
 * Helper to parse response
 */
const parseResponse = async (response) => {
  return {
    status: response.status,
    body: response.body,
    headers: response.headers
  };
};

module.exports = {
  setupApp,
  authenticatedRequest,
  parseResponse
};
