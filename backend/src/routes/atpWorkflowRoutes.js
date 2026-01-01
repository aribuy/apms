const express = require('express');
const router = express.Router();

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.error('Error initializing Prisma:', error);
}
const { validateBody } = require('../middleware/validator');
const {
  reviewDecisionSchema,
  punchlistCompleteSchema,
  assignReviewerSchema
} = require('../validations/atpWorkflow');

// ATP Workflow Configuration
const WORKFLOW_CONFIG = {
  RAN_MW: {
    stages: [
      { code: 'FOP_RTS_REVIEW', name: 'FOP/RTS Field Review', role: 'FOP_RTS', sla_hours: 48 },
      { code: 'REGION_REVIEW', name: 'Region Team Review', role: 'REGION_TEAM', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'RTH Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },
  PLN_UPGRADE: {
    stages: [
      { code: 'ROH_REVIEW', name: 'ROH Review', role: 'ROH', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'RTH Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },
  DISMANTLE_DROP: {
    stages: [
      { code: 'FOP_RTS_REVIEW', name: 'FOP/RTS Field Review', role: 'FOP_RTS', sla_hours: 48 },
      { code: 'REGION_REVIEW', name: 'Region Team Review', role: 'REGION_TEAM', sla_hours: 48 },
      { code: 'PMO_REVIEW', name: 'PMO Final Approval', role: 'PMO', sla_hours: 48 }
    ]
  },
  DISMANTLE_KEEP: {
    stages: [
      { code: 'ROH_REVIEW', name: 'ROH Review', role: 'ROH', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'RTH Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },
  SOFTWARE_LICENSE: {
    stages: [
      { code: 'BO_REVIEW', name: 'Business Operations Review', role: 'BO', sla_hours: 48 },
      { code: 'SME_REVIEW', name: 'SME Technical Review', role: 'SME', sla_hours: 48 },
      { code: 'HEAD_NOC_REVIEW', name: 'Head NOC Final Review', role: 'HEAD_NOC', sla_hours: 24 }
    ]
  }
};

// Initialize ATP workflow
router.post('/initialize/:atpId', async (req, res) => {
  try {
    const { atpId } = req.params;
    const { workflow_type = 'SOFTWARE_LICENSE' } = req.body;

    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId }
    });

    if (!atp) {
      return res.status(404).json({ success: false, error: 'ATP document not found' });
    }

    const stages = WORKFLOW_CONFIG[workflow_type]?.stages || WORKFLOW_CONFIG.SOFTWARE_LICENSE.stages;
    
    // Create review stages
    const reviewStages = [];
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + stage.sla_hours);

      const reviewStage = await prisma.atp_review_stages.create({
        data: {
          atp_id: atpId,
          stage_number: i + 1,
          stage_code: stage.code,
          stage_name: stage.name,
          assigned_role: stage.role,
          sla_deadline: slaDeadline,
          review_status: i === 0 ? 'pending' : 'waiting'
        }
      });
      reviewStages.push(reviewStage);
    }

    // Update ATP document
    await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        workflow_path: workflow_type,
        current_stage: stages[0].name,
        current_status: 'in_review'
      }
    });

    res.json({
      success: true,
      data: {
        workflow_type,
        stages: reviewStages,
        message: `${workflow_type} workflow initialized with ${stages.length} stages`
      }
    });
  } catch (error) {
    console.error('Error initializing workflow:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize workflow' });
  }
});

