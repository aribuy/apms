# 🧪 Automated Testing Guide

**APMS Testing Suite Documentation**
**Version**: 1.0.0
**Last Updated**: 2025-12-27

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Types](#test-types)
4. [Setup & Installation](#setup--installation)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The APMS automated testing suite provides comprehensive test coverage across three levels:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows through the UI

### Test Stack

| Type | Framework | Purpose |
|------|-----------|---------|
| Unit | Jest | Isolated function testing |
| Integration | Supertest + Jest | API endpoint testing |
| E2E | Playwright | Full user journey testing |
| CI/CD | GitHub Actions | Automated testing pipeline |

---

## 🏗️ Testing Strategy

### Testing Pyramid

```
         /\
        /  \        E2E Tests (5-10%)
       /----\       - Critical user journeys
      /      \      - Complete workflows
     /        \
    /----------\    Integration Tests (20-30%)
   /            \   - API endpoints
  /              \  - Database operations
 /----------------\
/                  \  Unit Tests (60-70%)
                    - Utilities
                    - Helpers
                    - Business logic
```

### Coverage Goals

- **Unit Tests**: 70%+ coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user journeys covered

---

## 📊 Test Types

### 1. Unit Tests

**Location**: `backend/tests/unit/`

**Purpose**: Test individual functions and utilities in isolation

**Examples**:
- Authentication utilities (token generation, password hashing)
- Validation utilities (email, password, site codes)
- ATP workflow utilities (categorization, SLA calculation)

**Example Test**:
```javascript
describe('validateEmail()', () => {
  it('should accept valid email', () => {
    const result = validateEmail('test@apms.com');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateEmail('invalid');
    expect(result.valid).toBe(false);
  });
});
```

---

### 2. Integration Tests

**Location**: `backend/tests/integration/`

**Purpose**: Test API endpoints and database interactions

**Examples**:
- Authentication flow (login, logout, token refresh)
- CRUD operations (sites, ATP documents, tasks)
- Multi-stage approval workflows

**Example Test**:
```javascript
describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@apms.com', password: 'Test123!' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

---

### 3. E2E Tests

**Location**: `frontend/e2e/`

**Purpose**: Test complete user workflows through the UI

**Examples**:
- Login/logout flow
- ATP submission and approval workflow
- Site management (create, edit, delete)
- Task management and updates

**Example Test**:
```typescript
test('should submit new ATP document', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="email"]', 'vendor@apms.com');
  await page.fill('input[type="password"]', 'Test123!');
  await page.click('button[type="submit"]');

  await page.click('text=ATP Management');
  await page.click('text=Submit ATP');
  await page.selectOption('select[name="site_id"]', '1');
  await page.setInputFiles('input[type="file"]', 'test-file.pdf');
  await page.click('button:has-text("Submit")');

  await expect(page.locator('text=ATP submitted successfully')).toBeVisible();
});
```

---

## 🛠️ Setup & Installation

### Prerequisites

```bash
# Node.js 18+
node --version  # Should be v18 or higher

# PostgreSQL 14+
psql --version  # Should be 14 or higher
```

### Installation

#### Backend Dependencies

```bash
cd backend
npm install --save-dev jest supertest @types/jest ts-jest @jest/globals
```

#### Frontend Dependencies

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

### Environment Setup

Create `.env.test` file:

```env
# Database
DATABASE_URL="postgresql://apms_user:password@localhost:5432/apms_test"

# JWT
JWT_SECRET="test-secret-key-for-testing-only"

# Server
PORT=3011
NODE_ENV=test
```

### Database Setup

```bash
# Create test database
createdb apms_test

# Run migrations
cd backend
npx prisma migrate deploy

