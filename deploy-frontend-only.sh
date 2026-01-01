#!/bin/bash

# Quick Frontend Deployment Script
# Run this from your terminal where SSH keys are configured

echo "Deploying frontend to production..."
echo ""

cd /Users/endik/Projects/telecore-backup/frontend

echo "✅ Frontend already built at: build/"
echo ""

echo "📤 Deploying to apms@apms.datacodesolution.com:/var/www/apms/frontend/"
rsync -avz --delete build/ apms@apms.datacodesolution.com:/var/www/apms/frontend/

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Frontend deployed successfully!"
  echo "🌐 Visit: https://apms.datacodesolution.com"
else
  echo ""
  echo "❌ Deployment failed. Please check SSH connection."
fi
