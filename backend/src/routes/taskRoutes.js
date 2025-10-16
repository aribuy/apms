const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get tasks (all or pending based on query)
router.get('/', async (req, res) => {
  const { status } = req.query;
  
  // Mock data for testing
  const mockTasks = [
    {
      id: '1',
      taskCode: 'TASK-2025-00001',
      taskType: 'ATP_UPLOAD',
      title: 'Process ATP Document Upload - ATP-2025-0001',
      description: 'MW Installation ATP document from vendor needs document control processing',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
      createdAt: new Date().toISOString(),
      assignedUser: { name: 'Document Control', email: 'doc.control@aviat.com' }
    },
    {
      id: '2', 
      taskCode: 'TASK-2025-00002',
      taskType: 'ATP_UPLOAD',
      title: 'Process ATP Document Upload - ATP-2025-0002',
      description: 'Hardware ATP document from ZTE vendor needs document control processing',
      status: 'completed',
      priority: 'normal',
      dueDate: new Date(Date.now() + 48*60*60*1000).toISOString(),
      createdAt: new Date(Date.now() - 12*60*60*1000).toISOString(),
      assignedUser: { name: 'Document Control', email: 'doc.control@aviat.com' }
    },
    {
      id: '3',
      taskCode: 'TASK-2025-00003', 
      taskType: 'ATP_UPLOAD',
      title: 'Process ATP Document Upload - ATP-2025-0003',
      description: 'Software ATP document from HTI vendor needs document control processing',
      status: 'pending',
      priority: 'normal',
      dueDate: new Date(Date.now() + 36*60*60*1000).toISOString(),
      createdAt: new Date(Date.now() - 6*60*60*1000).toISOString(),
      assignedUser: { name: 'Document Control', email: 'doc.control@aviat.com' }
    }
  ];
  
  const filteredTasks = status === 'pending' 
    ? mockTasks.filter(t => t.status === 'pending')
    : mockTasks;
    
  res.json({ success: true, data: filteredTasks });
});

// Complete task (perform task)
router.post('/:id/complete', async (req, res) => {
  res.json({ success: true, message: 'Task completed successfully' });
});

module.exports = router;