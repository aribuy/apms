const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

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
    const { task_code } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${task_code}_${timestamp}${ext}`);
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

// Upload individual ATP document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const { task_code, site_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find the task
    const task = await prisma.tasks.findFirst({
      where: { task_code }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create document record (if you have documents table)
    // For now, just update task with document path
    await prisma.tasks.update({
      where: { id: task.id },
      data: {
        result_data: {
          document_path: file.path,
          original_name: file.originalname,
          uploaded_at: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document_path: file.filename,
      task_code
    });

  } catch (error) {
    console.error('Upload error:', error);
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
    console.error('Check document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check document',
      error: error.message
    });
  }
});

module.exports = router;