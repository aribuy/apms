// ATP Document Factory - Generate test ATP documents
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create test ATP document
 */
const createTestATP = async (siteId, overrides = {}) => {
  const timestamp = Date.now();
  const data = {
    site_id: siteId,
    atp_code: `ATP-${timestamp}`,
    atp_type: 'SOFTWARE', // or 'HARDWARE', 'COMBINED'
    status: 'pending_review',
    submitted_by: 'test-vendor',
    file_path: '/test/path/atp.pdf',
    file_size: 1024000,
    confidence_score: 0.95,
    category_detected: 'SOFTWARE',
    ...overrides
  };

  const atp = await prisma.atp_documents.create({ data });

  // Initialize workflow stages
  if (!overrides.skip_workflow) {
    await initializeWorkflow(atp.id, atp.atp_type);
  }

  return atp;
};

/**
 * Initialize workflow stages for ATP
 */
const initializeWorkflow = async (atpId, atpType) => {
  let stages = [];

  if (atpType === 'SOFTWARE') {
    stages = [
      { stage_name: 'BO', stage_order: 1, sla_hours: 48 },
      { stage_name: 'SME', stage_order: 2, sla_hours: 48 },
      { stage_name: 'HEAD_NOC', stage_order: 3, sla_hours: 24 }
    ];
  } else if (atpType === 'HARDWARE') {
    stages = [
      { stage_name: 'FOP_RTS', stage_order: 1, sla_hours: 48 },
      { stage_name: 'REGION_TEAM', stage_order: 2, sla_hours: 48 },
      { stage_name: 'RTH', stage_order: 3, sla_hours: 24 }
    ];
  } else if (atpType === 'COMBINED') {
    stages = [
      { stage_name: 'BO', stage_order: 1, sla_hours: 48 },
      { stage_name: 'FOP_RTS', stage_order: 2, sla_hours: 48 },
      { stage_name: 'SME', stage_order: 3, sla_hours: 48 },
      { stage_name: 'REGION_TEAM', stage_order: 4, sla_hours: 48 },
      { stage_name: 'HEAD_NOC', stage_order: 5, sla_hours: 24 }
    ];
  }

  for (const stage of stages) {
    await prisma.atp_review_stages.create({
      data: {
        atp_id: atpId,
        ...stage,
        status: 'PENDING',
        assigned_to: `test-${stage.stage_name.toLowerCase()}`
      }
    });
  }
};

/**
 * Create test ATP with specific status
 */
const createTestATPWithStatus = async (siteId, status, atpType = 'SOFTWARE') => {
  const atp = await createTestATP(siteId, {
    status,
    atp_type: atpType,
    skip_workflow: true
  });

  if (status !== 'pending_review') {
    await initializeWorkflow(atp.id, atpType);

    // Update stages based on status
    const stages = await prisma.atp_review_stages.findMany({
      where: { atp_id: atp.id },
      orderBy: { stage_order: 'asc' }
    });

    for (const stage of stages) {
      if (status === 'approved' || stage.stage_order < stages.length) {
        await prisma.atp_review_stages.update({
          where: { id: stage.id },
          data: {
            status: 'APPROVED',
            reviewed_at: new Date(),
            reviewer_comments: 'Auto-approved for testing'
          }
        });
      }
    }
  }

  return atp;
};

/**
 * Clean test ATPs
 */
const cleanupTestATPs = async () => {
  await prisma.atp_review_stages.deleteMany({
    where: {
      atp: {
        atp_code: {
          startsWith: 'ATP-'
        }
      }
    }
  });

  await prisma.atp_documents.deleteMany({
    where: {
      atp_code: {
        startsWith: 'ATP-'
      }
    }
  });
};

module.exports = {
  createTestATP,
  createTestATPWithStatus,
  initializeWorkflow,
  cleanupTestATPs
};
