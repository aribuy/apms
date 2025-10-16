// File: backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting TeleCore APMS seed...');

  // Create Internal Departments
  const itDepartment = await prisma.userGroup.create({
    data: {
      name: 'Information Technology',
      type: 'INTERNAL_DEPARTMENT',
      code: 'IT',
      manager: 'CTO TeleCore',
      budget: 500000000,
      location: 'Jakarta HQ - Floor 12',
      address: 'Jl. Sudirman No. 123, Jakarta',
      phone: '+62-21-1234567',
      email: 'it@telecore.com'
    }
  });

  const engineeringDept = await prisma.userGroup.create({
    data: {
      name: 'Network Engineering',
      type: 'INTERNAL_DEPARTMENT', 
      code: 'ENG',
      manager: 'VP Engineering',
      budget: 750000000,
      location: 'Jakarta HQ - Floor 10',
      address: 'Jl. Sudirman No. 123, Jakarta',
      phone: '+62-21-1234568',
      email: 'engineering@telecore.com'
    }
  });

  const operationsDept = await prisma.userGroup.create({
    data: {
      name: 'Field Operations',
      type: 'INTERNAL_DEPARTMENT',
      code: 'OPS',
      manager: 'Operations Director',
      budget: 1000000000,
      location: 'Multiple Field Offices',
      address: 'Various Locations',
      phone: '+62-21-1234569',
      email: 'operations@telecore.com'
    }
  });

  const financeDept = await prisma.userGroup.create({
    data: {
      name: 'Finance & Administration',
      type: 'INTERNAL_DEPARTMENT',
      code: 'FIN',
      manager: 'CFO TeleCore',
      budget: 250000000,
      location: 'Jakarta HQ - Floor 8',
      address: 'Jl. Sudirman No. 123, Jakarta',
      phone: '+62-21-1234570',
      email: 'finance@telecore.com'
    }
  });

  // Create External User Groups
  const vendorGroup = await prisma.userGroup.create({
    data: {
      name: 'TeleCore Vendor Partners',
      type: 'VENDOR',
      address: 'Jakarta, Indonesia',
      contactPerson: 'John Doe',
      phone: '+62-21-1234567',
      email: 'vendor@telecore.com'
    }
  });

  const towerProviderGroup = await prisma.userGroup.create({
    data: {
      name: 'National Tower Provider',
      type: 'TOWER_PROVIDER',
      address: 'Bandung, Indonesia',
      contactPerson: 'Jane Smith',
      phone: '+62-22-7654321',
      email: 'tp@telecore.com'
    }
  });

  const customerGroup = await prisma.userGroup.create({
    data: {
      name: 'Enterprise Customer Group',
      type: 'CUSTOMER',
      address: 'Surabaya, Indonesia',
      contactPerson: 'Mike Johnson',
      phone: '+62-31-9876543',
      email: 'customer@telecore.com'
    }
  });

  // Create Geographic Privileges
  const national = await prisma.geographicPrivilege.create({
    data: {
      name: 'National',
      level: 'NATIONAL',
      code: 'NAT-ID'
    }
  });

  const westJava = await prisma.geographicPrivilege.create({
    data: {
      name: 'West Java Region',
      level: 'REGION',
      code: 'REG-JABAR',
      parentId: national.id
    }
  });

  const bandungArea = await prisma.geographicPrivilege.create({
    data: {
      name: 'Bandung Area',
      level: 'AREA',
      code: 'AREA-BDG',
      parentId: westJava.id
    }
  });

  // Create Processes
  const assetProcess = await prisma.process.create({
    data: {
      name: 'Asset Management',
      code: 'ASSET',
      category: 'Core Operations'
    }
  });

  const maintenanceProcess = await prisma.process.create({
    data: {
      name: 'Maintenance Scheduling',
      code: 'MAINTENANCE',
      category: 'Operations'
    }
  });

  const reportingProcess = await prisma.process.create({
    data: {
      name: 'Report Generation',
      code: 'REPORTING',
      category: 'Analytics'
    }
  });

  const userMgmtProcess = await prisma.process.create({
    data: {
      name: 'User Management',
      code: 'USER_MGMT',
      category: 'Administration'
    }
  });

  // Create Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Administrator',
      description: 'Full system access',
      group: 'INTERNAL',
      level: 'NATIONAL',
      isSingle: true
    }
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'System Administrator',
      description: 'System administration',
      group: 'INTERNAL',
      level: 'NATIONAL',
      isSingle: false
    }
  });

  // Assign processes to roles
  await prisma.roleProcess.createMany({
    data: [
      // Super Admin - Full access
      { roleId: superAdminRole.id, processId: assetProcess.id, canView: true, canCreate: true, canUpdate: true, canDelete: true },
      { roleId: superAdminRole.id, processId: maintenanceProcess.id, canView: true, canCreate: true, canUpdate: true, canDelete: true },
      { roleId: superAdminRole.id, processId: reportingProcess.id, canView: true, canCreate: true, canUpdate: true, canDelete: true },
      { roleId: superAdminRole.id, processId: userMgmtProcess.id, canView: true, canCreate: true, canUpdate: true, canDelete: true }
    ]
  });

  console.log('Seed data created successfully!');
  console.log('Created user groups:', {
    itDepartment: itDepartment.id,
    engineeringDept: engineeringDept.id,
    operationsDept: operationsDept.id,
    financeDept: financeDept.id
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
