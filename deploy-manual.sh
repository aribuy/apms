#!/bin/bash

# DEPLOYMENT SCRIPT - APMS Production (Manual Steps)
# This script provides manual commands for deployment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOY TO PRODUCTION - apms.datacodesolution.com        ║"
echo "║              Manual Deployment Commands                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cat << 'EOF'

═══ PRE-DEPLOYMENT CHECKLIST ═══

☐ Inform users about maintenance (if needed)
☐ Verify SSH access to server
☐ Verify local changes are committed to git
☐ Review changes to be deployed

═══ STEP 1: CONNECT TO SERVER ═══

SSH to production server:
    ssh apms@apms.datacodesolution.com

If host key verification fails, run:
    ssh-keyscan apms.datacodesolution.com >> ~/.ssh/known_hosts

Then try SSH again.

═══ STEP 2: CREATE BACKUP ═══

After SSH connect, run:

    # Create backup directory
    BACKUP_DIR="/backups/apms/$(date +%Y%m%d)"
    mkdir -p $BACKUP_DIR

    # Backup backend
    cd /var/www/apms/backend
    tar -czf $BACKUP_DIR/backend-backup.tar.gz .

    # Backup frontend (optional - no changes needed)
    cd /var/www/apms/frontend
    tar -czf $BACKUP_DIR/frontend-backup.tar.gz .

    # Backup database (adjust command as needed)
    # pg_dump apms_production > $BACKUP_DIR/db-backup.sql
    # or
    # mysqldump apms_production > $BACKUP_DIR/db-backup.sql

    echo "Backup completed: $BACKUP_DIR"

═══ STEP 3: INSTALL LIBREOFFICE ═══

    # Check if LibreOffice is installed
    libreoffice --version

    # If not found, install:
    sudo apt-get update
    sudo apt-get install -y libreoffice

    # Verify installation
    libreoffice --version

═══ STEP 4: DEPLOY FILES (OPTION A - SCP) ═══

From your LOCAL machine (new terminal), run:

    # Upload documentConverter.js
    scp backend/src/utils/documentConverter.js \
        apms@apms.datacodesolution.com:/var/www/apms/backend/src/utils/

    # Upload atpUploadRoutes.js
    scp backend/src/routes/atpUploadRoutes.js \
        apms@apms.datacodesolution.com:/var/www/apms/backend/src/routes/

═══ STEP 4: DEPLOY FILES (OPTION B - MANUAL EDIT) ═══

Or create the files directly on server:

    # On server:
    cd /var/www/apms/backend/src/utils
    nano documentConverter.js
    # Paste content from: backend/src/utils/documentConverter.js

    cd /var/www/apms/backend/src/routes
    nano atpUploadRoutes.js
    # Update relevant sections (lines 7, 128-158, 189-211)

═══ STEP 5: INSTALL DEPENDENCIES ═══

On server:

    cd /var/www/apms/backend
    npm install libreoffice-convert@1.7.0 --save

    # Verify installation
    npm list libreoffice-convert

═══ STEP 6: RESTART SERVICES ═══

On server:

    # If using PM2:
    pm2 restart apms-backend
    # or
    pm2 restart backend

    # If using systemd:
    sudo systemctl restart apms-backend

    # Check status
    pm2 status
    # or
    sudo systemctl status apms-backend

═══ STEP 7: VERIFY DEPLOYMENT ═══

On server:

    # Check logs
    pm2 logs apms-backend --lines 50

    # Or check log file
    tail -f /var/www/apms/backend/logs/app.log

From local machine, test API:

    # Health check
    curl http://apms.datacodesolution.com/api/v1/health

    # Test site registration
    curl -X POST http://apms.datacodesolution.com/api/v1/site-registration/register \
      -H "Content-Type: application/json" \
      -d '{
        "customerSiteId": "PROD-TEST-'$(date +%s)'",
        "customerSiteName": "Production Test",
        "neTowerId": "NE-001",
        "neTowerName": "NE",
        "feTowerId": "FE-001",
        "feTowerName": "FE",
        "neLatitude": -7.2575,
        "neLongitude": 112.7521,
        "feLatitude": -7.2675,
        "feLongitude": 112.7621,
        "region": "East Java",
        "atpRequirements": {"software": true, "hardware": true}
      }'

