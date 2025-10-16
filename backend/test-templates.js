// Quick test for templates
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTemplates() {
  try {
    const templates = await prisma.atp_document_templates.findMany({
      where: { is_active: true }
    });
    console.log('Templates found:', templates.length);
    console.log('Template names:', templates.map(t => t.template_name));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplates();