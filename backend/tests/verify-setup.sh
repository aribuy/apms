#!/bin/bash

# Enterprise-Grade Testing: Verification Script
# Purpose: Quick check that test infrastructure is properly set up

echo "═══════════════════════════════════════════════════"
echo "  APMS ENTERPRISE-GRADE TESTING - VERIFICATION"
echo "═══════════════════════════════════════════════════"
echo ""

# Check 1: Directory structure
echo "✓ Check 1: Test directory structure"
echo "  ├─ contracts/         $(test -d tests/contracts && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  ├─ fixtures/          $(test -d tests/fixtures && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  ├─ integration/       $(test -d tests/integration && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  └─ unit/              $(test -d tests/unit && echo '✓ EXISTS' || echo '✗ MISSING')"
echo ""

# Check 2: Idempotency middleware
echo "✓ Check 2: Idempotency middleware"
echo "  └─ idempotency.js    $(test -f src/middleware/idempotency.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo ""

# Check 3: Contract tests
echo "✓ Check 3: Contract tests"
echo "  ├─ site-registration-contract.test.js    $(test -f tests/contracts/site-registration-contract.test.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  ├─ idempotency-contract.test.js         $(test -f tests/contracts/idempotency-contract.test.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  ├─ rbac-3layer.test.js                  $(test -f tests/contracts/rbac-3layer.test.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  └─ approval-state-machine.test.js       $(test -f tests/contracts/approval-state-machine.test.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo ""

# Check 4: Test data generator
echo "✓ Check 4: Test utilities"
echo "  └─ test-data-generator.js               $(test -f tests/fixtures/test-data-generator.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo ""

# Check 5: Jest configuration
echo "✓ Check 5: Jest configuration"
echo "  ├─ jest.config.js                       $(test -f jest.config.js && echo '✓ EXISTS' || echo '✗ MISSING')"
echo "  └─ jest-junit installed                 $(npm list jest-junit --silent 2>/dev/null | grep -q jest-junit && echo '✓ INSTALLED' || echo '✗ MISSING')"
echo ""

# Check 6: Server.js export
echo "✓ Check 6: Server.js export for testing"
echo "  └─ module.exports = app                 $(grep -q 'module.exports = app' server.js && echo '✓ CONFIGURED' || echo '✗ MISSING')"
echo ""

# Check 7: Idempotency middleware integration
echo "✓ Check 7: Idempotency middleware integration"
echo "  └─ Applied to site-registration routes  $(grep -q 'idempotencyCheck' server.js && echo '✓ CONFIGURED' || echo '✗ MISSING')"
echo ""

# Summary
echo "═══════════════════════════════════════════════════"
echo "  VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Run unit tests:        npm run test:unit"
echo "  2. Run contract tests:    npm test -- tests/contracts"
echo "  3. Run all tests:         npm test"
echo "  4. Coverage report:       npm run test:coverage"
echo ""
echo "Evidence pack location:"
echo "  - Coverage HTML:          coverage/lcov-report/index.html"
echo "  - JUnit XML:              test-results/junit.xml"
echo "  - Coverage JSON:          coverage/coverage-final.json"
echo ""
