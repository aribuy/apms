const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const { validateBody } = require('../middleware/validator');
const { scopeCreateSchema } = require('../validations/scope');

// Get all ATP scopes
router.get('/', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    const result = await client.query(
      'SELECT id, name, description, is_active FROM atp_scopes WHERE is_active = true ORDER BY name'
    );
    await client.end();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching scopes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scopes'
    });
  }
});

// Create new scope
router.post('/', validateBody(scopeCreateSchema), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    await prisma.$executeRaw`
      INSERT INTO atp_scopes (name, description) 
      VALUES (${name}, ${description})
    `;
    
    res.json({
      success: true,
      message: 'Scope created successfully'
    });
  } catch (error) {
    console.error('Error creating scope:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create scope'
    });
  }
});

module.exports = router;
