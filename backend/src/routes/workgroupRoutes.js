const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware
const authenticateToken = (req, res, next) => {
  req.user = { id: 'system' };
  next();
};

// Get all workgroups
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const workgroups = await prisma.workgroup.findMany({
      include: {
        organization: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    
    res.json({ success: true, data: workgroups });
  } catch (error) {
    console.error('Error fetching workgroups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single workgroup
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const workgroup = await prisma.workgroup.findUnique({
      where: { id: req.params.id },
      include: {
        organization: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true
              }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    
    if (!workgroup) {
      return res.status(404).json({ success: false, error: 'Workgroup not found' });
    }
    
    res.json({ success: true, data: workgroup });
  } catch (error) {
    console.error('Error fetching workgroup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create workgroup
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const workgroup = await prisma.workgroup.create({
      data: {
        ...req.body,
        createdBy: req.user.id
      },
      include: {
        organization: true,
        _count: {
          select: { members: true }
        }
      }
    });
    
    res.json({ success: true, data: workgroup });
  } catch (error) {
    console.error('Error creating workgroup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update workgroup
router.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const workgroup = await prisma.workgroup.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        workgroupType: req.body.workgroupType,
        classification: req.body.classification,
        category: req.body.category,
        maxMembers: req.body.maxMembers,
        status: req.body.status,
        email: req.body.email
      },
      include: {
        organization: true,
        _count: {
          select: { members: true }
        }
      }
    });
    
    res.json({ success: true, data: workgroup });
  } catch (error) {
    console.error('Error updating workgroup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete workgroup
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    // Check if workgroup has members
    const memberCount = await prisma.workgroupMember.count({
      where: { workgroupId: req.params.id }
    });
    
    if (memberCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete workgroup with existing members' 
      });
    }
    
    await prisma.workgroup.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'Workgroup deleted successfully' });
  } catch (error) {
    console.error('Error deleting workgroup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add member to workgroup
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    // Check if user is already a member
    const existing = await prisma.workgroupMember.findFirst({
      where: {
        workgroupId: req.params.id,
        userId: req.body.userId
      }
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'User is already a member of this workgroup' 
      });
    }
    
    // Check max members limit
    const workgroup = await prisma.workgroup.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });
    
    if (workgroup._count.members >= workgroup.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Workgroup has reached maximum member limit' 
      });
    }
    
    const member = await prisma.workgroupMember.create({
      data: {
        workgroupId: req.params.id,
        userId: req.body.userId,
        memberRole: req.body.memberRole || 'member',
        addedBy: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove member from workgroup
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    await prisma.workgroupMember.deleteMany({
      where: {
        workgroupId: req.params.id,
        userId: req.params.userId
      }
    });
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
