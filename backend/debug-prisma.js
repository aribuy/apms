const { PrismaClient } = require('@prisma/client');

console.log('Checking Prisma client...');
const prisma = new PrismaClient();

console.log('Prisma client properties:', Object.keys(prisma));
console.log('Has user model:', !!prisma.user);
console.log('Has site model:', !!prisma.site);
console.log('Has document model:', !!prisma.document);

// Try to see what's available
if (prisma.user) {
  console.log('User model methods:', Object.getOwnPropertyNames(prisma.user));
} else {
  console.log('User model not found');
}
