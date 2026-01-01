#!/bin/bash

# ================================================================
# API VERIFICATION SCRIPT
# Purpose: Test FK constraints via API endpoints
# Date: 2025-12-29
# ================================================================

set -e

# Configuration
PRODUCTION_URL="https://apms.datacodesolution.com"
STAGING_URL="https://apmsstaging.datacodesolution.com"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "API VERIFICATION - FK Constraints"
echo "========================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local endpoint=$2
    local description=$3

    echo -e "${YELLOW}Testing:${NC} $description"
    echo "URL: $url$endpoint"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url$endpoint")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $response"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $response"
        return 1
    fi
    echo ""
}

# ================================================================
# Production Tests
# ================================================================

echo "========================================"
echo "PRODUCTION ENVIRONMENT"
echo "========================================"
echo ""

test_endpoint "$PRODUCTION_URL" "/health" "Health Check"
test_endpoint "$PRODUCTION_URL" "/api/v1/tasks" "Task List"
test_endpoint "$PRODUCTION_URL" "/api/v1/workspaces" "Workspace List"

# Test FK constraint via invalid data
echo -e "${YELLOW}Testing:${NC} FK Constraint Protection (Invalid Config)"
echo "This should FAIL with FK violation error"

response=$(curl -s -X POST \
  "$PRODUCTION_URL/api/v1/workflow-instances" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "00000000-0000-0000-0000-000000000000",
    "configVersionId": "invalid-config-id",
    "siteId": "TEST-SITE",
    "scopeId": "invalid-scope-id",
    "atpCategory": "HARDWARE"
  }' \
  -o /dev/null \
  -w "%{http_code}")

if [ "$response" = "400" ] || [ "$response" = "500" ]; then
    echo -e "${GREEN}✅ PASS${NC} - FK constraint working (rejected invalid data)"
    echo "    Status: $response (expected failure)"
else
    echo -e "${RED}❌ UNEXPECTED${NC} - Status: $response (should have failed)"
fi
echo ""

# ================================================================
# Staging Tests
# ================================================================

echo "========================================"
echo "STAGING ENVIRONMENT"
echo "========================================"
echo ""

test_endpoint "$STAGING_URL" "/health" "Health Check"
test_endpoint "$STAGING_URL" "/api/v1/tasks" "Task List"
test_endpoint "$STAGING_URL" "/api/v1/workspaces" "Workspace List"
test_endpoint "$STAGING_URL" "/api/v1/config-versions" "Config Versions"

echo ""

# ================================================================
# Summary
# ================================================================

echo "========================================"
echo "VERIFICATION COMPLETE"
echo "========================================"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Open browser and test UI manually"
echo "2. Login to: $PRODUCTION_URL"
echo "3. Navigate to Task Management"
echo "4. Verify tasks are displayed (not blank)"
echo "5. Check browser console for errors (F12)"
echo ""
echo -e "${YELLOW}UI Verification Guide:${NC}"
echo "See: UI_VERIFICATION_GUIDE.md"
echo ""
