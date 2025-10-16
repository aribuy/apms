const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { ATPWorkflowEngine, WORKFLOW_STAGES, DECISIONS } = require('../utils/atpWorkflowEngine');

const prisma = new PrismaClient();

// Submit ATP review decision
router.post('/:atpId/review', async (req, res) => {
  try {
    const { atpId } = req.params;
    const { decision, punchlistItems = [], comments, reviewerRole } = req.body;
    
    // Get current ATP
    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId },
      include: { atp_review_stages: true }
    });
    
    if (!atp) {
      return res.status(404).json({ error: 'ATP not found' });
    }
    
    // Verify reviewer can review current stage
    if (!ATPWorkflowEngine.canUserReview(reviewerRole, atp.current_stage)) {
      return res.status(403).json({ error: 'Not authorized to review this stage' });
    }
    
    // Process decision
    const result = ATPWorkflowEngine.processDecision(
      atp.current_stage, 
      decision, 
      punchlistItems
    );
    
    // Create review record
    await prisma.atp_review_stages.create({
      data: {
        atp_id: atpId,
        stage_name: atp.current_stage,
        reviewer_role: reviewerRole,
        review_status: 'completed',
        decision: decision,
        comments: comments,
        punchlist_severity: result.severity,
        reviewed_at: new Date()
      }
    });
    
    // Add punchlist items if any
    if (punchlistItems.length > 0) {
      for (const item of punchlistItems) {
        await prisma.atp_punchlist_items.create({
          data: {
            atp_id: atpId,
            issue_description: item.description,
            severity: item.severity,
            category: item.category || 'general',
            status: 'open',
            created_by: reviewerRole
          }
        });
      }
    }
    
    // Update ATP status
    const nextStage = result.nextStage || WORKFLOW_STAGES.APPROVED;
    const workflowStatus = ATPWorkflowEngine.getWorkflowStatus(nextStage, result.severity);
    
    await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        current_stage: nextStage,
        current_status: result.requiresRectification ? 'pending_rectification' : 
                       nextStage === WORKFLOW_STAGES.APPROVED ? 'approved' : 'pending_review',
        workflow_status: workflowStatus,
        updated_at: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      nextStage,
      requiresRectification: result.requiresRectification,
      workflowStatus
    });
    
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get ATP workflow status
router.get('/:atpId/workflow', async (req, res) => {
  try {
    const { atpId } = req.params;
    
    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId },
      include: {
        atp_review_stages: {
          orderBy: { reviewed_at: 'asc' }
        },
        atp_punchlist_items: {
          where: { status: 'open' }
        }
      }
    });
    
    if (!atp) {
      return res.status(404).json({ error: 'ATP not found' });
    }
    
    // Get workflow path
    const workflowPath = ATPWorkflowEngine.getWorkflowPath(atp.document_type);
    
    // Build workflow status
    const workflowStatus = workflowPath.map(stage => {
      const review = atp.atp_review_stages.find(r => r.stage_name === stage);
      return {
        stage,
        stageName: stage.replace(/_/g, ' ').toUpperCase(),
        requiredRole: ATPWorkflowEngine.getRequiredRole(stage),
        status: review ? 'completed' : (stage === atp.current_stage ? 'current' : 'pending'),
        decision: review?.decision,
        reviewedAt: review?.reviewed_at,
        comments: review?.comments
      };
    });
    
    res.json({
      success: true,
      data: {
        atpId,
        currentStage: atp.current_stage,
        currentStatus: atp.current_status,
        workflowStatus: atp.workflow_status,
        workflowPath: workflowStatus,
        punchlistItems: atp.atp_punchlist_items,
        canProceed: atp.atp_punchlist_items.filter(p => p.severity === 'critical').length === 0
      }
    });
    
  } catch (error) {
    console.error('Workflow status error:', error);
    res.status(500).json({ error: 'Failed to get workflow status' });
  }
});

// Quick approve for testing
router.post('/:atpId/quick-approve', async (req, res) => {
  try {
    const { atpId } = req.params;
    
    await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        current_stage: WORKFLOW_STAGES.APPROVED,
        current_status: 'approved',
        workflow_status: 'ATP Document Full Signed',
        updated_at: new Date()
      }
    });
    
    res.json({ success: true, message: 'ATP quick approved' });
    
  } catch (error) {
    console.error('Quick approve error:', error);
    res.status(500).json({ error: 'Failed to quick approve' });
  }
});

module.exports = router;