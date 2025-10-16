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
    const atps = await prisma.atp_documents.findMany({
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(atps || []);
  } catch (error) {
    console.error('ATP fetch error:', error);
    res.json([]);
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

// Submit ATP - create ATP with review stages (Upload permission required)
router.post('/submit', checkUploadPermission, async (req, res) => {
  try {
    const { siteId, confirmedCategory, projectCode } = req.body;
    
    const count = await prisma.atp_documents.count();
    const atpCode = `ATP-2025-${String(count + 1).padStart(4, '0')}`;
    
    // Create ATP document - starts with DOC_CONTROL
    const atp = await prisma.atp_documents.create({
      data: {
        atp_code: atpCode,
        site_id: siteId || 'DEFAULT',
        project_code: projectCode || 'DEFAULT',
        document_type: confirmedCategory || 'hardware',
        final_category: confirmedCategory || 'hardware',
        workflow_path: confirmedCategory === 'software' ? 'software' : 'hardware',
        current_stage: 'DOC_UPLOAD',
        current_status: 'pending_doc_control'
      }
    });
    
    // Create task for DOC_CONTROL
    const taskCount = await prisma.task.count();
    const taskCode = `TASK-${new Date().getFullYear()}-${String(taskCount + 1).padStart(5, '0')}`;
    
    await prisma.task.create({
      data: {
        taskCode,
        taskType: 'ATP_UPLOAD',
        title: `Upload ATP Document - ${atpCode}`,
        description: `Process and upload ATP document for site ${siteId}`,
        status: 'pending',
        priority: 'high',
        assignedTo: 'DOC_CONTROL',
        relatedAtpId: atp.id,
        dueDate: new Date(Date.now() + 24*60*60*1000)
      }
    });
    
    // Create review stages based on workflow
    const stages = confirmedCategory === 'software' 
      ? [
          { stage_number: 1, stage_code: 'STAGE_1_SW', stage_name: 'Business Operations Review', assigned_role: 'BO' },
          { stage_number: 2, stage_code: 'STAGE_2_SW', stage_name: 'SME Technical Review', assigned_role: 'SME' },
          { stage_number: 3, stage_code: 'STAGE_3_SW', stage_name: 'Head NOC Final Review', assigned_role: 'HEAD_NOC' }
        ]
      : [
          { stage_number: 1, stage_code: 'STAGE_1_HW', stage_name: 'FOP/RTS Field Review', assigned_role: 'FOP_RTS' },
          { stage_number: 2, stage_code: 'STAGE_2_HW', stage_name: 'Region Team Review', assigned_role: 'REGION_TEAM' },
          { stage_number: 3, stage_code: 'STAGE_3_HW', stage_name: 'RTH Final Approval', assigned_role: 'RTH' }
        ];

    for (const stage of stages) {
      await prisma.atp_review_stages.create({
        data: {
          atp_id: atp.id,
          ...stage,
          review_status: stage.stage_number === 1 ? 'pending' : 'waiting',
          sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
        }
      });
    }
    
    res.json({
      atpId: atp.id,
      atpCode: atp.atp_code,
      status: 'pending_doc_control',
      message: 'ATP created - awaiting Document Control processing'
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