// Database Test Helper
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Clean all test data
 */
const cleanupAllTestData = async () => {
  // Clean in order of dependencies
  await prisma.audit_logs_enhanced.deleteMany({});
  await prisma.atp_punchlist_items.deleteMany({});
  await prisma.atp_checklist_items.deleteMany({});
  await prisma.atp_review_stages.deleteMany({});
  await prisma.atp_document_attachments.deleteMany({});
  await prisma.atp_documents.deleteMany({
    where: {
      OR: [
        { site_id: { startsWith: 'TEST-' } },
        { atp_code: { startsWith: 'ATP-' } }
      ]
    }
  });
  await prisma.tasks.deleteMany({
    where: {
      OR: [
        { site_id: { startsWith: 'TEST-' } },
        { title: { startsWith: 'Test Task' } }
      ]
    }
  });
  await prisma.sites.deleteMany({
    where: {
      site_code: { startsWith: 'TEST-' }
    }
  });
  await prisma.users.deleteMany({
    where: {
      email: { startsWith: 'test-' }
    }
  });
};

/**
 * Truncate specific table
 */
const truncateTable = async (tableName) => {
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
  } catch (error) {
    console.error(`Error truncating ${tableName}:`, error);
  }
};

/**
 * Reset database sequence
 */
const resetSequence = async (sequenceName) => {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "${sequenceName}" RESTART WITH 1`
    );
  } catch (error) {
    console.error(`Error resetting sequence ${sequenceName}:`, error);
  }
};

/**
 * Begin transaction
 */
const beginTransaction = async () => {
  return await prisma.$transaction();
};

/**
 * Rollback transaction
 */
const rollbackTransaction = async (transaction) => {
  try {
    await transaction.rollback();
  } catch (error) {
    // Ignore rollback errors
  }
};

/**
 * Execute raw query
 */
const executeQuery = async (query, params = []) => {
  return await prisma.$queryRawUnsafe(query, ...params);
};

/**
 * Disconnect database
 */
const disconnectDB = async () => {
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  cleanupAllTestData,
  truncateTable,
  resetSequence,
  beginTransaction,
  rollbackTransaction,
  executeQuery,
  disconnectDB
};
