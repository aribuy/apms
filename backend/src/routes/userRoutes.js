const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLogger');
const { validateBody } = require('../middleware/validator');
const { userCreateSchema, userUpdateSchema } = require('../validations/user');
const { permissionsUpdateSchema, userRoleUpdateSchema } = require('../validations/userPermissions');

router.use(authenticateToken);

const signatureDir = path.join(process.cwd(), 'uploads', 'signatures');
if (!fs.existsSync(signatureDir)) {
  fs.mkdirSync(signatureDir, { recursive: true });
}

const signatureUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, signatureDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `signature-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

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
  { id: '11', email: 'mw.vendor@gmail.com', username: 'mw.vendor', name: 'MW Vendor Engineer', role: 'VENDOR_MW', status: 'ACTIVE', userType: 'VENDOR', contactNumber: '+62-812-3456-7892' },
  { id: '12', email: 'qa.engineer@xlsmart.co.id', username: 'qa.engineer', name: 'QA Engineer', role: 'QA_ENGINEER', status: 'ACTIVE', userType: 'CUSTOMER', contactNumber: '+62-21-2345-6795' }
];

// Get all users
router.get('/', async (req, res) => {
  try {
    if (prisma && prisma.$queryRaw) {
      const users = await prisma.$queryRaw`
        SELECT
          id,
          email,
          username,
          name,
          contact_number as "contactNumber",
          "userType" as "userType",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users
        ORDER BY email ASC
      `;
      return res.json({ success: true, data: users });
    }
  } catch (error) {
    console.error('DB user list failed, fallback to test users:', error.message);
  }

  res.json({ success: true, data: testUsers });
});

// Create user  
router.post('/create', validateBody(userCreateSchema), async (req, res) => {
  const { email, username, name, userType, status, contactNumber, role } = req.body;

  if (!email || !username) {
    return res.status(400).json({ success: false, error: 'email and username are required' });
  }

  try {
    if (prisma && prisma.$queryRaw) {
      const [created] = await prisma.$queryRaw`
        INSERT INTO users (
          id,
          email,
          username,
          name,
          contact_number,
          "userType",
          role,
          status,
          created_at,
          updated_at
        ) VALUES (
          'user_' || regexp_replace(lower(${email}), '[^a-z0-9]+', '_', 'g'),
          ${email},
          ${username},
          ${name},
          ${contactNumber || null},
          ${userType || 'INTERNAL'},
          ${role || null},
          ${status || 'ACTIVE'},
          NOW(),
          NOW()
        )
        RETURNING
          id,
          email,
          username,
          name,
          contact_number as "contactNumber",
          "userType" as "userType",
          status
      `;

      await logAuditEvent({
        userId: req.user?.id,
        action: 'CREATE',
        resource: 'user',
        resourceId: created?.id,
        newData: created,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.json({ success: true, data: created });
    }
  } catch (error) {
    console.error('DB user create failed:', error.message);
  }

  const newUser = {
    id: (testUsers.length + 1).toString(),
    email,
    username,
    name,
    role: 'USER',
    status: status || 'ACTIVE',
    userType: userType || 'INTERNAL',
    contactNumber
  };
  testUsers.push(newUser);
  await logAuditEvent({
    userId: req.user?.id,
    action: 'CREATE',
    resource: 'user',
    resourceId: newUser.id,
    newData: newUser,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({ success: true, data: newUser });
});

// Update user
router.put('/update/:id', validateBody(userUpdateSchema), async (req, res) => {
  const { id } = req.params;
  const { email, username, name, userType, status, contactNumber, role } = req.body;

  try {
    if (prisma && prisma.$queryRaw) {
      const updated = await prisma.$queryRaw`
        UPDATE users
        SET
          email = COALESCE(${email}, email),
          username = COALESCE(${username}, username),
          name = COALESCE(${name}, name),
          contact_number = COALESCE(${contactNumber}, contact_number),
          "userType" = COALESCE(${userType}, "userType"),
          role = COALESCE(${role}, role),
          status = COALESCE(${status}, status),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING
          id,
          email,
          username,
          name,
          contact_number as "contactNumber",
          "userType" as "userType",
          status
      `;

      if (!updated || updated.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await logAuditEvent({
        userId: req.user?.id,
        action: 'UPDATE',
        resource: 'user',
        resourceId: updated[0]?.id,
        newData: updated[0],
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.json({ success: true, data: updated[0] });
    }
  } catch (error) {
    console.error('DB user update failed:', error.message);
  }

  const userIndex = testUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  testUsers[userIndex] = {
    ...testUsers[userIndex],
    email: email ?? testUsers[userIndex].email,
    username: username ?? testUsers[userIndex].username,
    name: name ?? testUsers[userIndex].name,
    userType: userType ?? testUsers[userIndex].userType,
    status: status ?? testUsers[userIndex].status,
    contactNumber: contactNumber ?? testUsers[userIndex].contactNumber
  };

  await logAuditEvent({
    userId: req.user?.id,
    action: 'UPDATE',
    resource: 'user',
    resourceId: testUsers[userIndex].id,
    newData: testUsers[userIndex],
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({ success: true, data: testUsers[userIndex] });
});

// Upload signature image (current user)
router.post('/profile/signature', signatureUpload.single('signature'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Signature file is required' });
    }

    if (prisma && prisma.$queryRaw) {
      const [updated] = await prisma.$queryRaw`
        UPDATE users
        SET signature = ${req.file.path},
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, name, signature
      `;

      return res.json({ success: true, data: updated });
    }

    const userIndex = testUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      testUsers[userIndex].signature = req.file.path;
      return res.json({ success: true, data: testUsers[userIndex] });
    }

    return res.status(404).json({ success: false, error: 'User not found' });
  } catch (error) {
    console.error('Signature upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload signature' });
  }
});

// Delete user
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (prisma && prisma.$queryRaw) {
      const removed = await prisma.$queryRaw`
        DELETE FROM users
        WHERE id = ${id}
        RETURNING id
      `;

      if (!removed || removed.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await logAuditEvent({
        userId: req.user?.id,
        action: 'DELETE',
        resource: 'user',
        resourceId: removed[0]?.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.json({ success: true, message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('DB user delete failed:', error.message);
  }

  const userIndex = testUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  testUsers.splice(userIndex, 1);
  await logAuditEvent({
    userId: req.user?.id,
    action: 'DELETE',
    resource: 'user',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

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
    { id: 'ROH', name: 'ROH', description: 'Power and dismantle review L1' },
    { id: 'PMO', name: 'PMO', description: 'Dismantle drop final approval' },
    { id: 'QA_ENGINEER', name: 'QA Engineer', description: 'ATP QA Approval and rectification validation' },
    { id: 'PIC', name: 'PIC', description: 'Punchlist owner approval' },
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
router.post('/permissions', validateBody(permissionsUpdateSchema, { stripUnknown: false }), (req, res) => {
  const { permissions } = req.body;
  permissionMappings = permissions;
  res.json({ success: true, message: 'Permissions updated successfully' });
});

router.put('/:id/role', validateBody(userRoleUpdateSchema), (req, res) => {
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
