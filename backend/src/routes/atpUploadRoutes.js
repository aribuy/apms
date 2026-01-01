const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { categorizeATPDocument, getWorkflowStages, calculateSLADeadline } = require('../utils/atpCategorization');
const { convertWordToPDF, isWordDocument, cleanupTempFile } = require('../utils/documentConverter');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for individual file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/atp-documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { site_id } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    // Generate standard filename: AVIAT_ATP_HW_SITEID_TIMESTAMP_MCO-T_XXXX
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const filename = `AVIAT_ATP_HW_${site_id}_${timestamp}_MCO-T_${randomCode}${ext}`;

    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Helper function to initialize workflow stages
const initializeWorkflowStages = async (atpId, category) => {
  try {
    const stages = getWorkflowStages(category);

    if (stages.length === 0) {
      logger.warn({ category }, 'No workflow stages found for category');
      return { success: false, stagesCreated: 0 };
    }

    const reviewerMap = {
      'BO': 'business.ops@xlsmart.co.id',
      'SME': 'sme.team@xlsmart.co.id',
      'HEAD_NOC': 'noc.head@xlsmart.co.id',
      'FOP_RTS': 'fop.rts@xlsmart.co.id',
      'REGION_TEAM': 'region.team@xlsmart.co.id',
      'RTH': 'rth.head@xlsmart.co.id'
    };

    const submissionDate = new Date();

    // Create review stages
    for (let i = 0; i < stages.length; i++) {
      const stageName = stages[i];
      const slaDeadline = calculateSLADeadline(stageName, submissionDate);

      await prisma.atp_review_stages.create({
        data: {
          atp_id: atpId,
          stage_name: stageName,
          stage_number: i + 1,
          review_status: 'PENDING',
          sla_deadline: slaDeadline,
          reviewer: reviewerMap[stageName] || null
        }
      });
    }

    return { success: true, stagesCreated: stages.length };
  } catch (error) {
    logger.error({ err: error }, 'Error initializing workflow');
    return { success: false, error: error.message, stagesCreated: 0 };
  }
};

