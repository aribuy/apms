const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
// UUID will be generated differently

// Configure multer for file uploads
const upload = multer({ 
  dest: '/tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
const authenticateToken = (req, res, next) => {
  req.user = { id: 'system' };
  next();
};

// Bulk upload organizations
router.post('/organizations/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row
        for (const row of results) {
          try {
            await prisma.organization.create({
              data: {
                id: require('crypto').randomUUID(),
                name: row.name,
                code: row.code,
                type: row.type || 'vendor',
                status: row.status || 'active',
                contactEmail: row.contactEmail || null,
                contactPhone: row.contactPhone || null,
                address: row.address || null
              }
            });
          } catch (error) {
            errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
          }
        }
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        if (errors.length > 0) {
          res.json({ success: false, errors, imported: results.length - errors.length });
        } else {
          res.json({ success: true, imported: results.length });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload workgroups
router.post('/workgroups/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          try {
            // Find organization by code
            const org = await prisma.organization.findFirst({
              where: { code: row.organizationCode }
            });
            
            if (!org) {
              errors.push(`Row ${results.indexOf(row) + 1}: Organization ${row.organizationCode} not found`);
              continue;
            }
            
            await prisma.workgroup.create({
              data: {
                id: require('crypto').randomUUID(),
                name: row.name,
                organizationId: org.id,
                workgroupType: row.workgroupType || 'internal',
                classification: row.classification || 'team',
                category: row.category || null,
                maxMembers: parseInt(row.maxMembers) || 100,
                status: row.status || 'active',
                createdBy: req.user.id
              }
            });
          } catch (error) {
            errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
          }
        }
        
        fs.unlinkSync(req.file.path);
        
        if (errors.length > 0) {
          res.json({ success: false, errors, imported: results.length - errors.length });
        } else {
          res.json({ success: true, imported: results.length });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload users
router.post('/users/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          try {
            await prisma.user.create({
              data: {
                id: require('crypto').randomUUID(),
                email: row.email,
                username: row.username,
                firstName: row.firstName || null,
                lastName: row.lastName || null,
                phoneNumber: row.phoneNumber || null,
                role: row.role || 'user',
                isActive: row.isActive === 'true' || row.isActive === '1',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          } catch (error) {
            errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
          }
        }
        
        fs.unlinkSync(req.file.path);
        
        if (errors.length > 0) {
          res.json({ success: false, errors, imported: results.length - errors.length });
        } else {
          res.json({ success: true, imported: results.length });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download templates
router.get('/:type/template', authenticateToken, (req, res) => {
  const templates = {
    organizations: 'name,code,type,status,contactEmail,contactPhone,address\n' +
                   'PT ABC Company,ABC,vendor,active,contact@abc.com,+62812345678,Jakarta\n' +
                   'PT XYZ Corp,XYZ,customer,active,info@xyz.com,+62898765432,Surabaya',
    
    workgroups: 'name,organizationCode,workgroupType,classification,category,maxMembers,status\n' +
                'Operations Team,ABC,internal,team,Operations,50,active\n' +
                'Support Team,XYZ,external,functional_group,Support,30,active',
    
    users: 'email,username,firstName,lastName,phoneNumber,role,isActive\n' +
           'john@example.com,john.doe,John,Doe,+628123456789,admin,true\n' +
           'jane@example.com,jane.smith,Jane,Smith,+628198765432,user,true'
  };
  
  const template = templates[req.params.type];
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}_template.csv"`);
  res.send(template);
});

module.exports = router;