// Get pending reviews by role
router.get('/reviews/pending', async (req, res) => {
  try {
    const { role, reviewer_id } = req.query;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Role parameter required' });
    }

    const pendingReviews = await prisma.atp_review_stages.findMany({
      where: {
        assigned_role: role,
        review_status: 'pending',
        ...(reviewer_id && { reviewer_id })
      },
      include: {
        atp_documents: {
          select: {
            id: true,
            atp_code: true,
            site_id: true,
            document_type: true,
            final_category: true,
            submission_date: true,
            submitted_by: true,
            file_name: true
          }
        }
      },
      orderBy: { sla_deadline: 'asc' }
    });

    // Calculate SLA status
    const now = new Date();
    const reviewsWithSLA = pendingReviews.map(review => ({
      ...review,
      sla_status: review.sla_deadline < now ? 'overdue' : 
                 (review.sla_deadline.getTime() - now.getTime()) < (6 * 60 * 60 * 1000) ? 'urgent' : 'normal',
      hours_remaining: Math.max(0, Math.floor((review.sla_deadline.getTime() - now.getTime()) / (60 * 60 * 1000)))
    }));

    res.json({
      success: true,
      data: reviewsWithSLA,
      count: reviewsWithSLA.length,
      stats: {
        total: reviewsWithSLA.length,
        overdue: reviewsWithSLA.filter(r => r.sla_status === 'overdue').length,
        urgent: reviewsWithSLA.filter(r => r.sla_status === 'urgent').length
      }
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending reviews' });
  }
});

// Submit review decision
router.post('/reviews/:reviewStageId/decision', validateBody(reviewDecisionSchema), async (req, res) => {
  try {
    const { reviewStageId } = req.params;
    const { decision, comments, reviewer_id, checklist_results, punchlist_items } = req.body;

    if (!['APPROVE', 'APPROVE_WITH_PUNCHLIST', 'REJECT'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Invalid decision' });
    }

    const reviewStage = await prisma.atp_review_stages.findUnique({
      where: { id: reviewStageId },
      include: { atp_documents: true }
    });

    if (!reviewStage) {
      return res.status(404).json({ success: false, error: 'Review stage not found' });
    }

    // Update review stage
    await prisma.atp_review_stages.update({
      where: { id: reviewStageId },
      data: {
        reviewer_id,
        decision,
        comments,
        review_status: 'completed',
        review_completed_at: new Date()
      }
    });

    // Save checklist results
    if (checklist_results && checklist_results.length > 0) {
      for (const item of checklist_results) {
        await prisma.atp_checklist_items.create({
          data: {
            atp_id: reviewStage.atp_id,
            review_stage_id: reviewStageId,
            item_number: item.item_number,
            section_name: item.section_name,
            description: item.description,
            result: item.result,
            severity: item.severity,
            has_issue: item.has_issue || false,
            issue_description: item.issue_description,
            reviewer_notes: item.reviewer_notes
          }
        });
      }
    }

    // Create punchlist items if needed
    if (punchlist_items && punchlist_items.length > 0) {
      for (const item of punchlist_items) {
        const punchlistNumber = `PL-${reviewStage.atp_documents.atp_code}-${String(Date.now()).slice(-4)}`;
        await prisma.atp_punchlist_items.create({
          data: {
            atp_id: reviewStage.atp_id,
            review_stage_id: reviewStageId,
            punchlist_number: punchlistNumber,
            test_item_reference: item.test_item_reference,
            issue_category: item.issue_category,
            issue_description: item.issue_description,
            severity: item.severity,
            assigned_team: item.assigned_team,
            target_completion_date: item.target_completion_date ? new Date(item.target_completion_date) : null,
            identified_by: reviewer_id
          }
        });
      }
    }

    // Handle workflow progression
    let workflowResult;
    if (decision === 'REJECT') {
      workflowResult = await handleRejection(reviewStage.atp_id);
    } else {
      workflowResult = await progressWorkflow(reviewStage.atp_id, reviewStage.stage_number);
    }

    res.json({
      success: true,
      data: {
        review_stage: reviewStageId,
        decision,
        workflow_status: workflowResult,
        punchlist_created: punchlist_items?.length || 0
      }
    });
  } catch (error) {
    console.error('Error submitting review decision:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review decision' });
  }
});

// Progress workflow to next stage
async function progressWorkflow(atpId, currentStageNumber) {
  const nextStage = await prisma.atp_review_stages.findFirst({
    where: {
      atp_id: atpId,
      stage_number: currentStageNumber + 1
    }
  });

  if (nextStage) {
    // Activate next stage
    await prisma.atp_review_stages.update({
      where: { id: nextStage.id },
      data: { review_status: 'pending' }
    });

    await prisma.atp_documents.update({
      where: { id: atpId },
      data: { current_stage: nextStage.stage_name }
    });

    return { status: 'progressed', next_stage: nextStage.stage_name };
  } else {
    // Workflow complete
    await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        current_status: 'approved',
        approval_date: new Date(),
        completion_percentage: 100
      }
    });

    return { status: 'completed', message: 'ATP fully approved' };
  }
}

// Handle rejection
async function handleRejection(atpId) {
  await prisma.atp_documents.update({
    where: { id: atpId },
    data: {
      current_status: 'rejected',
      completion_percentage: 0
    }
  });

  // Set all pending stages to cancelled
  await prisma.atp_review_stages.updateMany({
    where: {
      atp_id: atpId,
      review_status: { in: ['pending', 'waiting'] }
    },
    data: { review_status: 'cancelled' }
  });

  return { status: 'rejected', message: 'ATP rejected - returned to vendor' };
}

// Get workflow status
router.get('/:atpId/status', async (req, res) => {
  try {
    const { atpId } = req.params;

    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId },
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        },
        atp_punchlist_items: {
          where: { status: { not: 'completed' } }
        }
      }
    });

    if (!atp) {
      return res.status(404).json({ success: false, error: 'ATP not found' });
    }

    const completedStages = atp.atp_review_stages.filter(s => s.review_status === 'completed').length;
    const totalStages = atp.atp_review_stages.length;
    const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    res.json({
      success: true,
      data: {
        atp_code: atp.atp_code,
        current_status: atp.current_status,
        current_stage: atp.current_stage,
        workflow_path: atp.workflow_path,
        progress_percentage: progressPercentage,
        stages: atp.atp_review_stages,
        active_punchlist_items: atp.atp_punchlist_items.length,
        completion_date: atp.approval_date
      }
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch workflow status' });
  }
});