// Upload individual ATP document with auto-categorization and workflow initialization
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const { task_code, site_id } = req.body;
    const file = req.file;

    logger.info('ATP document upload started');
    logger.debug({ body: req.body }, 'ATP upload request body');
    logger.debug({ file: file ? {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    } : null }, 'ATP upload file info');

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find the task
    const task = await prisma.tasks.findFirst({
      where: { task_code },
      include: { sites: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    logger.debug({ taskCode: task.task_code, taskType: task.task_type }, 'Task found for ATP upload');

    // Step 0: Convert Word to PDF if needed
    let filePath = file.path;
    let originalFilename = file.originalname;
    let convertedFromWord = false;

    if (isWordDocument(file.originalname)) {
      logger.info('Word document detected. Converting to PDF.');
      try {
        const pdfPath = await convertWordToPDF(file.path);

        // Update file path to use converted PDF
        filePath = pdfPath;

        // Update filename to have .pdf extension
        originalFilename = path.basename(file.originalname, path.extname(file.originalname)) + '.pdf';

        // Clean up original Word file
        cleanupTempFile(file.path);

        convertedFromWord = true;
        logger.info({ pdfPath }, 'Word document successfully converted to PDF');
      } catch (conversionError) {
        logger.error({ err: conversionError }, 'Word to PDF conversion failed');
        return res.status(400).json({
          success: false,
          message: 'Failed to convert Word document to PDF. Please ensure LibreOffice is installed.',
          error: conversionError.message
        });
      }
    }

    // Step 1: Auto-categorize the document
    logger.info('Categorizing ATP document');
    const categorization = await categorizeATPDocument(
      filePath,
      originalFilename
    );

    logger.debug({ categorization }, 'ATP categorization result');

    // Step 2: Determine category (use task type as fallback)
    let finalCategory = categorization.category;

    if (finalCategory === 'UNKNOWN' || categorization.confidence < 0.6) {
      // Fallback to task type
      if (task.task_type === 'ATP_SOFTWARE') {
        finalCategory = 'SOFTWARE';
        logger.info('Using task type fallback: SOFTWARE');
      } else if (task.task_type === 'ATP_HARDWARE') {
        finalCategory = 'HARDWARE';
        logger.info('Using task type fallback: HARDWARE');
      }
    }

    logger.info({ finalCategory }, 'ATP final category selected');

    // Step 3: Create ATP document record
    logger.info('Creating ATP document record');
    const atpCode = `ATP-${site_id}-${Date.now()}`;

    // Move converted PDF to permanent location if it was converted from Word
    let finalDocumentPath = `uploads/atp-documents/${file.filename}`;

    if (convertedFromWord) {
      // If converted, move the PDF from temp_conversion to permanent location
      const uploadDir = 'uploads/atp-documents';
      const permanentPdfPath = path.join(uploadDir, path.basename(filePath));

      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, permanentPdfPath);
        finalDocumentPath = permanentPdfPath;
      }

      // Clean up temp_conversion directory if empty
      const tempDir = path.dirname(filePath);
      try {
        if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
          fs.rmdirSync(tempDir);
        }
      } catch {
        logger.warn({ tempDir }, 'Could not remove temp directory');
      }
    }

    const atpDocument = await prisma.atp_documents.create({
      data: {
        atp_code: atpCode,
        site_id: site_id || task.sites?.site_id,
        atp_type: finalCategory,
        status: 'pending_review',
        submission_date: new Date(),
        submitted_by: task.assignedTo || 'system',
        document_path: finalDocumentPath,
        file_name: originalFilename,
        task_id: task.id
      }
    });

    logger.info({ atpDocumentId: atpDocument.id }, 'ATP document created');

    // Step 4: Initialize workflow stages
    logger.info('Initializing workflow stages for ATP document');
    const workflowInit = await initializeWorkflowStages(atpDocument.id, finalCategory);

    logger.debug({ workflowInit }, 'ATP workflow initialized');

    // Step 5: Update task status
    await prisma.tasks.update({
      where: { id: task.id },
      data: {
        status: 'in_review',
        result_data: {
          document_path: `uploads/atp-documents/${file.filename}`,
          original_name: file.originalname,
          uploaded_at: new Date().toISOString(),
          atp_id: atpDocument.id,
          atp_code: atpCode,
          category: finalCategory
        }
      }
    });

    logger.info({ taskId: task.id }, 'Task status updated to in_review');
    logger.info('ATP document upload complete');

    res.json({
      success: true,
      message: convertedFromWord
        ? 'Word document converted to PDF and workflow initialized'
        : 'Document uploaded and workflow initialized',
      data: {
        atpDocument: {
          id: atpDocument.id,
          atp_code: atpCode,
          category: finalCategory,
          status: 'pending_review'
        },
        categorization: {
          category: categorization.category,
          confidence: categorization.confidence,
          method: categorization.method
        },
        workflow: {
          initialized: workflowInit.success,
          stagesCreated: workflowInit.stagesCreated,
          category: finalCategory
        },
        task_code,
        document_path: finalDocumentPath,
        converted: convertedFromWord
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'ATP upload error');
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Check existing document for task
router.get('/document/:taskCode', async (req, res) => {
  try {
    const { taskCode } = req.params;

    const task = await prisma.tasks.findFirst({
      where: { task_code: taskCode }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const documentPath = task.result_data?.document_path || null;

    res.json({
      success: true,
      document_path: documentPath,
      has_document: !!documentPath
    });

  } catch (error) {
    logger.error({ err: error }, 'Check document error');
    res.status(500).json({
      success: false,
      message: 'Failed to check document',
      error: error.message
    });
  }
});

module.exports = router;