═══ POST-DEPLOYMENT TESTING ═══

1. Open browser: http://apms.datacodesolution.com
2. Login as Doc Control user
3. Test Site Registration
4. Verify tasks are auto-created
5. Test Upload PDF document
6. Test Upload Word document → should convert to PDF
7. Test Bulk Upload
8. Check that auto-categorization works
9. Verify workflow stages are created

═══ FILES DEPLOYED ═══

NEW FILES:
  ✅ backend/src/utils/documentConverter.js

MODIFIED FILES:
  ✅ backend/src/routes/atpUploadRoutes.js

DEPENDENCIES:
  ✅ libreoffice-convert@1.7.0

SYSTEM REQUIREMENTS:
  ✅ LibreOffice (install via apt-get)

═══ ROLLBACK IF NEEDED ═══

If deployment fails, on server run:

    pm2 stop apms-backend
    cd /var/www/apms/backend
    tar -xzf /backups/apms/$(date +%Y%m%d)/backend-backup.tar.gz
    pm2 start apms-backend

═══ DEPLOYMENT CHECKLIST ═══

After deployment, verify:

☐ Backend service is running
☐ API health check passes
☐ LibreOffice installed on server
☐ libreoffice-convert package installed
☐ Site Registration creates tasks
☐ Upload accepts PDF files
☐ Upload accepts Word files
☐ Word files convert to PDF
☐ Auto-categorization works
☐ Workflow stages created
☐ No errors in logs
☐ Frontend accessible

═══ MONITORING ═══

Monitor logs after deployment:

    # On server
    pm2 logs apms-backend

    # Watch for errors
    pm2 logs apms-backend --err

    # Check memory usage
    pm2 monit

═══ SUPPORT ═══

If issues occur:
  1. Check logs: pm2 logs apms-backend
  2. Verify LibreOffice: libreoffice --version
  3. Check dependencies: npm list libreoffice-convert
  4. Test conversion manually on server
  5. Rollback if needed

═══ DEPLOYMENT SUMMARY ═══

Feature: Word to PDF Auto-Conversion
Server: apms.datacodesolution.com
Date: 2025-12-28

Changes:
  - Auto-convert Word (.doc/.docx) to PDF on upload
  - Integration with auto-categorization
  - Workflow initialization

Dependencies:
  - libreoffice-convert@1.7.0
  - LibreOffice (system package)

Ready for production: ✅ YES

EOF

echo ""
echo "═══ QUICK COPY COMMANDS ═══"
echo ""
echo "Copy these commands to deploy:"
echo ""
echo "# 1. Connect to server"
echo "ssh apms@apms.datacodesolution.com"
echo ""
echo "# 2. Backup"
echo "BACKUP_DIR=\"/backups/apms/\$(date +%Y%m%d)\""
echo "mkdir -p \$BACKUP_DIR"
echo "cd /var/www/apms/backend && tar -czf \$BACKUP_DIR/backend-backup.tar.gz ."
echo ""
echo "# 3. Install LibreOffice"
echo "sudo apt-get install -y libreoffice"
echo ""
echo "# 4. Exit and upload files (from local)"
echo "# Exit SSH first, then:"
echo "scp backend/src/utils/documentConverter.js apms@apms.datacodesolution.com:/var/www/apms/backend/src/utils/"
echo "scp backend/src/routes/atpUploadRoutes.js apms@apms.datacodesolution.com:/var/www/apms/backend/src/routes/"
echo ""
echo "# 5. SSH back and install dependencies"
echo "ssh apms@apms.datacodesolution.com"
echo "cd /var/www/apms/backend && npm install libreoffice-convert@1.7.0"
echo ""
echo "# 6. Restart"
echo "pm2 restart apms-backend"
echo ""
echo "═══ END ═══"
