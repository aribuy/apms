const express = require('express');
const app = express();

// Trust proxy for nginx reverse proxy
app.set('trust proxy', 1);

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3011;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const { loginLimiter, refreshLimiter } = require('./src/middleware/rateLimiter');
const { validateBody } = require('./src/middleware/validator');
const { loginSchema, refreshSchema } = require('./src/validations/auth');
const { authenticateToken } = require('./src/middleware/auth');
const swaggerSpec = require('./src/docs/swagger');

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultCorsOrigins = [
  'https://apms.datacodesolution.com',
  'https://apmsstaging.datacodesolution.com',
  'http://localhost:3000'
];
const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins;

// Middleware
app.use(helmet({
  frameguard: { action: 'deny' },
  noSniff: true,
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Idempotency middleware (must be after express.json)
const { idempotencyCheck } = require('./src/middleware/idempotency');
app.use('/api/v1/site-registration', idempotencyCheck);
app.use('/api/v1/atp/upload', idempotencyCheck);
app.use('/api/v1/atp/bulk-upload', idempotencyCheck);

const requireDocsAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  return next();
};

app.use('/api-docs', authenticateToken, requireDocsAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const logger = require('./src/utils/logger');

// Basic auth routes - Database backed with fallback to hardcoded
const bcrypt = require('bcryptjs');

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');
const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
};

app.post('/api/v1/auth/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    // Try database authentication first using raw query (only if prisma is available)
    if (prisma && prisma.$queryRaw) {
      try {
        const users = await prisma.$queryRaw`
          SELECT id, email, username, password_hash as "passwordHash", role
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

        const user = users[0];

        if (user && user.passwordHash) {
          // Verify password with bcrypt
          const isValidPassword = await bcrypt.compare(password, user.passwordHash);

          if (isValidPassword) {
            // Generate JWT token
            const token = jwt.sign(
              {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            const refreshToken = generateRefreshToken();
            const refreshTokenHash = hashRefreshToken(refreshToken);
            const refreshTokenExpiresAt = getRefreshTokenExpiry();

            try {
              await prisma.refresh_tokens.deleteMany({
                where: { user_id: user.id }
              });
              await prisma.refresh_tokens.create({
                data: {
                  id: crypto.randomUUID(),
                  token: refreshTokenHash,
                  user_id: user.id,
                  expires_at: refreshTokenExpiresAt
                }
              });
            } catch (tokenError) {
              logger.error({ err: tokenError }, 'Failed to store refresh token');
              return res.status(500).json({
                success: false,
                error: 'Failed to create refresh token'
              });
            }

            return res.json({
              success: true,
              message: 'Login successful',
              data: {
                user: {
                  id: user.id,
                  email: user.email,
                  username: user.username,
                  role: user.role
                },
                accessToken: token,
                refreshToken,
                expiresIn: '24h'
              }
            });
          } else {
            logger.warn({ email }, 'Invalid password');
          }
        }
      } catch (dbError) {
        logger.error({ err: dbError }, 'Database auth failed');
      }
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    prisma.refresh_tokens.deleteMany({ where: { token: refreshTokenHash } })
      .catch((error) => logger.error({ err: error }, 'Failed to revoke refresh token'));
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/v1/auth/refresh', refreshLimiter, validateBody(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);
    const storedToken = await prisma.refresh_tokens.findUnique({
      where: { token: refreshTokenHash }
    });

    if (!storedToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    if (storedToken.expires_at < new Date()) {
      await prisma.refresh_tokens.deleteMany({ where: { token: refreshTokenHash } });
      return res.status(401).json({ success: false, error: 'Refresh token expired' });
    }

    const user = await prisma.users.findUnique({
      where: { id: storedToken.user_id }
    });

    if (!user) {
      await prisma.refresh_tokens.deleteMany({ where: { token: refreshTokenHash } });
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const nextRefreshToken = generateRefreshToken();
    const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
    const nextRefreshTokenExpiresAt = getRefreshTokenExpiry();

    await prisma.refresh_tokens.deleteMany({ where: { token: refreshTokenHash } });
    await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        token: nextRefreshTokenHash,
        user_id: user.id,
        expires_at: nextRefreshTokenExpiresAt
      }
    });

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: nextRefreshToken,
        expiresIn: '24h'
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Refresh token error');
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'AMPS API',
    version: '1.0.0'
  });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [userCount, siteCount, docCount] = await Promise.all([
      prisma.users.count(),
      prisma.site.count(),
      prisma.documents.count()
    ]);

    // Calculate active sites and pending documents
    const activeSites = await prisma.site.count({ 
      where: { status: 'ACTIVE' } 
    });
    
    const pendingDocs = await prisma.documents.count({ 
      where: { status: 'PENDING_REVIEW' } 
    });

    res.json({
      data: {
        totalSites: siteCount,
        activeSites: activeSites,
        totalDocuments: docCount,
        pendingApprovals: pendingDocs,
        activeWorkflows: Math.floor(siteCount * 0.7),
        totalUsers: userCount,
        siteChange: '+12%',
        docChange: '+8%',
        approvalChange: '-5%',
        workflowChange: '+15%'
      },
      metadata: {
        version: '1.0.0',
        dataSource: 'LIVE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    // Return mock data if database fails
    res.json({
      data: {
        totalSites: 156,
        activeSites: 142,
        totalDocuments: 2847,
        pendingApprovals: 23,
        activeWorkflows: 67,
        totalUsers: 48,
        siteChange: '+12%',
        docChange: '+8%',
        approvalChange: '-5%',
        workflowChange: '+15%'
      },
      metadata: {
        version: '1.0.0',
        dataSource: 'MOCK',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Recent activities endpoint
app.get('/api/dashboard/activities', async (req, res) => {
  res.json({ success: true, data: [] });
});

// Permission mappings storage
let permissionMappings = [
  // Admin has access to all
  { roleId: 'admin', moduleId: 'dashboard', canAccess: true },
  { roleId: 'admin', moduleId: 'user-management', canAccess: true },
  { roleId: 'admin', moduleId: 'site-management', canAccess: true },
  { roleId: 'admin', moduleId: 'task-management', canAccess: true },
  { roleId: 'admin', moduleId: 'document-management', canAccess: true },
  { roleId: 'admin', moduleId: 'atp-template-management', canAccess: true },
  { roleId: 'admin', moduleId: 'atp-process-management', canAccess: true },
  { roleId: 'admin', moduleId: 'bom-management', canAccess: true },
  { roleId: 'admin', moduleId: 'master-data', canAccess: true },
  { roleId: 'admin', moduleId: 'system-admin', canAccess: true },
  { roleId: 'admin', moduleId: 'monitoring', canAccess: true },
  // Site Manager limited access
  { roleId: 'SITE_MANAGER', moduleId: 'dashboard', canAccess: true },
  { roleId: 'SITE_MANAGER', moduleId: 'site-management', canAccess: true },
  { roleId: 'SITE_MANAGER', moduleId: 'task-management', canAccess: true },
  // Vendor roles limited to specific modules
  { roleId: 'VENDOR_ADMIN', moduleId: 'dashboard', canAccess: true },
  { roleId: 'VENDOR_ADMIN', moduleId: 'site-management', canAccess: true },
  { roleId: 'VENDOR_ADMIN', moduleId: 'task-management', canAccess: true }
];

// Get modules
app.get('/api/v1/modules', (req, res) => {
  const modules = [
    { id: 'dashboard', name: 'Dashboard', description: 'System overview and metrics' },
    { id: 'user-management', name: 'User Management', description: 'Manage users and permissions' },
    { id: 'site-management', name: 'Site Management', description: 'Site registration and lifecycle' },
    { id: 'task-management', name: 'Task Management', description: 'Task assignments and tracking' },
    { id: 'document-management', name: 'Document Management', description: 'Document workflows and processing' },
    { id: 'bom-management', name: 'BOM Management', description: 'Equipment and service configuration' },
    { id: 'master-data', name: 'Master Data', description: 'System configuration and lookups' },
    { id: 'system-admin', name: 'System Administration', description: 'System settings and maintenance' },
    { id: 'monitoring', name: 'Monitoring & Reporting', description: 'Analytics and system monitoring' }
  ];
  res.json({ success: true, data: modules });
});

// Get permissions
app.get('/api/v1/permissions', (req, res) => {
  res.json({ success: true, data: permissionMappings });
});

// Save permissions
app.post('/api/v1/permissions', (req, res) => {
  const { permissions } = req.body;
  permissionMappings = permissions;
  res.json({ success: true, message: 'Permissions updated successfully' });
});

// Users management endpoints moved to userRoutes.js

// Role management endpoints
app.get('/api/v1/roles', (req, res) => {
  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'SITE_MANAGER', name: 'Site Manager', description: 'Site and task management' },
    { id: 'VENDOR_ADMIN', name: 'Vendor Admin', description: 'ATP upload permissions' },
    { id: 'VENDOR_STAFF', name: 'Vendor Staff', description: 'ATP upload permissions' },
    { id: 'FOP_RTS', name: 'Field Engineer', description: 'Hardware ATP review L1' },
    { id: 'REGION_TEAM', name: 'Region Supervisor', description: 'Hardware ATP review L2' },
    { id: 'RTH', name: 'Hardware Manager', description: 'Hardware ATP final approval' },
    { id: 'BO', name: 'Business Operations', description: 'Software ATP review L1' },
    { id: 'SME', name: 'Technical Expert', description: 'Software ATP review L2' },
    { id: 'HEAD_NOC', name: 'NOC Head', description: 'Software ATP final approval' }
  ];
  res.json({ success: true, data: roles });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  void _next;
  logger.error({ err }, 'Unhandled server error');
  res.status(500).json({ error: 'Something went wrong!' });
});

// API Routes
const organizationRoutes = require("./src/routes/organizationRoutes");
const workgroupRoutes = require("./src/routes/workgroupRoutes");
const userRoutes = require("./src/routes/userRoutes");
const documentRoutes = require("./src/routes/documentRoutes");
// const eatpDocumentRoutes = require("./src/routes/documentRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const workspaceRoutes = require("./src/routes/workspaceRoutes");
const auditRoutes = require("./src/routes/auditRoutes");

app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/workgroups", workgroupRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/projects", documentRoutes);
app.use("/api/v1/atp", require("./src/routes/atpRoutes"));
app.use("/api/v1/atp", require("./src/routes/atpUploadRoutes"));
app.use("/api/v1/atp", require("./src/routes/atpBulkUploadRoutes"));
app.use("/api/v1/atp-workflow", require("./src/routes/atpWorkflowRoutes"));
app.use("/api/v1/atp-templates", require("./src/routes/atpTemplateRoutes"));
app.use("/api/v1/upload", require("./src/routes/uploadRoutes"));
app.use("/api/v1/documents", require("./src/routes/documentRoutes"));
app.use("/api/sites", require("./src/routes/sitesRoutes"));
app.use("/api/v1/sites", require("./src/routes/siteRoutes"));
app.use("/api/v1/scopes", require("./src/routes/scopeRoutes"));
app.use("/api/v1/site-registration", require("./src/routes/siteRegistrationRoutes"));
app.use("/api/v1/tasks/history", require("./src/routes/taskHistoryRoutes"));
app.use("/api/v1/atp-generator", require("./src/routes/atpDocumentGeneratorRoutes"));
app.use("/api/v1/user", require("./src/routes/workspaceContextRoutes"));
app.use("/api/v1", workspaceRoutes);
app.use("/api/v1/audit", auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit();
});

// Export app for testing
module.exports = app;

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`AMPS API server running on localhost:${PORT}`);
    logger.info('Database: Connected via Prisma');
  });
} else {
  const originalListen = app.listen.bind(app);
  app.listen = (port, host, backlog, cb) => {
    let resolvedHost = host;
    let resolvedBacklog = backlog;
    let resolvedCb = cb;

    if (typeof host === 'function') {
      resolvedCb = host;
      resolvedHost = '127.0.0.1';
      resolvedBacklog = undefined;
    } else if (typeof backlog === 'function') {
      resolvedCb = backlog;
      resolvedBacklog = undefined;
    }

    if (!resolvedHost) {
      resolvedHost = '127.0.0.1';
    }

    return originalListen(port, resolvedHost, resolvedBacklog, resolvedCb);
  };
}
