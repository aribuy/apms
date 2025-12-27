// Authentication Test Helper
const jwt = require('jsonwebtoken');

/**
 * Generate test auth token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

/**
 * Create test user and return with token
 */
const createAuthenticatedUser = async (prisma, role = 'Administrator') => {
  const timestamp = Date.now();
  const userData = {
    email: `test-${role.toLowerCase()}-${timestamp}@apms.com`,
    password: 'Test123!',
    name: `Test ${role}`,
    role: role,
    is_active: true
  };

  const user = await prisma.users.create({
    data: userData
  });

  const token = generateToken(user);

  return { user, token };
};

/**
 * Get auth headers for requests
 */
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

module.exports = {
  generateToken,
  createAuthenticatedUser,
  getAuthHeaders
};
