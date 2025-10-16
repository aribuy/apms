const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing tasks table...');
    
    // Try to count tasks
    const count = await prisma.task.count();
    console.log('Task count:', count);
    
    // Try to create a task
    const task = await prisma.task.create({
      data: {
        taskCode: 'TEST-001',
        taskType: 'TEST',
        title: 'Test Task',
        status: 'pending',
        priority: 'normal'
      }
    });
    console.log('Created task:', task);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
