const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('Creating test users...');
    
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    // Create test users
    const users = [
      {
        email: 'manager@telecore.com',
        username: 'manager',
        passwordHash: hashedPassword,
        userType: 'INTERNAL',
        status: 'ACTIVE'
      },
      {
        email: 'vendor1@example.com',
        username: 'vendor1',
        passwordHash: hashedPassword,
        userType: 'VENDOR',
        status: 'ACTIVE'
      },
      {
        email: 'tower1@example.com',
        username: 'tower1',
        passwordHash: hashedPassword,
        userType: 'TOWER_PROVIDER',
        status: 'ACTIVE'
      }
    ];
    
    for (const userData of users) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!existing) {
        await prisma.user.create({ data: userData });
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
    
    console.log('✅ Seed users completed');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
