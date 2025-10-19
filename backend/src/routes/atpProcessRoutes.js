const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.error('Error initializing Prisma:', error);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/atp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ATP-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Submit new ATP document
router.post('/submit', upload.single('atpDocument'), async (req, res) => {
  try {
    const {
      site_id,
      document_type,
      category,
      template_id,
      vendor_id,
      submitted_by,
      submission_notes,
      form_data
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'ATP document file is required' });
    }

    // Verify site exists
    const site = await prisma.sites.findFirst({
      where: { site_id: site_id }
    });

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    // Generate ATP code
    const atpCount = await prisma.atp_documents.count({
      where: { site_id: site_id }
    });
    const atpCode = `ATP-${site_id}-${String(atpCount + 1).padStart(3, '0')}`;

    // Determine workflow path based on category
    const workflowPath = category === 'SOFTWARE' ? 'SOFTWARE' : 
                        category === 'HARDWARE' ? 'HARDWARE' : 'BOTH';

    // Create ATP document
    const atpDocument = await prisma.atp_documents.create({
      data: {
        atp_code: atpCode,
        site_id: site_id,
        document_type: document_type || 'ATP',
        detected_category: category,
        final_category: category,
        workflow_path: workflowPath,
        current_status: 'submitted',
        current_stage: 'Document Control Review',
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        vendor_id: vendor_id || 'aviat',
        submitted_by: submitted_by,
        submission_notes: submission_notes,
        template_id: template_id,
        form_data: form_data ? JSON.parse(form_data) : {},
        completion_percentage: 10
      }
    });

    // Create initial task for document control
    const docControlTask = await prisma.tasks.create({
      data: {
        site_id: site.id,
        task_type: 'ATP_DOCUMENT_CONTROL',
        title: `Document Control Review - ${atpCode}`,
        description: `Initial document control review for ATP submission ${atpCode}`,
        assigned_role: 'DOC_CONTROL',
        workflow_type: workflowPath,
        stage_number: 0,
        priority: 'normal',
        task_data: {
          atp_id: atpDocument.id,
          atp_code: atpCode,
          document_type: document_type,
          category: category
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        atp_document: atpDocument,
        initial_task: docControlTask,
        message: `ATP document ${atpCode} submitted successfully`
      }
    });
  } catch (error) {
    console.error('Error submitting ATP document:', error);
    res.status(500).json({ success: false, error: 'Failed to submit ATP document' });
  }
});

