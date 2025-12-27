const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/atp-documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Extract site ID from filename or use original name
    const siteIdMatch = name.match(/^([A-Z0-9-]+)/);
    const siteId = siteIdMatch ? siteIdMatch[1] : 'UNKNOWN';
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const filename = `AVIAT_ATP_HW_${siteId}_${timestamp}_MCO-T_${randomCode}${ext}`;
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Bulk upload ATP documents
router.post('/bulk-upload', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadResults = [];
    
    for (const file of files) {
      // Extract site ID from filename (assuming format: SITEID_document.pdf)
      const filename = path.basename(file.originalname, path.extname(file.originalname));
      const siteIdMatch = filename.match(/^([A-Z0-9-]+)/);
      
      if (siteIdMatch) {
        const siteId = siteIdMatch[1];
        
        // Find corresponding task
        const task = await prisma.tasks.findFirst({
          where: {
            taskCode: {
              contains: siteId
            },
            taskType: {
              in: ['DOC_CONTROL', 'ATP_UPLOAD']
            },
            status: 'pending'
          }
        });

        if (task) {
          // Update task status to completed
          await prisma.tasks.update({
            where: { id: task.id },
            data: {
              status: 'completed',
              updatedAt: new Date()
            }
          });

          uploadResults.push({
            filename: file.originalname,
            siteId,
            taskId: task.id,
            status: 'success'
          });
        } else {
          uploadResults.push({
            filename: file.originalname,
            siteId,
            status: 'no_task_found'
          });
        }
      } else {
        uploadResults.push({
          filename: file.originalname,
          status: 'invalid_filename'
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${files.length} files`,
      results: uploadResults
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk upload',
      error: error.message
    });
  }
});

module.exports = router;