// Playwright Global Setup
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Suite');
  console.log('📋 Base URL:', process.env.BASE_URL || 'http://localhost:3000');
  console.log('🌐 Browser:', config.projects?.[0]?.use);

  // TODO: Setup test database, seed data, etc.
  // await seedTestData();
}

export default globalSetup;
