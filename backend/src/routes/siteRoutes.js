const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Single Site Registration
router.post('/register', async (req, res) => {
  try {
    const {
      siteId, siteName, siteType, region, province, city, district,
      address, latitude, longitude, altitude, towerHeight,
      powerType, backupPower, fiberConnection, microwaveConnection,
      contactPerson, contactPhone, contactEmail, status
    } = req.body;

    const site = await prisma.sites.create({
      data: {
        siteId, siteName, siteType, region, province, city, district,
        address, latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        altitude: altitude ? parseInt(altitude) : null,
        towerHeight: towerHeight ? parseInt(towerHeight) : null,
        powerType, backupPower, fiberConnection, microwaveConnection,
        contactPerson, contactPhone, contactEmail,
        status: status || 'PLANNING'
      }
    });

    res.json({ success: true, site });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Check Site ID availability
router.get('/check-siteid/:siteId', async (req, res) => {
  try {
    const existing = await prisma.sites.findUnique({
      where: { siteId: req.params.siteId }
    });
    res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Site ID suggestions
router.get('/suggest-siteid', async (req, res) => {
  try {
    const { region, city } = req.query;
    const prefix = `${region?.substring(0,2) || 'XX'}${city?.substring(0,3) || 'XXX'}`.toUpperCase();
    
    const existing = await prisma.sites.findMany({
      where: { siteId: { startsWith: prefix } },
      select: { siteId: true },
      orderBy: { siteId: 'desc' },
      take: 1
    });

    let nextNumber = 1;
    if (existing.length > 0) {
      const lastNumber = parseInt(existing[0].siteId.slice(-3));
      nextNumber = lastNumber + 1;
    }

    const suggestions = [];
    for (let i = 0; i < 3; i++) {
      suggestions.push(`${prefix}${String(nextNumber + i).padStart(3, '0')}`);
    }

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Excel template
router.get('/template', (req, res) => {
  try {
    // Create CSV instead of Excel for simplicity
    const csvData = [
      'Site ID*,Site Name*,Site Type*,Region*,Province*,City*,District,Address*,Latitude*,Longitude*,Altitude,Tower Height,Power Type*,Backup Power*,Fiber Connection*,Microwave Connection*,Contact Person*,Contact Phone*,Contact Email*,Status',
      'JKT001,Jakarta Central,BTS,Jakarta,DKI Jakarta,Jakarta Pusat,Menteng,"Jl. Thamrin No. 1",-6.200000,106.816666,10,42,PLN,Genset,Yes,No,John Doe,081234567890,john@example.com,PLANNING',
      ',,,,,,,,,,,,,,,,,,,' // Empty row for data entry
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="site_template.csv"');
    res.send(csvData);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Bulk Upload
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let data;
    if (req.file.originalname.endsWith('.csv')) {
      // Handle CSV
      const fs = require('fs');
      const csvContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(row => row['Site ID*']); // Filter empty rows
    } else {
      // Handle Excel
      const workbook = XLSX.readFile(req.file.path);
      const worksheet = workbook.Sheets['Sites'] || workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        const required = ['Site ID', 'Site Name', 'Site Type', 'Region', 'Province', 'City', 'Address', 'Latitude', 'Longitude', 'Power Type', 'Backup Power', 'Fiber Connection', 'Microwave Connection', 'Contact Person', 'Contact Phone', 'Contact Email'];
        const missing = required.filter(field => !row[field]);
        
        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Check duplicate Site ID
        const existing = await prisma.sites.findUnique({
          where: { siteId: row['Site ID'] }
        });
        if (existing) {
          throw new Error(`Site ID ${row['Site ID']} already exists`);
        }

        const site = await prisma.sites.create({
          data: {
            siteId: row['Site ID'],
            siteName: row['Site Name'],
            siteType: row['Site Type'],
            region: row['Region'],
            province: row['Province'],
            city: row['City'],
            district: row['District'] || null,
            address: row['Address'],
            latitude: parseFloat(row['Latitude']),
            longitude: parseFloat(row['Longitude']),
            altitude: row['Altitude'] ? parseInt(row['Altitude']) : null,
            towerHeight: row['Tower Height'] ? parseInt(row['Tower Height']) : null,
            powerType: row['Power Type'],
            backupPower: row['Backup Power'],
            fiberConnection: row['Fiber Connection'],
            microwaveConnection: row['Microwave Connection'],
            contactPerson: row['Contact Person'],
            contactPhone: row['Contact Phone'],
            contactEmail: row['Contact Email'],
            status: row['Status'] || 'PLANNING'
          }
        });

        results.success.push({ row: i + 2, siteId: site.siteId });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Integration - External system registration
router.post('/api/register', async (req, res) => {
  try {
    const { apiKey } = req.headers;
    
    // Simple API key validation (implement proper auth in production)
    if (!apiKey || apiKey !== process.env.SITE_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const sites = Array.isArray(req.body) ? req.body : [req.body];
    const results = { success: [], errors: [] };

    for (const siteData of sites) {
      try {
        const site = await prisma.sites.create({
          data: {
            siteId: siteData.siteId,
            siteName: siteData.siteName,
            siteType: siteData.siteType,
            region: siteData.region,
            province: siteData.province,
            city: siteData.city,
            district: siteData.district,
            address: siteData.address,
            latitude: parseFloat(siteData.latitude),
            longitude: parseFloat(siteData.longitude),
            altitude: siteData.altitude ? parseInt(siteData.altitude) : null,
            towerHeight: siteData.towerHeight ? parseInt(siteData.towerHeight) : null,
            powerType: siteData.powerType,
            backupPower: siteData.backupPower,
            fiberConnection: siteData.fiberConnection,
            microwaveConnection: siteData.microwaveConnection,
            contactPerson: siteData.contactPerson,
            contactPhone: siteData.contactPhone,
            contactEmail: siteData.contactEmail,
            status: siteData.status || 'PLANNING'
          }
        });
        results.success.push(site.siteId);
      } catch (error) {
        results.errors.push({ siteId: siteData.siteId, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sites with ATP filtering
router.get('/', async (req, res) => {
  try {
    const { atp_required, workflow_stage } = req.query;
    
    const where = {};
    if (atp_required === 'true') {
      where.atp_required = true;
    }
    if (workflow_stage) {
      where.workflow_stage = workflow_stage;
    }
    
    const sites = await prisma.sites.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    
    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;