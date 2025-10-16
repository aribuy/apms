#!/bin/bash

echo "🚀 Running All EATP RBAC Tests..."

# Check if server is running
if ! curl -s http://localhost:3011/api/health > /dev/null; then
    echo "❌ Backend server not running. Start with: cd backend && npm start"
    exit 1
fi

echo "✅ Backend server is running"

# Run quick test
echo -e "\n1. Running Quick Test..."
node quick-test.js

# Run workflow simulation  
echo -e "\n2. Running Workflow Simulation..."
node test-eatp-workflow-simulation.js

# Check database
echo -e "\n3. Checking Database..."
psql "postgresql://endik@localhost:5432/apms_local" -c "
SELECT 'Users: ' || COUNT(*) FROM users WHERE role IN ('VENDOR_ADMIN', 'FOP_RTS', 'BO');
SELECT 'ATPs: ' || COUNT(*) FROM atp_documents;
SELECT 'Templates: ' || COUNT(*) FROM atp_document_templates;
"

echo -e "\n🎉 All Tests Complete!"
echo "📋 Next: Test frontend at http://localhost:3000"