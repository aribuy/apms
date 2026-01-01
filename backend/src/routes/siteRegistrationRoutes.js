const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateBody } = require('../middleware/validator');
const {
  siteRegistrationSchema,
  siteValidateSchema,
  atpRequirementsLookupSchema
} = require('../validations/siteRegistration');
const prisma = new PrismaClient();

// Get site registration dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      registeredToday: 12,
      pendingReview: 3,
      failedValidation: 1,
      regions: {
        eastJava: 45,
        centralJava: 38,
        westJava: 41
      },
      recentRegistrations: [
        { siteId: 'JKTB025', status: 'Registered', time: '10 min ago' },
        { siteId: 'JKTB024', status: 'Pending review', time: '25 min ago' },
        { siteId: 'JKTB023', status: 'Registration complete', time: '1 hour ago' },
        { siteId: 'JKTB022', status: 'Failed validation', time: '2 hours ago' }
      ]
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Register single site
router.post('/register', validateBody(siteRegistrationSchema), async (req, res) => {
  try {
    const {
      customerSiteId,
      customerSiteName,
      neTowerId,
      neTowerName,
      feTowerId,
      feTowerName,
      neLatitude,
      neLongitude,
      feLatitude,
      feLongitude,
      region,
      coverageArea,
      activityFlow,
      sowCategory,
      projectCode,
      frequencyBand,
      linkCapacity,
      antennaSize,
      equipmentType,
      atpRequirements
    } = req.body;

    // Validate required fields
    if (!customerSiteId || !customerSiteName) {
      return res.status(400).json({ error: 'Site ID and Name are required' });
    }

    // Validate coordinates (Indonesia bounds)
    const validateCoordinates = (lat, lng) => {
      return (lat >= -11 && lat <= 6) && (lng >= 95 && lng <= 141);
    };

    if (!validateCoordinates(neLatitude, neLongitude) || 
        !validateCoordinates(feLatitude, feLongitude)) {
      return res.status(400).json({ error: 'Coordinates must be within Indonesia bounds' });
    }

    // Create site registration using 'sites' table
    // Store additional tower info in task_data for tasks
    const siteData = {
      siteId: customerSiteId,
      siteName: customerSiteName,
      scope: coverageArea || 'MW', // coverage_area -> scope
      region: region,
      city: region || 'Unknown', // Using region as city for now
      neLatitude: neLatitude ? parseFloat(neLatitude) : null,
      neLongitude: neLongitude ? parseFloat(neLongitude) : null,
      feLatitude: feLatitude ? parseFloat(feLatitude) : null,
      feLongitude: feLongitude ? parseFloat(feLongitude) : null,
      status: 'ACTIVE', // Changed from 'active' to 'ACTIVE'
      atpRequired: true,
      atpType: atpRequirements?.software && atpRequirements?.hardware ? 'BOTH' :
               atpRequirements?.software ? 'SOFTWARE' :
               atpRequirements?.hardware ? 'HARDWARE' : 'BOTH',
      workflowStage: 'REGISTERED'
    };

    const site = await prisma.site.create({
      data: siteData
    });

    // Auto-assign document controller based on region
    // Using existing user IDs from database
    const docControllerMap = {
      'East Java': 'cmezu3img0000jiaj1w1jfcj1',      // admin@telecore.com
      'Central Java': 'cmezu3img0000jiaj1w1jfcj1',    // admin@telecore.com
      'West Java': 'cmezu3img0000jiaj1w1jfcj1',      // admin@telecore.com
      'Jabodetabek': 'cmezu3img0000jiaj1w1jfcj1'     // admin@telecore.com
    };

    const assignedController = docControllerMap[region] || 'cmezu3img0000jiaj1w1jfcj1';  // Default to admin

    // Prepare task data with additional tower info
    const taskData = {
      tower_info: {
        ne_tower_id: neTowerId,
        ne_tower_name: neTowerName,
        fe_tower_id: feTowerId,
        fe_tower_name: feTowerName,
        activity_flow: activityFlow,
        sow_category: sowCategory,
        project_code: projectCode,
        frequency_band: frequencyBand,
        link_capacity: linkCapacity,
        antenna_size: antennaSize,
        equipment_type: equipmentType
      }
    };

    // Create ATP tasks if required
    const atpTasks = [];

    if (atpRequirements?.software) {
      const swTask = await prisma.task.create({
        data: {
          taskCode: `ATP-SW-${customerSiteId}-001`,
          taskType: 'ATP_SOFTWARE',
          title: `Software ATP Task - ${customerSiteId}`,
          description: `Software ATP testing for ${customerSiteName}`,
          status: 'pending',
          priority: 'high',
          assignedTo: assignedController,
          siteId: site.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          taskData: taskData
        }
      });
      atpTasks.push(swTask);
    }

    if (atpRequirements?.hardware) {
      const hwTask = await prisma.task.create({
        data: {
          taskCode: `ATP-HW-${customerSiteId}-001`,
          taskType: 'ATP_HARDWARE',
          title: `Hardware ATP Task - ${customerSiteId}`,
          description: `Hardware ATP testing for ${customerSiteName}`,
          status: 'pending',
          priority: 'high',
          assignedTo: assignedController,
          siteId: site.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          taskData: taskData
        }
      });
      atpTasks.push(hwTask);
    }

    res.json({
      success: true,
      message: 'Site registered successfully',
      data: {
        site,
        atpTasks,
        assignedController
      }
    });

  } catch (error) {
    console.error('Site registration error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Site ID already exists' });
    }
    res.status(500).json({ error: 'Failed to register site' });
  }
});

