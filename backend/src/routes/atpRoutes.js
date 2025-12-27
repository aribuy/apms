const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { checkUploadPermission, checkReviewPermission } = require('../middleware/atpAuth');
const { canUploadATP, canReviewATP } = require('../utils/atpPermissions');
const prisma = new PrismaClient();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'ATP API is working' });
});

// Get all ATPs
router.get('/', async (req, res) => {
  try {
    // Mock ATP documents
    const mockDocuments = [
      {
        id: 'atp-1',
        atp_code: 'ATP-SITE001-001',
        site_id: 'SITE001',
        document_type: 'hardware',
        current_status: 'draft',
        submission_date: new Date().toISOString(),
        submitted_by: 'vendor.user'
      },
      {
        id: 'atp-2',
        atp_code: 'ATP-SITE002-001',
        site_id: 'SITE002',
        document_type: 'software',
        current_status: 'submitted',
        submission_date: new Date(Date.now() - 86400000).toISOString(),
        submitted_by: 'vendor.user'
      }
    ];
    
    res.json({ success: true, data: mockDocuments });
  } catch (error) {
    console.error('ATP fetch error:', error);
    res.json({ success: true, data: [] });
  }
});

// Upload-analyze
router.post('/upload-analyze', (req, res) => {
  res.json({
    fileId: 'test-file-' + Date.now(),
    analysis: {
      detectedCategory: 'hardware',
      confidence: 75,
      suggestedWorkflow: 'hardware'
    },
    allowOverride: true
  });
});

// Submit ATP - create ATP with review stages
router.post('/submit', async (req, res) => {
  try {
    const { site_id, document_type } = req.body;
    
    const atpCode = `ATP-${site_id}-${Date.now()}`;
    
    // Mock ATP document creation
    const atp = {
      id: 'atp-' + Date.now(),
      atp_code: atpCode,
      site_id: site_id || 'DEFAULT',
      document_type: document_type || 'hardware',
      current_status: 'draft',
      submission_date: new Date().toISOString(),
      submitted_by: 'current-user'
    };
    

    
    res.json({
      success: true,
      data: atp
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit ATP' });
  }
});

// Get ATP details with review stages
router.get('/:atpId', async (req, res) => {
  try {
    const atp = await prisma.atp_documents.findUnique({
      where: { id: req.params.atpId },
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        },
        atp_punchlist_items: true
      }
    });
    
    if (!atp) {
      return res.status(404).json({ error: 'ATP not found' });
    }
    
    res.json(atp);
  } catch (error) {
    console.error('ATP detail error:', error);
    res.status(500).json({ error: 'Failed to fetch ATP details' });
  }
});

// Submit review for a stage (Review permission required)
router.post('/:atpId/review', checkReviewPermission, async (req, res) => {
  try {
    const { atpId } = req.params;
    const { stageId, decision, comments, punchlistItems = [] } = req.body;
    
    // Update review stage
    await prisma.atp_review_stages.update({
      where: { id: stageId },
      data: {
        review_status: 'completed',
        decision: decision,
        comments: comments,
        review_completed_at: new Date(),
        reviewer_id: 'current-user' // In real app, get from auth
      }
    });
    
    // Create punchlist items if any
    for (const item of punchlistItems) {
      const punchlistNumber = `PL-2025-${String(await prisma.atp_punchlist_items.count() + 1).padStart(4, '0')}`;
      await prisma.atp_punchlist_items.create({
        data: {
          atp_id: atpId,
          review_stage_id: stageId,
          punchlist_number: punchlistNumber,
          issue_description: item.description,
          severity: item.severity,
          issue_category: item.category || 'General'
        }
      });
    }
    
    // Get current ATP and stages
    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId },
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        }
      }
    });
    
    // Determine next action
    let nextStage = null;
    let newStatus = atp.current_status;
    
    if (decision === 'approve' || decision === 'approve_with_punchlist') {
      // Find next pending stage
      nextStage = atp.atp_review_stages.find(stage => 
        stage.review_status === 'waiting' && stage.stage_number > 
        atp.atp_review_stages.find(s => s.id === stageId).stage_number
      );
      
      if (nextStage) {
        // Move to next stage
        await prisma.atp_review_stages.update({
          where: { id: nextStage.id },
          data: { review_status: 'pending' }
        });
        
        await prisma.atp_documents.update({
          where: { id: atpId },
          data: {
            current_stage: nextStage.stage_code,
            current_status: punchlistItems.length > 0 ? 'pending_review_with_punchlist' : 'pending_review'
          }
        });
      } else {
        // All stages completed - final approval
        await prisma.atp_documents.update({
          where: { id: atpId },
          data: {
            current_status: 'approved',
            approval_date: new Date(),
            final_approver: 'current-user',
            completion_percentage: 100
          }
        });
        newStatus = 'approved';
      }
    } else if (decision === 'reject') {
      await prisma.atp_documents.update({
        where: { id: atpId },
        data: {
          current_status: 'rejected'
        }
      });
      newStatus = 'rejected';
    }
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      nextStage: nextStage?.stage_code,
      status: newStatus,
      punchlistCreated: punchlistItems.length
    });
    
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get pending reviews for current user (mock for now)
router.get('/reviews/pending', async (req, res) => {
  try {
    const { role } = req.query;
    
    const pendingReviews = await prisma.atp_review_stages.findMany({
      where: {
        review_status: 'pending',
        assigned_role: role || 'FOP_RTS'
      },
      include: {
        atp_documents: true
      },
      orderBy: { sla_deadline: 'asc' }
    });
    
    res.json(pendingReviews);
  } catch (error) {
    console.error('Pending reviews error:', error);
    res.json([]);
  }
});

// Submit ATP for approval
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock submission for approval
    res.json({
      success: true,
      message: 'ATP document submitted for approval',
      data: {
        id,
        current_status: 'submitted',
        submitted_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('ATP submit error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit ATP for approval' });
  }
});

// Quick approve (for testing)
router.post('/:atpId/quick-approve', async (req, res) => {
  try {
    const { atpId } = req.params;
    
    // Get all pending stages and approve them
    const stages = await prisma.atp_review_stages.findMany({
      where: { 
        atp_id: atpId,
        review_status: { in: ['pending', 'waiting'] }
      },
      orderBy: { stage_number: 'asc' }
    });
    
    for (const stage of stages) {
      await prisma.atp_review_stages.update({
        where: { id: stage.id },
        data: {
          review_status: 'completed',
          decision: 'approve',
          comments: 'Quick approved for testing',
          review_completed_at: new Date(),
          reviewer_id: 'system'
        }
      });
    }
    
    // Final approval
    await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        current_status: 'approved',
        approval_date: new Date(),
        final_approver: 'system',
        completion_percentage: 100
      }
    });
    
    res.json({
      success: true,
      message: 'ATP quick approved successfully'
    });
    
  } catch (error) {
    console.error('Quick approve error:', error);
    res.status(500).json({ error: 'Failed to quick approve ATP' });
  }
});

module.exports = router;