// Get punchlist items
router.get('/punchlist', async (req, res) => {
  try {
    const { atp_id, status, severity, assigned_team } = req.query;

    const whereClause = {};
    if (atp_id) whereClause.atp_id = atp_id;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;
    if (assigned_team) whereClause.assigned_team = assigned_team;

    const punchlistItems = await prisma.atp_punchlist_items.findMany({
      where: whereClause,
      include: {
        atp_documents: {
          select: {
            atp_code: true,
            site_id: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { identified_at: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: punchlistItems,
      count: punchlistItems.length,
      stats: {
        critical: punchlistItems.filter(p => p.severity === 'CRITICAL').length,
        major: punchlistItems.filter(p => p.severity === 'MAJOR').length,
        minor: punchlistItems.filter(p => p.severity === 'MINOR').length
      }
    });
  } catch (error) {
    console.error('Error fetching punchlist items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch punchlist items' });
  }
});

// Complete punchlist rectification
router.post('/punchlist/:punchlistId/complete', validateBody(punchlistCompleteSchema), async (req, res) => {
  try {
    const { punchlistId } = req.params;
    const { rectification_notes, evidence_after, completed_by } = req.body;

    const punchlistItem = await prisma.atp_punchlist_items.update({
      where: { id: punchlistId },
      data: {
        status: 'rectified',
        rectification_notes,
        evidence_after: evidence_after || {},
        completed_by,
        completed_at: new Date(),
        qa_validation_status: 'pending',
        qa_validated_by: null,
        qa_validated_at: null,
        qa_validation_comments: null,
        pic_approval_status: 'pending',
        pic_approved_by: null,
        pic_approved_at: null,
        pic_approval_comments: null
      }
    });

    // Check if all punchlist items for this ATP are completed
    const remainingItems = await prisma.atp_punchlist_items.count({
      where: {
        atp_id: punchlistItem.atp_id,
        status: { not: 'rectified' }
      }
    });

    let workflowUpdate = null;
    if (remainingItems === 0) {
      // All punchlist items completed, check if we can progress workflow
      const atp = await prisma.atp_documents.findUnique({
        where: { id: punchlistItem.atp_id },
        include: {
          atp_review_stages: {
            where: { review_status: 'pending' },
            orderBy: { stage_number: 'asc' }
          }
        }
      });

      if (atp && atp.atp_review_stages.length > 0) {
        workflowUpdate = { message: 'All punchlist items completed - workflow can progress' };
      }
    }

    res.json({
      success: true,
      data: {
        punchlist_item: punchlistItem,
        remaining_items: remainingItems,
        workflow_update: workflowUpdate
      }
    });
  } catch (error) {
    console.error('Error completing punchlist rectification:', error);
    res.status(500).json({ success: false, error: 'Failed to complete rectification' });
  }
});

// Get review statistics
router.get('/stats', async (req, res) => {
  try {
    const { role, reviewer_id, date_from, date_to } = req.query;

    const dateFilter = {};
    if (date_from) dateFilter.gte = new Date(date_from);
    if (date_to) dateFilter.lte = new Date(date_to);

    const whereClause = {};
    if (role) whereClause.assigned_role = role;
    if (reviewer_id) whereClause.reviewer_id = reviewer_id;
    if (Object.keys(dateFilter).length > 0) whereClause.review_completed_at = dateFilter;

    const [
      totalReviews,
      pendingReviews,
      completedToday,
      approvedThisWeek,
      rejectedThisWeek,
      overdueReviews
    ] = await Promise.all([
      prisma.atp_review_stages.count({ where: { ...whereClause, review_status: 'completed' } }),
      prisma.atp_review_stages.count({ where: { assigned_role: role, review_status: 'pending' } }),
      prisma.atp_review_stages.count({
        where: {
          ...whereClause,
          review_completed_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.atp_review_stages.count({
        where: {
          ...whereClause,
          decision: { in: ['APPROVE', 'APPROVE_WITH_PUNCHLIST'] },
          review_completed_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.atp_review_stages.count({
        where: {
          ...whereClause,
          decision: 'REJECT',
          review_completed_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.atp_review_stages.count({
        where: {
          assigned_role: role,
          review_status: 'pending',
          sla_deadline: { lt: new Date() }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total_reviews: totalReviews,
        pending_reviews: pendingReviews,
        completed_today: completedToday,
        approved_this_week: approvedThisWeek,
        rejected_this_week: rejectedThisWeek,
        overdue_reviews: overdueReviews,
        approval_rate: totalReviews > 0 ? Math.round((approvedThisWeek / (approvedThisWeek + rejectedThisWeek)) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Bulk assign reviewer
router.post('/assign-reviewer', validateBody(assignReviewerSchema), async (req, res) => {
  try {
    const { review_stage_ids, reviewer_id } = req.body;

    if (!review_stage_ids || !Array.isArray(review_stage_ids) || !reviewer_id) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const updatedStages = await prisma.atp_review_stages.updateMany({
      where: { id: { in: review_stage_ids } },
      data: { reviewer_id }
    });

    res.json({
      success: true,
      data: {
        updated_count: updatedStages.count,
        reviewer_id
      }
    });
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    res.status(500).json({ success: false, error: 'Failed to assign reviewer' });
  }
});

module.exports = router;
