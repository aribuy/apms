#!/bin/bash

# Deploy Idempotency Middleware to Production
# This script adds idempotency middleware to production server.js

PRODUCTION_SERVER="root@31.97.220.37"
PRODUCTION_PATH="/var/www/apms/backend"

echo "═══════════════════════════════════════════════════"
echo "  DEPLOY IDEMPOTENCY MIDDLEWARE TO PRODUCTION"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Upload idempotency middleware
echo "Step 1: Uploading idempotency middleware..."
sshpass -p 'Qazwsx123.Qazwsx123.' scp /Users/endik/Projects/telecore-backup/backend/src/middleware/idempotency.js \
  ${PRODUCTION_SERVER}:${PRODUCTION_PATH}/src/middleware/

if [ $? -eq 0 ]; then
  echo "✓ Idempotency middleware uploaded"
else
  echo "✗ Failed to upload idempotency middleware"
  exit 1
fi

# Step 2: Update server.js via SSH
echo ""
echo "Step 2: Updating server.js to use idempotency middleware..."

sshpass -p 'Qazwsx123.Qazwsx123.' ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} << 'ENDSSH'
cd /var/www/apms/backend

# Backup server.js
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)

# Add idempotency middleware after express.json()
# Using sed to insert the middleware configuration
sed -i '/app.use(express.json());/a\
\
// Idempotency middleware (must be after express.json)\
const { idempotencyCheck } = require("./src/middleware/idempotency");\
app.use("/api/v1/site-registration", idempotencyCheck);\
app.use("/api/v1/atp/upload", idempotencyCheck);\
app.use("/api/v1/atp/bulk-upload", idempotencyCheck);
' server.js

echo "✓ server.js updated"
ENDSSH

if [ $? -eq 0 ]; then
  echo "✓ Server configuration updated"
else
  echo "✗ Failed to update server.js"
  exit 1
fi

# Step 3: Restart PM2 service
echo ""
echo "Step 3: Restarting PM2 service..."
sshpass -p 'Qazwsx123.Qazwsx123.' ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} << 'ENDSSH'
cd /var/www/apms/backend
pm2 restart apms-api
sleep 3
pm2 status apms-api
ENDSSH

echo ""
echo "═══════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Test site registration: curl -X POST https://apms.datacodesolution.com/api/v1/site-registration/register ..."
echo "  2. Test idempotency: Send same request twice with same Idempotency-Key"
echo "  3. Check logs: ssh root@31.97.220.37 'pm2 logs apms-api --lines 50'"
echo ""
