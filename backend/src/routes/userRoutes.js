const router = require('express').Router();

// Test users data - ATP Process Flow (matching server.js)
const testUsers = [
  { id: '1', email: 'admin@aviat.com', username: 'admin', name: 'System Administrator', role: 'admin', status: 'ACTIVE', userType: 'INTERNAL', contactNumber: '+62-21-1234-5678' },
  { id: '2', email: 'doc.control@aviat.com', username: 'doc.control', name: 'Document Control', role: 'DOC_CONTROL', status: 'ACTIVE', userType: 'INTERNAL', contactNumber: '+62-21-1234-5679' },
  { id: '3', email: 'business.ops@xlsmart.co.id', username: 'business.ops', name: 'Business Operations', role: 'BO', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6789' },
  { id: '4', email: 'sme.team@xlsmart.co.id', username: 'sme.team', name: 'SME Team', role: 'SME', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6790' },
  { id: '5', email: 'noc.head@xlsmart.co.id', username: 'noc.head', name: 'Head NOC', role: 'HEAD_NOC', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6791' },
  { id: '6', email: 'fop.rts@xlsmart.co.id', username: 'fop.rts', name: 'FOP RTS', role: 'FOP_RTS', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6792' },
  { id: '7', email: 'region.team@xlsmart.co.id', username: 'region.team', name: 'Region Team', role: 'REGION_TEAM', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6793' },
  { id: '8', email: 'rth.head@xlsmart.co.id', username: 'rth.head', name: 'RTH Head', role: 'RTH', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6794' },
  { id: '9', email: 'vendor.zte@gmail.com', username: 'vendor.zte', name: 'ZTE Vendor', role: 'VENDOR', status: 'ACTIVE', userType: 'VENDOR', contactNumber: '+62-812-3456-7890' },
  { id: '10', email: 'vendor.hti@gmail.com', username: 'vendor.hti', name: 'HTI Vendor', role: 'VENDOR', status: 'ACTIVE', userType: 'VENDOR', contactNumber: '+62-812-3456-7891' },
  { id: '11', email: 'mw.vendor@gmail.com', username: 'mw.vendor', name: 'MW Vendor Engineer', role: 'VENDOR_MW', status: 'ACTIVE', userType: 'VENDOR', contactNumber: '+62-812-3456-7892' }
];

// Get all users
router.get('/', (req, res) => {
  res.json({ success: true, data: testUsers });
});

// Create user  
router.post('/create', (req, res) => {
  const { email, username, name, userType, status } = req.body;
  const newUser = {
    id: (testUsers.length + 1).toString(),
    email,
    username,
    name,
    role: 'USER',
    status: status || 'ACTIVE',
    userType: userType || 'INTERNAL'
  };
  testUsers.push(newUser);
  res.json({ success: true, data: newUser });
});

// Update user
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { email, username, name, userType, status } = req.body;
  const userIndex = testUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  testUsers[userIndex] = {
    ...testUsers[userIndex],
    email,
    username,
    name,
    userType,
    status
  };
  
  res.json({ success: true, data: testUsers[userIndex] });
});

// Delete user
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  const userIndex = testUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  testUsers.splice(userIndex, 1);
  res.json({ success: true, message: 'User deleted successfully' });
});

// Role management
router.get('/roles', (req, res) => {
  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'DOC_CONTROL', name: 'Document Control', description: 'ATP document processing' },
    { id: 'BO', name: 'Business Operations', description: 'Software ATP review L1' },
    { id: 'SME', name: 'SME Team', description: 'Software ATP review L2' },
    { id: 'HEAD_NOC', name: 'Head NOC', description: 'Software ATP final approval' },
    { id: 'FOP_RTS', name: 'FOP RTS', description: 'Hardware ATP review L1' },
    { id: 'REGION_TEAM', name: 'Region Team', description: 'Hardware ATP review L2' },
    { id: 'RTH', name: 'RTH Head', description: 'Hardware ATP final approval' },
    { id: 'VENDOR', name: 'Vendor', description: 'ATP document upload' },
    { id: 'VENDOR_MW', name: 'MW Vendor', description: 'MW ATP specialist upload' }
  ];
  res.json({ success: true, data: roles });
});

// Modules for permission mapping
router.get('/modules', (req, res) => {
  const modules = [
    { id: 'dashboard', name: 'Dashboard', description: 'System overview and metrics' },
    { id: 'user-management', name: 'User Management', description: 'Manage users and permissions' },
    { id: 'site-management', name: 'Site Management', description: 'Site registration and lifecycle' },
    { id: 'task-management', name: 'Task Management', description: 'Task assignments and tracking' },
    { id: 'atp-management', name: 'ATP Management', description: 'ATP workflows and processing' },
    { id: 'document-management', name: 'Document Management', description: 'Document workflows and processing' },
    { id: 'bom-management', name: 'BOM Management', description: 'Equipment and service configuration' },
    { id: 'master-data', name: 'Master Data', description: 'System configuration and lookups' },
    { id: 'system-admin', name: 'System Administration', description: 'System settings and maintenance' },
    { id: 'monitoring', name: 'Monitoring & Reporting', description: 'Analytics and system monitoring' }
  ];
  res.json({ success: true, data: modules });
});

// Permission mappings storage
let permissionMappings = [
  // Admin has access to all
  { roleId: 'admin', moduleId: 'dashboard', canAccess: true },
  { roleId: 'admin', moduleId: 'user-management', canAccess: true },
  { roleId: 'admin', moduleId: 'site-management', canAccess: true },
  { roleId: 'admin', moduleId: 'task-management', canAccess: true },
  { roleId: 'admin', moduleId: 'document-management', canAccess: true },
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

// Get permissions
router.get('/permissions', (req, res) => {
  res.json({ success: true, data: permissionMappings });
});

// Save permissions
router.post('/permissions', (req, res) => {
  const { permissions } = req.body;
  permissionMappings = permissions;
  res.json({ success: true, message: 'Permissions updated successfully' });
});

router.put('/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const userIndex = testUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  testUsers[userIndex].role = role;
  res.json({ success: true, data: testUsers[userIndex] });
});

module.exports = router;
