const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { checkUploadPermission } = require('../middleware/atpAuth');
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/atp/documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Get document templates
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category, is_active: true } : { is_active: true };
    
    const templates = await prisma.atp_document_templates.findMany({
      where,
      orderBy: { template_name: 'asc' }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template by ID
router.get('/templates/:templateId', async (req, res) => {
  try {
    const template = await prisma.atp_document_templates.findUnique({
      where: { id: req.params.templateId }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Upload files for ATP document (Upload permission required)
router.post('/upload/:atpId', checkUploadPermission, upload.array('files'), async (req, res) => {
  try {
    const { atpId } = req.params;
    const { fileType = 'supporting' } = req.body;
    
    // Verify ATP exists
    const atp = await prisma.atp_documents.findUnique({
      where: { id: atpId }
    });
    
    if (!atp) {
      return res.status(404).json({ error: 'ATP document not found' });
    }
    
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const attachment = await prisma.atp_document_attachments.create({
        data: {
          atp_id: atpId,
          file_name: file.filename,
          original_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          file_type: fileType,
          uploaded_by: 'current-user' // TODO: Get from auth
        }
      });
      
      uploadedFiles.push({
        id: attachment.id,
        fileName: attachment.file_name,
        originalName: attachment.original_name,
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        uploadedAt: attachment.uploaded_at
      });
    }
    
    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get attachments for ATP document
router.get('/:atpId/attachments', async (req, res) => {
  try {
    const { atpId } = req.params;
    const { fileType } = req.query;
    
    const where = { atp_id: atpId, is_active: true };
    if (fileType) {
      where.file_type = fileType;
    }
    
    const attachments = await prisma.atp_document_attachments.findMany({
      where,
      orderBy: { uploaded_at: 'desc' }
    });
    
    res.json(attachments);
  } catch (error) {
    console.error('Attachments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Download attachment
router.get('/download/:attachmentId', async (req, res) => {
  try {
    const attachment = await prisma.atp_document_attachments.findUnique({
      where: { id: req.params.attachmentId }
    });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const filePath = attachment.file_path;
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Type', attachment.mime_type);
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete attachment
router.delete('/attachments/:attachmentId', async (req, res) => {
  try {
    const attachment = await prisma.atp_document_attachments.findUnique({
      where: { id: req.params.attachmentId }
    });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    // Mark as inactive instead of deleting
    await prisma.atp_document_attachments.update({
      where: { id: req.params.attachmentId },
      data: { is_active: false }
    });
    
    res.json({ success: true, message: 'Attachment deleted successfully' });
    
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Submit digital form data
router.post('/:atpId/form-data', async (req, res) => {
  try {
    const { atpId } = req.params;
    const { formData, templateId } = req.body;
    
    // Update ATP with form data
    const updatedAtp = await prisma.atp_documents.update({
      where: { id: atpId },
      data: {
        form_data: formData,
        template_id: templateId,
        is_digital: true,
        updated_at: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Form data saved successfully',
      atpId: updatedAtp.id
    });
    
  } catch (error) {
    console.error('Form data save error:', error);
    res.status(500).json({ error: 'Failed to save form data' });
  }
});

// Get form data
router.get('/:atpId/form-data', async (req, res) => {
  try {
    const atp = await prisma.atp_documents.findUnique({
      where: { id: req.params.atpId },
      select: {
        form_data: true,
        template_id: true,
        is_digital: true
      }
    });
    
    if (!atp) {
      return res.status(404).json({ error: 'ATP document not found' });
    }
    
    res.json(atp);
  } catch (error) {
    console.error('Form data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch form data' });
  }
});

module.exports = router;