# Seed test data
npx prisma db seed
```

---

## 🚀 Running Tests

### Run All Tests

```bash
# From root directory
npm test
```

### Run Unit Tests Only

```bash
cd backend
npm run test:unit
```

### Run Integration Tests Only

```bash
cd backend
npm run test:integration
```

### Run E2E Tests Only

```bash
cd frontend
npm run test:e2e
```

### Run with Coverage

```bash
cd backend
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
cd backend
npm run test:watch
```

### Run E2E Tests with UI

```bash
cd frontend
npm run test:e2e:ui
```

### Run E2E Tests in Debug Mode

```bash
cd frontend
npm run test:e2e:debug
```

---

## ✍️ Writing Tests

### Unit Test Structure

```javascript
// backend/tests/unit/example.test.js
const { functionToTest } = require('../../src/utils/example.utils');

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('functionName()', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Integration Test Structure

```javascript
// backend/tests/integration/api/example.api.test.js
const request = require('supertest');
const { createAuthenticatedUser } = require('../helpers/auth.helper');

describe('API Endpoint Tests', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    app = require('../../src/app');
    testUser = await createAuthenticatedUser(prisma, 'Administrator');
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/v1/endpoint', () => {
    it('should return data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/endpoint')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### E2E Test Structure

```typescript
// frontend/e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@apms.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should do something', async ({ page }) => {
    // Test steps
    await page.click('text=Some Button');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/test.yml`) automatically:

1. **Unit Tests** - Runs on every push/PR
2. **Integration Tests** - Runs after unit tests pass
3. **E2E Tests** - Runs after integration tests pass
4. **Security Scan** - Runs in parallel with other tests
5. **Code Lint** - Runs in parallel with other tests
6. **Test Report** - Generates and comments on PRs

### Workflow Status

Check workflow status at:
```
https://github.com/aribuy/apms/actions
```

### Test Reports

Test results are automatically commented on PRs with:
- Unit test status
- Integration test status
- E2E test status
- Coverage percentages
- Security scan results

---

## 📚 Best Practices

### Unit Tests

✅ **DO**:
- Test one thing per test
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies
- Keep tests fast and isolated

❌ **DON'T**:
- Don't test multiple things in one test
- Don't rely on test execution order
- Don't include external API calls
- Don't write brittle tests

### Integration Tests

✅ **DO**:
- Test complete request/response cycles
- Use test database (separate from dev/prod)
- Clean up test data after each test
- Test both success and failure cases
- Use realistic test data

❌ **DON'T**:
- Don't use production database
- Don't leave test data behind
- Don't test only happy path
- Don't hardcode IDs or timestamps

### E2E Tests

✅ **DO**:
- Test critical user journeys
- Use realistic user flows
- Wait for elements explicitly
- Clean up after tests
- Use data-testid selectors

❌ **DON'T**:
- Don't test every edge case (use unit/integration for that)
- Don't rely on fixed timeouts
- Don't use CSS selectors (brittle)
- Don't skip cleanup

### General

- **AAA Pattern**: Arrange, Act, Assert
- **Given-When-Then**: Describe behavior clearly
- **Test Independence**: Each test should run independently
- **Fast Feedback**: Keep tests fast for quick feedback
- **Meaningful Names**: Test names should describe what is being tested

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Tests timing out

**Solution**:
```javascript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

#### Issue: Database connection errors

**Solution**:
```bash
# Ensure test database exists
createdb apms_test

# Check DATABASE_URL in .env.test
echo $DATABASE_URL

# Verify PostgreSQL is running
pg_isready
```

#### Issue: Playwright browsers not installed

**Solution**:
```bash
cd frontend
npx playwright install
npx playwright install-deps
```

#### Issue: Port already in use

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3011
lsof -ti:3011 | xargs kill -9
```

#### Issue: Tests failing locally but passing in CI

**Possible causes**:
- Different database schema
- Environment variables not set
- Different Node.js version
- Timezone differences

**Solution**:
```bash
# Ensure consistent environment
cp .env.test.example .env.test
npm run test:ci  # Use CI-optimized test command
```

### Debug Mode

#### Jest Debug

```bash
# Run with inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Then connect with Chrome DevTools
# chrome://inspect
```

#### Playwright Debug

```bash
# Run with debug mode
cd frontend
npx playwright test --debug

# Run with headed mode
npx playwright test --headed

# Run with trace viewer
npx playwright show-trace trace.zip
```

---

## 📈 Test Metrics

### Coverage Targets

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | 70%+ | ___ |
| Integration | 90%+ | ___ |
| E2E | Critical paths | ___ |

### Test Execution Time

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | < 30s | ___ |
| Integration | < 2m | ___ |
| E2E | < 10m | ___ |
| **Total** | < 15m | ___ |

---

## 🔗 Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Test Files

- Unit Tests: `backend/tests/unit/`
- Integration Tests: `backend/tests/integration/`
- E2E Tests: `frontend/e2e/`
- Test Helpers: `backend/tests/helpers/`

### Configuration Files

- Jest Config: `backend/jest.config.js`
- Playwright Config: `frontend/playwright.config.ts`
- GitHub Actions: `.github/workflows/test.yml`

---

## 📞 Support

**Questions**: Contact QA Team
**Issues**: [GitHub Issues](https://github.com/aribuy/apms/issues)
**Documentation**: [docs/testing/](.)

---

**Last Updated**: 2025-12-27
**Maintained By**: QA Team
**Version**: 1.0.0
