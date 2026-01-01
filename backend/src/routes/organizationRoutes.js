const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validateBody } = require('../middleware/validator');
const {
  organizationCreateSchema,
  organizationUpdateSchema
} = require('../validations/organization');

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  req.user = { id: 'system' };
  next();
};

// Get all organizations
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        workgroups: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({ 
      success: true, 
      data: organizations,
      count: organizations.length 
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single organization
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        workgroups: {
          include: {
            members: true,
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });
    
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }
    
    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create organization
router.post('/create', authenticateToken, validateBody(organizationCreateSchema), async (req, res) => {
  try {
    const { name, code, type, status, contactEmail, contactPhone, address } = req.body;
    
    // Check if code already exists
    const existing = await prisma.organization.findFirst({
      where: { code: code }
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization code already exists' 
      });
    }
    
    const org = await prisma.organization.create({
      data: {
        name,
        code,
        type,
        status: status || 'active',
        contactEmail,
        contactPhone,
        address
      }
    });
    
    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update organization
router.put('/update/:id', authenticateToken, validateBody(organizationUpdateSchema), async (req, res) => {
  try {
    const { name, code, type, status, contactEmail, contactPhone, address } = req.body;
    
    // Check if organization exists
    const existing = await prisma.organization.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Organization not found' 
      });
    }
    
    // Check if new code conflicts with another org
    if (code && code !== existing.code) {
      const codeExists = await prisma.organization.findFirst({
        where: { 
          code: code,
          NOT: { id: req.params.id }
        }
      });
      
      if (codeExists) {
        return res.status(400).json({ 
          success: false, 
          error: 'Organization code already exists' 
        });
      }
    }
    
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        name,
        code,
        type,
        status,
        contactEmail,
        contactPhone,
        address
      }
    });
    
    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete organization
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    // Check if organization has workgroups
    const workgroupCount = await prisma.workgroup.count({
      where: { organizationId: req.params.id }
    });
    
    if (workgroupCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete organization with existing workgroups' 
      });
    }
    
    await prisma.organization.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
