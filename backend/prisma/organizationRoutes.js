const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  // For now, we'll pass through - you can add proper auth later
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

// Create organization
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, code, type, contactEmail, contactPhone, address } = req.body;
    
    const org = await prisma.organization.create({
      data: {
        name,
        code,
        type,
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
router.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
