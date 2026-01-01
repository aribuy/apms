#!/bin/bash

# ================================================================
# STAGING DEPLOYMENT SCRIPT
# ================================================================
# Migration: 20251229010228_add_master_tables_final_v2
# Date: 2025-12-29
# Purpose: Deploy master tables to staging environment
# ================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_HOST="apms@apmsstaging.datacodesolution.com"
STAGING_DB="apms_staging"
STAGING_USER="apms_staging"
BACKUP_DIR="/tmp"
LOCAL_BACKUP_DIR="./backups"

# Migration files
MIGRATION_DIR="./backend/prisma/migrations/20251229010228_add_master_tables_final_v2"
MIGRATION_FILES=(
    "migration.sql"
    "constraints.sql"
    "performance_indexes.sql"
)

echo "========================================"
echo "STAGING DEPLOYMENT"
echo "========================================"
echo ""
echo "Migration: 20251229010228_add_master_tables_final_v2"
echo "Date: $(date)"
echo "Target: ${STAGING_HOST}"
echo "Database: ${STAGING_DB}"
echo ""

# ================================================================
# Step 1: Backup Staging Database
# ================================================================
echo -e "${YELLOW}[1/6] Creating backup of staging database...${NC}"

mkdir -p "${LOCAL_BACKUP_DIR}"

# You need to run this manually with password:
# ssh apms@apmsstaging.datacodesolution.com "pg_dump -U apms_staging -d apms_staging" > backup.sql

echo -e "${GREEN}✓ Backup instruction:${NC}"
echo "  Run: ssh ${STAGING_HOST} \"pg_dump -U ${STAGING_USER} -d ${STAGING_DB}\" > ${LOCAL_BACKUP_DIR}/staging_backup_$(date +%Y%m%d_%H%M%S).sql"
echo ""
read -p "Press Enter after backup is complete..."

# ================================================================
# Step 2: Copy Migration Files
# ================================================================
echo -e "${YELLOW}[2/6] Copying migration files to staging server...${NC}"

# Create migration directory on staging
echo "Creating migration directory on staging..."
# ssh "${STAGING_HOST}" "mkdir -p ${BACKUP_DIR}/20251229010228_add_master_tables_final_v2"

echo -e "${GREEN}✓ Migration files ready:${NC}"
for file in "${MIGRATION_FILES[@]}"; do
    if [ -f "${MIGRATION_DIR}/${file}" ]; then
        echo "  - ${file}"
    else
        echo -e "${RED}✗ Missing: ${file}${NC}"
        exit 1
    fi
done
echo ""

# ================================================================
# Step 3: Apply Migration (DDL)
# ================================================================
echo -e "${YELLOW}[3/6] Applying migration.sql (DDL)...${NC}"

# Check if migration file exists
if [ ! -f "${MIGRATION_DIR}/migration.sql" ]; then
    echo -e "${RED}✗ migration.sql not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "SSH to staging server and run:"
echo ""
echo "  ssh ${STAGING_HOST}"
echo "  psql -U ${STAGING_USER} -d ${STAGING_DB}"
echo ""
echo "Then paste the contents of:"
echo "  ${MIGRATION_DIR}/migration.sql"
echo ""
read -p "Press Enter after migration is applied..."

# ================================================================
# Step 4: Apply Constraints
# ================================================================
echo -e "${YELLOW}[4/6] Applying constraints.sql...${NC}"

if [ ! -f "${MIGRATION_DIR}/constraints.sql" ]; then
    echo -e "${RED}✗ constraints.sql not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Constraints file found${NC}"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "In the same psql session, paste:"
echo "  ${MIGRATION_DIR}/constraints.sql"
echo ""
read -p "Press Enter after constraints are applied..."

# ================================================================
# Step 5: Apply Performance Indexes
# ================================================================
echo -e "${YELLOW}[5/6] Applying performance_indexes.sql...${NC}"

if [ ! -f "${MIGRATION_DIR}/performance_indexes.sql" ]; then
    echo -e "${RED}✗ performance_indexes.sql not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Performance indexes file found${NC}"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "In the same psql session, paste:"
echo "  ${MIGRATION_DIR}/performance_indexes.sql"
echo ""
read -p "Press Enter after indexes are applied..."

# ================================================================
# Step 6: Regenerate Prisma Client
# ================================================================
echo -e "${YELLOW}[6/6] Regenerating Prisma client...${NC}"

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "On staging server backend directory:"
echo "  cd /var/www/apms/backend"
echo "  npx prisma generate"
echo ""
read -p "Press Enter after Prisma client is regenerated..."

# ================================================================
# Summary
# ================================================================
echo ""
echo "========================================"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Restart backend service: pm2 restart apms-api-staging"
echo "  2. Run validation queries"
echo "  3. Execute test scripts from README_RUNBOOK.md"
echo ""
echo "========================================"
