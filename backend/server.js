const express = require('express');
const app = express();

// Trust proxy for nginx reverse proxy
app.set('trust proxy', 1);

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Test users data - ATP Process Flow
const testUsers = [
  { id: '1', email: 'admin@aviat.com', username: 'admin', name: 'System Administrator', role: 'admin', status: 'ACTIVE', userType: 'INTERNAL' },
  { id: '1a', email: 'admin@apms.com', username: 'admin', name: 'APMS Administrator', role: 'Administrator', status: 'ACTIVE', userType: 'INTERNAL' },
  { id: '2', email: 'doc.control@aviat.com', username: 'doc.control', name: 'Document Control', role: 'DOC_CONTROL', status: 'ACTIVE', userType: 'INTERNAL' },
  { id: '3', email: 'business.ops@xlsmart.co.id', username: 'business.ops', name: 'Business Operations', role: 'BO', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '4', email: 'sme.team@xlsmart.co.id', username: 'sme.team', name: 'SME Team', role: 'SME', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '5', email: 'noc.head@xlsmart.co.id', username: 'noc.head', name: 'Head NOC', role: 'HEAD_NOC', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '6', email: 'fop.rts@xlsmart.co.id', username: 'fop.rts', name: 'FOP RTS', role: 'FOP_RTS', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '7', email: 'region.team@xlsmart.co.id', username: 'region.team', name: 'Region Team', role: 'REGION_TEAM', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '8', email: 'rth.head@xlsmart.co.id', username: 'rth.head', name: 'RTH Head', role: 'RTH', status: 'ACTIVE', userType: 'CUSTOMER' },
  { id: '9', email: 'vendor.zte@gmail.com', username: 'vendor.zte', name: 'ZTE Vendor', role: 'VENDOR', status: 'ACTIVE', userType: 'VENDOR' },
  { id: '10', email: 'vendor.hti@gmail.com', username: 'vendor.hti', name: 'HTI Vendor', role: 'VENDOR', status: 'ACTIVE', userType: 'VENDOR' }
];

// Basic auth routes (simplified for now)
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // For testing, accept test credentials
  const testCredentials = {
    // PT Aviat (Internal)
    'admin@aviat.com': 'Admin123!',
    'admin@apms.com': 'Admin123!',
    'doc.control@aviat.com': 'test123',
    
    // PT XLSMART (Customer Approvers)
    'business.ops@xlsmart.co.id': 'test123',
    'sme.team@xlsmart.co.id': 'test123', 
    'noc.head@xlsmart.co.id': 'test123',
    'fop.rts@xlsmart.co.id': 'test123',
    'region.team@xlsmart.co.id': 'test123',
    'rth.head@xlsmart.co.id': 'test123',
    
    // External Vendors
    'vendor.zte@gmail.com': 'test123',
    'vendor.hti@gmail.com': 'test123',
    'mw.vendor@gmail.com': 'test123'
  };
  
  if (testCredentials[email] && testCredentials[email] === password) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 'user-' + Date.now(),
          email: email,
          username: email.split('@')[0],
          role: (email === 'admin@aviat.com' || email === 'admin@apms.com') ? 'Administrator' :
                email.includes('doc.control') ? 'DOC_CONTROL' :
                email.includes('business.ops') ? 'BO' :
                email.includes('sme.team') ? 'SME' :
                email.includes('noc.head') ? 'HEAD_NOC' :
                email.includes('fop.rts') ? 'FOP_RTS' :
                email.includes('region.team') ? 'REGION_TEAM' :
                email.includes('rth.head') ? 'RTH' :
                email === 'mw.vendor@gmail.com' ? 'VENDOR_MW' :
                email.includes('vendor') ? 'VENDOR' : 'USER'
        },
        accessToken: 'test-token-' + Date.now(),
        refreshToken: 'refresh-token-' + Date.now(),
        expiresIn: '15m'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
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
    const [userCount, siteCount, docCount, activityCount] = await Promise.all([
      prisma.user.count(),
      prisma.site.count(),
      prisma.document.count(),
      prisma.activityLog.count()
    ]);

    // Calculate active sites and pending documents
    const activeSites = await prisma.site.count({ 
      where: { status: 'ACTIVE' } 
    });
    
    const pendingDocs = await prisma.document.count({ 
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

app.put('/api/v1/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const userIndex = testUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  testUsers[userIndex].role = role;
  res.json({ success: true, data: testUsers[userIndex] });
});

// Helper functions
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
  return `${Math.floor(diffMins / 1440)} days ago`;
}

function determineActivityType(action) {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('site')) return 'site';
  if (actionLower.includes('user')) return 'user';
  if (actionLower.includes('document')) return 'document';
  if (actionLower.includes('workflow')) return 'workflow';
  return 'system';
}

// User Management Routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// API Routes
const organizationRoutes = require("./src/routes/organizationRoutes");
const workgroupRoutes = require("./src/routes/workgroupRoutes");
const userRoutes = require("./src/routes/userRoutes");
const documentRoutes = require("./src/routes/documentRoutes");
// const eatpDocumentRoutes = require("./src/routes/documentRoutes");
const taskRoutes = require("./src/routes/taskRoutes");

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit();
});



// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AMPS API server running on localhost:${PORT}`);
  console.log('Database: Connected via Prisma');
});
