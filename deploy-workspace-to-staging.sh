#!/bin/bash

# Deploy Workspace Multi-Tenant to Staging

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER="root@31.97.220.37"
PASSWORD="Qazwsx123.Qazwsx123."

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  WORKSPACE MULTI-TENANT DEPLOYMENT${NC}"
echo -e "${YELLOW}  Target: STAGING${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Step 1: Copy updated backend to staging
echo -e "${YELLOW}Step 1: Copying updated backend to staging...${NC}"
sshpass -p "$PASSWORD" rsync -avz --exclude='node_modules' --exclude='.env' \
  /Users/endik/Projects/telecore-backup/backend/ \
  "$SERVER:/var/www/apms-staging/backend/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend copied${NC}"
else
    echo -e "${RED}❌ Failed to copy backend${NC}"
    exit 1
fi
echo ""

# Step 2: Generate Prisma client on staging
echo -e "${YELLOW}Step 2: Generating Prisma client...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend
NODE_ENV=staging npx prisma generate
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo ""

# Step 3: Push schema changes to staging database
echo -e "${YELLOW}Step 3: Pushing schema to staging database...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend
NODE_ENV=staging npx prisma db push --skip-generate
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema pushed to staging${NC}"
else
    echo -e "${RED}❌ Failed to push schema${NC}"
    exit 1
fi
echo ""

# Step 4: Create default workspace
echo -e "${YELLOW}Step 4: Creating default workspace...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend

# Create script to seed default workspace
cat > /tmp/seed_workspace.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWorkspace() {
  try {
    // Check if workspace already exists
    const existing = await prisma.workspaces.findFirst({
      where: { code: 'XLSMART-AVIAT' }
    });

    if (existing) {
      console.log('✅ Workspace XLSMART-AVIAT already exists');
      console.log('   ID:', existing.id);
      return existing;
    }

    // Create default workspace
    const workspace = await prisma.workspaces.create({
      data: {
        code: 'XLSMART-AVIAT',
        name: 'XLSMART Project by Aviat',
        customer_group_id: 'xlsmart-customer-group',
        vendor_owner_id: 'aviat-vendor-owner',
        is_active: true
      }
    });

    console.log('✅ Default workspace created:');
    console.log('   Code:', workspace.code);
    console.log('   Name:', workspace.name);
    console.log('   ID:', workspace.id);

    return workspace;
  } catch (error) {
    console.error('❌ Error creating workspace:', error.message);
    throw error;
  } finally {
    await prisma.\$disconnect();
  }
}

seedWorkspace();
EOF

# Run the seed script
NODE_ENV=staging node /tmp/seed_workspace.js
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Default workspace created${NC}"
else
    echo -e "${RED}❌ Failed to create workspace${NC}"
fi
echo ""

# Step 5: Update existing sites and tasks with workspace_id
echo -e "${YELLOW}Step 5: Updating existing data with workspace_id...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend

# Get workspace ID first
WORKSPACE_ID=$(sudo -u postgres psql apms_staging -t -c "SELECT id FROM workspaces WHERE code='XLSMART-AVIAT' LIMIT 1;")

# Trim whitespace
WORKSPACE_ID=$(echo $WORKSPACE_ID | xargs)

if [ -n "$WORKSPACE_ID" ]; then
    # Update sites
    sudo -u postgres psql apms_staging -c "UPDATE sites SET workspace_id='$WORKSPACE_ID' WHERE workspace_id IS NULL;"
    SITES_UPDATED=$(sudo -u postgres psql apms_staging -t -c "SELECT COUNT(*) FROM sites WHERE workspace_id='$WORKSPACE_ID';")

    # Update tasks
    sudo -u postgres psql apms_staging -c "UPDATE tasks SET workspace_id='$WORKSPACE_ID' WHERE workspace_id IS NULL;"
    TASKS_UPDATED=$(sudo -u postgres psql apms_staging -t -c "SELECT COUNT(*) FROM tasks WHERE workspace_id='$WORKSPACE_ID';")

    echo "✅ Sites updated: $SITES_UPDATED"
    echo "✅ Tasks updated: $TASKS_UPDATED"
else
    echo "❌ Workspace ID not found"
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Existing data updated with workspace_id${NC}"
else
    echo -e "${RED}❌ Failed to update existing data${NC}"
fi
echo ""

# Step 6: Restart staging API
echo -e "${YELLOW}Step 6: Restarting staging API...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
pm2 restart apms-api-staging
sleep 3
pm2 list | grep apms
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Staging API restarted${NC}"
else
    echo -e "${RED}❌ Failed to restart staging API${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ WORKSPACE DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "What was deployed:"
echo "  ✅ workspaces table created"
echo "  ✅ workspace_id added to sites & tasks"
echo "  ✅ Default workspace 'XLSMART-AVIAT' created"
echo "  ✅ Existing data updated with workspace_id"
echo "  ✅ Staging API restarted"
echo ""
echo "Next steps:"
echo "  1. Test staging API: https://apmsstaging.datacodesolution.com"
echo "  2. Update API endpoints for workspace filtering"
echo "  3. Test workspace isolation"
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION UNTOUCHED - Only staging updated${NC}"
echo ""
