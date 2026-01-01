#!/bin/bash

# Fix Site Registration Code for Production
# Updates siteRegistrationRoutes.js to use correct table names

PRODUCTION_SERVER="root@31.97.220.37"
PRODUCTION_PATH="/var/www/apms/backend"

echo "═══════════════════════════════════════════════════"
echo "  FIX SITE REGISTRATION CODE - PRODUCTION"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Download current file
echo "Step 1: Backing up and downloading current file..."
sshpass -p 'Qazwsx123.Qazwsx123.' ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} << 'ENDSSH'
cd /var/www/apms/backend
cp src/routes/siteRegistrationRoutes.js src/routes/siteRegistrationRoutes.js.backup-$(date +%Y%m%d-%H%M%S)
echo "✓ Backup created"
ENDSSH

sshpass -p 'Qazwsx123.Qazwsx123.' scp \
  ${PRODUCTION_SERVER}:${PRODUCTION_PATH}/src/routes/siteRegistrationRoutes.js \
  /tmp/siteRegistrationRoutes.prod.js

if [ $? -eq 0 ]; then
  echo "✓ File downloaded"
else
  echo "✗ Failed to download file"
  exit 1
fi

# Step 2: Apply fixes using sed
echo ""
echo "Step 2: Applying fixes to siteRegistrationRoutes.js..."

cd /Users/endik/Projects/telecore-backup

# Copy local version (which is already correct)
cp backend/src/routes/siteRegistrationRoutes.js /tmp/siteRegistrationRoutes.fixed.js

echo "✓ Using local corrected version"

# Step 3: Upload fixed file
echo ""
echo "Step 3: Uploading fixed file..."
sshpass -p 'Qazwsx123.Qazwsx123.' scp \
  /tmp/siteRegistrationRoutes.fixed.js \
  ${PRODUCTION_SERVER}:${PRODUCTION_PATH}/src/routes/siteRegistrationRoutes.js

if [ $? -eq 0 ]; then
  echo "✓ File uploaded"
else
  echo "✗ Failed to upload file"
  exit 1
fi

# Step 4: Restart PM2
echo ""
echo "Step 4: Restarting PM2 service..."
sshpass -p 'Qazwsx123.Qazwsx123.' ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} << 'ENDSSH'
cd /var/www/apms/backend
pm2 restart apms-api
sleep 3
echo ""
echo "Service status:"
pm2 status apms-api
ENDSSH

echo ""
echo "═══════════════════════════════════════════════════"
echo "  FIX COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Test site registration:"
echo "     curl -X POST https://apms.datacodesolution.com/api/v1/site-registration/register ..."
echo ""
echo "  2. Check logs:"
echo "     ssh root@31.97.220.37 'pm2 logs apms-api --lines 50'"
echo ""
echo "  3. Verify database:"
echo "     ssh root@31.97.220.37 'sudo -u postgres psql -d apms_db -c \"SELECT * FROM sites ORDER BY created_at DESC LIMIT 5;\"'"
echo ""