// Process document control review
router.post('/:atpId/document-control', async (req, res) => {
  try {
    const { atpId } = req.params;
    const { reviewer_id, decision, comments, detected_category, manual_override } = req.body;

    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId }
    });

    if (!atp) {
      return res.status(404).json({ success: false, error: 'ATP document not found' });
    }

    // Update ATP document with document control review
    const updatedAtp = await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        detected_category: detected_category || atp.detected_category,
        final_category: manual_override ? detected_category : atp.detected_category,
        manual_override: manual_override || false,
        override_reason: manual_override ? comments : null,
        workflow_path: detected_category || atp.workflow_path,
        current_status: decision === 'APPROVE' ? 'in_review' : 'rejected',
        completion_percentage: decision === 'APPROVE' ? 20 : 0
      }
    });

    if (decision === 'APPROVE') {
      // Initialize workflow stages
      const workflowResponse = await fetch(`http://localhost:3001/api/v1/atp/workflow/initialize/${atpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_type: updatedAtp.workflow_path })
      });

      if (!workflowResponse.ok) {
        console.error('Failed to initialize workflow');
      }
    }

    // Update document control task
    await prisma.tasks.updateMany({
      where: {
        task_data: { path: ['atp_id'], equals: atpId },
        task_type: 'ATP_DOCUMENT_CONTROL'
      },
      data: {
        status: 'completed',
        completed_at: new Date(),
        decision: decision,
        decision_comments: comments
      }
    });

    res.json({
      success: true,
      data: {
        atp_document: updatedAtp,
        decision: decision,
        workflow_initialized: decision === 'APPROVE'
      }
    });
  } catch (error) {
    console.error('Error processing document control review:', error);
    res.status(500).json({ success: false, error: 'Failed to process document control review' });
  }
});

// Get ATP documents with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      site_id, 
      status, 
      workflow_path, 
      submitted_by, 
      vendor_id,
      date_from,
      date_to,
      page = 1,
      limit = 20
    } = req.query;

    const whereClause = {};
    if (site_id) whereClause.site_id = site_id;
    if (status) whereClause.current_status = status;
    if (workflow_path) whereClause.workflow_path = workflow_path;
    if (submitted_by) whereClause.submitted_by = submitted_by;
    if (vendor_id) whereClause.vendor_id = vendor_id;

    if (date_from || date_to) {
      whereClause.submission_date = {};
      if (date_from) whereClause.submission_date.gte = new Date(date_from);
      if (date_to) whereClause.submission_date.lte = new Date(date_to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [atpDocuments, totalCount] = await Promise.all([
      prisma.atp_documents.findMany({
        where: whereClause,
        include: {
          atp_review_stages: {
            select: {
              stage_number: true,
              stage_name: true,
              review_status: true,
              sla_deadline: true
            },
            orderBy: { stage_number: 'asc' }
          },
          atp_punchlist_items: {
            where: { status: { not: 'rectified' } },
            select: { id: true, severity: true }
          }
        },
        orderBy: { submission_date: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.atp_documents.count({ where: whereClause })
    ]);

    // Add calculated fields
    const documentsWithStats = atpDocuments.map(doc => {
      const totalStages = doc.atp_review_stages.length;
      const completedStages = doc.atp_review_stages.filter(s => s.review_status === 'completed').length;
      const currentStage = doc.atp_review_stages.find(s => s.review_status === 'pending');
      
      return {
        ...doc,
        progress_percentage: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
        current_stage_info: currentStage,
        active_punchlist_count: doc.atp_punchlist_items.length,
        sla_status: currentStage && currentStage.sla_deadline < new Date() ? 'overdue' : 'on_time'
      };
    });

    res.json({
      success: true,
      data: documentsWithStats,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        total_count: totalCount,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ATP documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ATP documents' });
  }
});

// Get ATP document details
router.get('/:atpId', async (req, res) => {
  try {
    const { atpId } = req.params;

    const atpDocument = await prisma.atp_documents.findUnique({
      where: { id: atpId },
      include: {
        atp_review_stages: {
          orderBy: { stage_number: 'asc' }
        },
        atp_checklist_items: {
          orderBy: { item_number: 'asc' }
        },
        atp_punchlist_items: {
          orderBy: [
            { severity: 'desc' },
            { identified_at: 'desc' }
          ]
        },
        atp_document_attachments: true
      }
    });

    if (!atpDocument) {
      return res.status(404).json({ success: false, error: 'ATP document not found' });
    }

    // Get site information
    const site = await prisma.sites.findFirst({
      where: { site_id: atpDocument.site_id }
    });

    // Calculate progress and SLA status
    const totalStages = atpDocument.atp_review_stages.length;
    const completedStages = atpDocument.atp_review_stages.filter(s => s.review_status === 'completed').length;
    const currentStage = atpDocument.atp_review_stages.find(s => s.review_status === 'pending');
    
    const documentWithDetails = {
      ...atpDocument,
      site_info: site,
      progress_percentage: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
      current_stage_info: currentStage,
      sla_status: currentStage && currentStage.sla_deadline < new Date() ? 'overdue' : 'on_time',
      checklist_summary: {
        total_items: atpDocument.atp_checklist_items.length,
        passed: atpDocument.atp_checklist_items.filter(i => i.result === 'PASS').length,
        failed: atpDocument.atp_checklist_items.filter(i => i.result === 'FAIL').length,
        na: atpDocument.atp_checklist_items.filter(i => i.result === 'NA').length
      },
      punchlist_summary: {
        total_items: atpDocument.atp_punchlist_items.length,
        critical: atpDocument.atp_punchlist_items.filter(i => i.severity === 'CRITICAL').length,
        major: atpDocument.atp_punchlist_items.filter(i => i.severity === 'MAJOR').length,
        minor: atpDocument.atp_punchlist_items.filter(i => i.severity === 'MINOR').length,
        rectified: atpDocument.atp_punchlist_items.filter(i => i.status === 'rectified').length
      }
    };

    res.json({
      success: true,
      data: documentWithDetails
    });
  } catch (error) {
    console.error('Error fetching ATP document details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ATP document details' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { role, user_id, site_id } = req.query;

    // Base statistics
    const [
      totalSubmissions,
      pendingReviews,
      approvedDocuments,
      rejectedDocuments,
      overdueReviews,
      activePunchlistItems
    ] = await Promise.all([
      prisma.atp_documents.count(),
      prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          ...(role && { assigned_role: role })
        }
      }),
      prisma.atp_documents.count({
        where: { current_status: 'approved' }
      }),
      prisma.atp_documents.count({
        where: { current_status: 'rejected' }
      }),
      prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          sla_deadline: { lt: new Date() },
          ...(role && { assigned_role: role })
        }
      }),
      prisma.atp_punchlist_items.count({
        where: { status: { not: 'rectified' } }
      })
    ]);

    // Workflow distribution
    const workflowDistribution = await prisma.atp_documents.groupBy({
      by: ['workflow_path'],
      _count: { workflow_path: true }
    });

    // Recent activity (last 7 days)
    const recentActivity = await prisma.atp_documents.findMany({
      where: {
        submission_date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        atp_code: true,
        site_id: true,
        current_status: true,
        submission_date: true
      },
      orderBy: { submission_date: 'desc' },
      take: 10
    });

    // SLA performance
    const slaPerformance = await prisma.atp_review_stages.groupBy({
      by: ['review_status'],
      _count: { review_status: true },
      where: {
        sla_deadline: { not: null }
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_submissions: totalSubmissions,
          pending_reviews: pendingReviews,
          approved_documents: approvedDocuments,
          rejected_documents: rejectedDocuments,
          overdue_reviews: overdueReviews,
          active_punchlist_items: activePunchlistItems,
          approval_rate: totalSubmissions > 0 ? Math.round((approvedDocuments / totalSubmissions) * 100) : 0
        },
        workflow_distribution: workflowDistribution.reduce((acc, item) => {
          acc[item.workflow_path] = item._count.workflow_path;
          return acc;
        }, {}),
        recent_activity: recentActivity,
        sla_performance: slaPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
});

// Export ATP data to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { site_id, status, date_from, date_to } = req.query;

    const whereClause = {};
    if (site_id) whereClause.site_id = site_id;
    if (status) whereClause.current_status = status;
    if (date_from || date_to) {
      whereClause.submission_date = {};
      if (date_from) whereClause.submission_date.gte = new Date(date_from);
      if (date_to) whereClause.submission_date.lte = new Date(date_to);
    }

    const atpDocuments = await prisma.atp_documents.findMany({
      where: whereClause,
      include: {
        atp_review_stages: true,
        atp_punchlist_items: true
      },
      orderBy: { submission_date: 'desc' }
    });

    // Convert to CSV format
    const csvHeaders = [
      'ATP Code', 'Site ID', 'Document Type', 'Category', 'Workflow Path',
      'Current Status', 'Current Stage', 'Submitted By', 'Submission Date',
      'Approval Date', 'Progress %', 'Total Stages', 'Completed Stages',
      'Active Punchlist Items', 'SLA Status'
    ];

    const csvRows = atpDocuments.map(doc => {
      const totalStages = doc.atp_review_stages.length;
      const completedStages = doc.atp_review_stages.filter(s => s.review_status === 'completed').length;
      const currentStage = doc.atp_review_stages.find(s => s.review_status === 'pending');
      const activePunchlist = doc.atp_punchlist_items.filter(p => p.status !== 'rectified').length;
      const slaStatus = currentStage && currentStage.sla_deadline < new Date() ? 'OVERDUE' : 'ON_TIME';

      return [
        doc.atp_code,
        doc.site_id,
        doc.document_type,
        doc.final_category,
        doc.workflow_path,
        doc.current_status,
        doc.current_stage,
        doc.submitted_by,
        doc.submission_date?.toISOString().split('T')[0] || '',
        doc.approval_date?.toISOString().split('T')[0] || '',
        totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
        totalStages,
        completedStages,
        activePunchlist,
        slaStatus
      ];
    });

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="atp_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting ATP data:', error);
    res.status(500).json({ success: false, error: 'Failed to export ATP data' });
  }
});

module.exports = router;