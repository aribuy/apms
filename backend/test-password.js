const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@telecore.com' },
    select: { email: true, password: true, passwordHash: true }
  });
  
  console.log('User found:', !!user);
  console.log('Password field value:', user?.password);
  console.log('PasswordHash field length:', user?.passwordHash?.length);
  
  if (user?.passwordHash) {
    const isValid = await bcrypt.compare('Admin123!', user.passwordHash);
    console.log('Correct password with passwordHash:', isValid);
  }
  
  await prisma.$disconnect();
  process.exit();
}

testPassword().catch(console.error);