// Get registered sites with filters
router.get('/sites', async (req, res) => {
  try {
    // Mock data for now
    const sites = [
      {
        id: 'JKTB001',
        siteName: 'GILIGENTING_KAL..',
        region: 'East Java',
        status: 'Active',
        atpSoftware: 'Complete',
        atpHardware: 'Complete',
        registrationDate: '2025-10-16'
      },
      {
        id: 'JKTB002',
        siteName: 'MBTS_ARJASA_KAN..',
        region: 'East Java',
        status: 'Active',
        atpSoftware: 'Pending',
        atpHardware: 'Complete',
        registrationDate: '2025-10-15'
      },
      {
        id: 'JKTB003',
        siteName: 'SIDOASIH_DAMPEL',
        region: 'Central Java',
        status: 'Active',
        atpSoftware: 'Review',
        atpHardware: 'Review',
        registrationDate: '2025-10-14'
      }
    ];

    const stats = {
      totalSites: 156,
      activeSites: 142,
      atpPending: 23,
      atpComplete: 119,
      pendingReview: 14
    };

    res.json({
      success: true,
      data: {
        sites,
        stats,
        pagination: {
          current: 1,
          total: 8,
          perPage: 20
        }
      }
    });

  } catch (error) {
    console.error('Sites fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Validate site data
router.post('/validate', validateBody(siteValidateSchema), async (req, res) => {
  try {
    const { customerSiteId, coordinates } = req.body;
    const errors = {};

    // Check for duplicate site ID
    const existingSite = await prisma.site.findFirst({
      where: { siteId: customerSiteId }
    });

    if (existingSite) {
      errors.customerSiteId = 'Site ID already exists';
    }

    // Validate coordinates
    const validateCoordinates = (lat, lng) => {
      return (lat >= -11 && lat <= 6) && (lng >= 95 && lng <= 141);
    };

    if (coordinates) {
      if (!validateCoordinates(coordinates.neLatitude, coordinates.neLongitude)) {
        errors.neCoordinates = 'Near End coordinates must be within Indonesia bounds';
      }
      if (!validateCoordinates(coordinates.feLatitude, coordinates.feLongitude)) {
        errors.feCoordinates = 'Far End coordinates must be within Indonesia bounds';
      }
    }

    res.json({
      success: true,
      isValid: Object.keys(errors).length === 0,
      errors
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Auto-determine ATP requirements based on activity
router.post('/atp-requirements', validateBody(atpRequirementsLookupSchema), async (req, res) => {
  try {
    const { activityFlow } = req.body;
    
    const requirements = {
      'MW Upg': { software: true, hardware: true },
      'MW New': { software: true, hardware: true },
      'Reroute': { software: true, hardware: false },
      'Change Antenna': { software: false, hardware: true },
      'Upgrade N+0': { software: true, hardware: true }
    };
    
    let atpRequirements = { software: true, hardware: true }; // Default
    
    for (let key in requirements) {
      if (activityFlow && activityFlow.includes(key)) {
        atpRequirements = requirements[key];
        break;
      }
    }
    
    res.json({
      success: true,
      data: {
        atpRequirements,
        recommendedTests: {
          software: atpRequirements.software ? [
            'Configuration testing',
            'License verification', 
            'Performance validation',
            'Integration testing'
          ] : [],
          hardware: atpRequirements.hardware ? [
            'Physical installation check',
            'Cable & connection verification',
            'Power & grounding validation',
            'Environmental compliance'
          ] : []
        }
      }
    });

  } catch (error) {
    console.error('ATP requirements error:', error);
    res.status(500).json({ error: 'Failed to determine ATP requirements' });
  }
});

module.exports = router;
