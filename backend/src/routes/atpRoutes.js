const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateBody } = require('../middleware/validator');
const { atpSubmitSchema, atpReviewSchema } = require('../validations/atp');
const { checkReviewPermission } = require('../middleware/atpAuth');
const { authenticateToken } = require('../middleware/auth');
const { categorizeATPDocument } = require('../utils/atpCategorization');
const prisma = new PrismaClient();

const uploadDir = path.join(process.cwd(), 'uploads', 'atp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ATP-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

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

const SIGNATURE_CONFIGS = {
  RAN_MW: [
    { slot: 1, role: 'FOP_RTS', label: 'Approved by MS RTS' },
    { slot: 2, role: 'REGION_TEAM', label: 'Approved by XLS RTH Team' },
    { slot: 3, role: 'RTH', label: 'Approved by XLS RTH' }
  ],
  PLN_UPGRADE: [
    { slot: 1, role: 'ROH', label: 'Approved by ROH' },
    { slot: 2, role: 'RTH', label: 'Approved by XLS RTH' }
  ],
  DISMANTLE_DROP: [
    { slot: 1, role: 'FOP_RTS', label: 'Approved by MS RTS' },
    { slot: 2, role: 'REGION_TEAM', label: 'Approved by XLS RTH Team' },
    { slot: 3, role: 'PMO', label: 'Approved by PMO' }
  ],
  DISMANTLE_KEEP: [
    { slot: 1, role: 'ROH', label: 'Approved by ROH' },
    { slot: 2, role: 'RTH', label: 'Approved by XLS RTH' }
  ],
  SOFTWARE_LICENSE: [
    { slot: 1, role: 'BO', label: 'Approved by BO' },
    { slot: 2, role: 'SME', label: 'Approved by SME' },
    { slot: 3, role: 'HEAD_NOC', label: 'Approved by Head NOC' }
  ]
};

const resolveDecision = (decision) => {
  if (!decision) return null;
  return decision.toUpperCase();
};

const normalizePunchlistItems = (body = {}) => {
  let items = body.punchlistItems || body.punchlist_items || body.punchlist || [];
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (error) {
      items = [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      description: item.description || item.issue_description || item.issue || '',
      severity: item.severity || item.issue_severity || null,
      category: item.category || item.issue_category || 'General',
      assigned_team: item.assigned_team || item.assignedTeam || null
    }))
    .filter((item) => item.description);
};

const resolveWorkflowType = (category) => {
  const normalized = (category || '').toString().toUpperCase();
  if (WORKFLOW_CONFIG[normalized]) return normalized;
  if (normalized === 'SOFTWARE') return 'SOFTWARE_LICENSE';
  if (normalized === 'HARDWARE') return 'RAN_MW';
  if (normalized === 'BOTH') return 'RAN_MW';
  return 'RAN_MW';
};

const getUserContext = (req) => {
  const role = req.user?.role || req.headers['x-user-role'] || 'USER';
  const id = req.user?.id || req.headers['x-user-id'] || req.headers['x-user'] || 'unknown-user';
  return { role, id };
};

const requireRole = (req, res, roles) => {
  const { role } = getUserContext(req);
  if (!roles.includes(role)) {
    res.status(403).json({ error: 'Access denied' });
    return false;
  }
  return true;
};

const initializeWorkflow = async (atpId, workflowType) => {
  const stages = WORKFLOW_CONFIG[workflowType]?.stages || WORKFLOW_CONFIG.SOFTWARE.stages;
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

  await prisma.atp_documents.update({
    where: { id: atpId },
    data: {
      workflow_path: workflowType,
      current_stage: stages[0].name,
      current_status: 'in_review'
    }
  });

  return reviewStages;
};

const progressWorkflow = async (atpId, currentStageNumber, options = {}) => {
  const { hasPunchlist = false } = options;
  const stageNumber = Number(currentStageNumber);
  const nextStage = await prisma.atp_review_stages.findFirst({
    where: {
      atp_id: atpId,
      stage_number: Number.isNaN(stageNumber) ? currentStageNumber + 1 : stageNumber + 1
    }
  });

  if (nextStage) {
    await prisma.atp_review_stages.update({
      where: { id: nextStage.id },
      data: { review_status: 'pending' }
    });

    await prisma.atp_documents.update({
      where: { id: atpId },
      data: { current_stage: nextStage.stage_name }
    });

    return { status: 'progressed', next_stage: nextStage.stage_name };
  }

  await prisma.atp_documents.update({
    where: { id: atpId },
    data: {
      current_status: hasPunchlist ? 'approved_with_punchlist' : 'approved',
      approval_date: new Date(),
      completion_percentage: hasPunchlist ? 90 : 100
    }
  });

  return { status: 'completed', message: 'ATP fully approved' };
};

const handleRejection = async (atpId, statusOverride) => {
  await prisma.atp_documents.update({
    where: { id: atpId },
    data: {
      current_status: statusOverride || 'rejected',
      completion_percentage: 0
    }
  });

  await prisma.atp_review_stages.updateMany({
    where: {
      atp_id: atpId,
      review_status: { in: ['pending', 'waiting'] }
    },
    data: { review_status: 'cancelled' }
  });

  return { status: 'rejected', message: 'ATP rejected - returned to vendor' };
};
router.use(authenticateToken);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'ATP API is working' });
});

// Get all ATPs
router.get('/', async (req, res) => {
  try {
    const documents = await prisma.atp_documents.findMany({
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: documents });
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
router.post('/submit', upload.any(), validateBody(atpSubmitSchema), async (req, res) => {
  try {
    const { role, id: userId } = getUserContext(req);
    const siteId = req.body.site_id || req.body.siteId;
    const documentType = req.body.document_type || req.body.documentType || req.body.category;
    const requestedCategory = req.body.category || documentType || null;
    const templateId = req.body.template_id || req.body.templateId || null;
    const submissionNotes = req.body.submission_notes || req.body.submissionNotes || null;

    if (!siteId) {
      return res.status(400).json({ success: false, error: 'site_id is required' });
    }

    const site = await prisma.site.findUnique({ where: { siteId } });
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    const file = req.files?.[0] || null;
    if (!file) {
      return res.status(400).json({ success: false, error: 'ATP document file is required' });
    }

    const atpCount = await prisma.atp_documents.count({ where: { site_id: siteId } });
    const atpCode = `ATP-${siteId}-${String(atpCount + 1).padStart(3, '0')}`;
    const categorization = requestedCategory
      ? { category: requestedCategory }
      : await categorizeATPDocument(file.path, file.originalname);
    const workflowType = resolveWorkflowType(categorization.category);

    const atp = await prisma.atp_documents.create({
      data: {
        atp_code: atpCode,
        site_id: siteId,
        document_type: documentType,
        detected_category: workflowType,
        final_category: workflowType,
        workflow_path: workflowType,
        current_status: 'awaiting_qa_approval',
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        submitted_by: userId,
        submission_notes: submissionNotes,
        template_id: templateId,
        qa_pre_approval_status: 'pending'
      }
    });
    res.json({ success: true, data: atp });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit ATP' });
  }
});

// QA pre-approval queue
router.get('/qa/pending', (req, res) => {
  if (!requireRole(req, res, ['QA_ENGINEER'])) return;
  prisma.atp_documents.findMany({
    where: {
      qa_pre_approval_status: 'pending',
      current_status: 'awaiting_qa_approval'
    },
    orderBy: { created_at: 'desc' }
  }).then((docs) => {
    res.json({ success: true, data: docs });
  }).catch((error) => {
    console.error('QA pending error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch QA queue' });
  });
});

// QA pre-approval decision
router.post('/:atpId/qa/decision', async (req, res) => {
  if (!requireRole(req, res, ['QA_ENGINEER'])) return;

  try {
    const { atpId } = req.params;
    const { decision, comments } = req.body;
    const normalizedDecision = resolveDecision(decision);
    const { id: reviewerId } = getUserContext(req);

    if (!['APPROVE', 'REJECT'].includes(normalizedDecision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const atp = await prisma.atp_documents.findUnique({ where: { id: atpId } });
    if (!atp) {
      return res.status(404).json({ error: 'ATP not found' });
    }

    if (normalizedDecision === 'REJECT') {
      const updated = await prisma.atp_documents.update({
        where: { id: atpId },
        data: {
          qa_pre_approval_status: 'rejected',
          qa_pre_approved_by: reviewerId,
          qa_pre_approved_at: new Date(),
          qa_pre_approval_comments: comments || null,
          current_status: 'rejected_pre_qa'
        }
      });

      return res.json({ success: true, data: updated });
    }

    const updated = await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        qa_pre_approval_status: 'approved',
        qa_pre_approved_by: reviewerId,
        qa_pre_approved_at: new Date(),
        qa_pre_approval_comments: comments || null,
        current_status: 'in_review'
      }
    });

    const workflowType = resolveWorkflowType(updated.final_category || updated.workflow_path);
    const reviewStages = await initializeWorkflow(updated.id, workflowType);

    res.json({ success: true, data: { ...updated, review_stages: reviewStages } });
  } catch (error) {
    console.error('QA decision error:', error);
    res.status(500).json({ success: false, error: 'Failed to process QA decision' });
  }
});

// Signature config lookup
router.get('/signature-config', (req, res) => {
  const category = resolveWorkflowType(req.query.category);
  res.json({ success: true, data: SIGNATURE_CONFIGS[category] || [] });
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
router.post('/:atpId/review', checkReviewPermission, validateBody(atpReviewSchema), async (req, res) => {
  try {
    const { atpId } = req.params;
    const { role, id: reviewerId } = getUserContext(req);
    const { stageId, decision, comments, checklistItems = [] } = req.body;
    const punchlistItems = normalizePunchlistItems(req.body);
    const normalizedDecision = resolveDecision(decision);

    if (!['APPROVE', 'APPROVE_WITH_PUNCHLIST', 'REJECT'].includes(normalizedDecision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const reviewStage = await prisma.atp_review_stages.findUnique({
      where: { id: stageId },
      include: { atp_documents: true }
    });

    if (!reviewStage || reviewStage.atp_id !== atpId) {
      return res.status(404).json({ error: 'Review stage not found for ATP' });
    }

    if (reviewStage.assigned_role !== role) {
      return res.status(403).json({ error: 'Not authorized for this review stage' });
    }

    await prisma.atp_review_stages.update({
      where: { id: stageId },
      data: {
        reviewer_id: reviewerId,
        decision: normalizedDecision,
        comments,
        review_status: 'completed',
        review_completed_at: new Date()
      }
    });

    if (checklistItems && checklistItems.length > 0) {
      for (const item of checklistItems) {
        await prisma.atp_checklist_items.create({
          data: {
            atp_id: atpId,
            review_stage_id: stageId,
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

    const hasCritical = punchlistItems?.some(
      (item) => (item.severity || '').toString().toUpperCase() === 'CRITICAL'
    );

    if (punchlistItems && punchlistItems.length > 0) {
      for (const item of punchlistItems) {
        const punchlistNumber = `PL-${atpId.slice(0, 8)}-${String(Date.now()).slice(-4)}`;
        await prisma.atp_punchlist_items.create({
          data: {
            atp_id: atpId,
            review_stage_id: stageId,
            punchlist_number: punchlistNumber,
            issue_description: item.description,
            severity: item.severity,
            issue_category: item.category || 'General',
            assigned_team: item.assigned_team || null,
            identified_by: reviewerId,
            qa_validation_status: 'pending',
            pic_approval_status: 'pending'
          }
        });
      }
    }

    let workflowResult;
    if (normalizedDecision === 'REJECT' || hasCritical) {
      workflowResult = await handleRejection(atpId, 'rectification');
    } else {
      workflowResult = await progressWorkflow(atpId, reviewStage.stage_number, {
        hasPunchlist: punchlistItems.length > 0
      });
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      workflow_status: workflowResult,
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

// Get completed reviews for current role
router.get('/reviews/completed', async (req, res) => {
  try {
    const { role } = req.query;

    const completedReviews = await prisma.atp_review_stages.findMany({
      where: {
        review_status: 'completed',
        ...(role ? { assigned_role: role } : {})
      },
      include: {
        atp_documents: true
      },
      orderBy: { review_completed_at: 'desc' }
    });

    res.json(completedReviews);
  } catch (error) {
    console.error('Completed reviews error:', error);
    res.json([]);
  }
});

// Get review stats for dashboard
router.get('/reviews/stats', async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ error: 'Role parameter required' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pending, reviewedToday, approvedWeek, rejectedWeek] = await Promise.all([
      prisma.atp_review_stages.count({
        where: { assigned_role: role, review_status: 'pending' }
      }),
      prisma.atp_review_stages.count({
        where: {
          assigned_role: role,
          review_status: 'completed',
          review_completed_at: { gte: todayStart }
        }
      }),
      prisma.atp_review_stages.count({
        where: {
          assigned_role: role,
          decision: { in: ['APPROVE', 'APPROVE_WITH_PUNCHLIST'] },
          review_completed_at: { gte: weekStart }
        }
      }),
      prisma.atp_review_stages.count({
        where: {
          assigned_role: role,
          decision: 'REJECT',
          review_completed_at: { gte: weekStart }
        }
      })
    ]);

    res.json({
      pending,
      reviewedToday,
      approvedWeek,
      rejectedWeek
    });
  } catch (error) {
    console.error('Review stats error:', error);
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

// Punchlist queue for QA validation
router.get('/punchlist/pending-qa', (req, res) => {
  if (!requireRole(req, res, ['QA_ENGINEER'])) return;

  prisma.atp_punchlist_items.findMany({
    where: {
      status: 'rectified',
      qa_validation_status: 'pending'
    },
    orderBy: { updated_at: 'desc' }
  }).then((items) => {
    res.json({ success: true, data: items });
  }).catch((error) => {
    console.error('Pending QA punchlist error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch QA punchlist queue' });
  });
});

// QA decision for punchlist rectification
router.post('/punchlist/:punchlistId/qa/decision', async (req, res) => {
  if (!requireRole(req, res, ['QA_ENGINEER'])) return;

  try {
    const { punchlistId } = req.params;
    const { decision, comments } = req.body;
    const normalizedDecision = resolveDecision(decision);
    const { id: reviewerId } = getUserContext(req);

    if (!['APPROVE', 'REJECT'].includes(normalizedDecision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const status = normalizedDecision === 'APPROVE' ? 'qa_verified' : 'rejected';
    const qaStatus = normalizedDecision === 'APPROVE' ? 'approved' : 'rejected';

    const updated = await prisma.atp_punchlist_items.update({
      where: { id: punchlistId },
      data: {
        qa_validation_status: qaStatus,
        qa_validated_by: reviewerId,
        qa_validated_at: new Date(),
        qa_validation_comments: comments || null,
        status
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('QA punchlist decision error:', error);
    res.status(500).json({ success: false, error: 'Failed to process QA decision' });
  }
});

// Punchlist queue for PIC (original creator only)
router.get('/punchlist/pending-pic', (req, res) => {
  if (!requireRole(req, res, ['PIC'])) return;

  const { id: reviewerId } = getUserContext(req);

  prisma.atp_punchlist_items.findMany({
    where: {
      status: 'qa_verified',
      pic_approval_status: 'pending',
      identified_by: reviewerId
    },
    orderBy: { updated_at: 'desc' }
  }).then((items) => {
    res.json({ success: true, data: items });
  }).catch((error) => {
    console.error('Pending PIC punchlist error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch PIC punchlist queue' });
  });
});

// PIC decision for punchlist rectification
router.post('/punchlist/:punchlistId/pic/decision', async (req, res) => {
  if (!requireRole(req, res, ['PIC'])) return;

  try {
    const { punchlistId } = req.params;
    const { decision, comments } = req.body;
    const normalizedDecision = resolveDecision(decision);
    const { id: reviewerId } = getUserContext(req);

    if (!['APPROVE', 'REJECT'].includes(normalizedDecision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const punchlist = await prisma.atp_punchlist_items.findUnique({ where: { id: punchlistId } });
    if (!punchlist || punchlist.identified_by !== reviewerId) {
      return res.status(403).json({ error: 'Not authorized for this punchlist' });
    }

    const status = normalizedDecision === 'APPROVE' ? 'closed' : 'rejected';
    const picStatus = normalizedDecision === 'APPROVE' ? 'approved' : 'rejected';

    const updated = await prisma.atp_punchlist_items.update({
      where: { id: punchlistId },
      data: {
        pic_approval_status: picStatus,
        pic_approved_by: reviewerId,
        pic_approved_at: new Date(),
        pic_approval_comments: comments || null,
        status
      }
    });

    if (normalizedDecision === 'APPROVE') {
      const remaining = await prisma.atp_punchlist_items.count({
        where: {
          atp_id: updated.atp_id,
          status: { in: ['identified', 'rectified', 'qa_verified'] }
        }
      });
      if (remaining === 0 && updated.atp_id) {
        await prisma.atp_documents.update({
          where: { id: updated.atp_id },
          data: { current_status: 'completed', completion_percentage: 100 }
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('PIC punchlist decision error:', error);
    res.status(500).json({ success: false, error: 'Failed to process PIC decision' });
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
