// Jest Configuration for APMS Backend
// Enterprise-Grade: Evidence pack generation, contract tests, CI/CD integration
const runIntegration = process.env.RUN_INTEGRATION === '1';
const baselineCoverage = process.env.BASELINE_COVERAGE === '1';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'json',
    'json-summary',
    'lcov',
    'text',
    'text-summary',
    'html'
  ],
  coverageThreshold: baselineCoverage ? {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  } : {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    // Critical paths - higher thresholds
    './src/routes/siteRegistrationRoutes.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/routes/atpUploadRoutes.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/middleware/idempotency.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: runIntegration
    ? []
    : ['<rootDir>/tests/integration/', '<rootDir>/tests/contracts/'],
  testTimeout: 30000, // Increased for API tests
  verbose: true,
  maxWorkers: 1, // Prevent database conflicts
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testSequencer: '<rootDir>/tests/test-sequencer.js',
  // JUnit XML for CI/CD evidence pack
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ]
};
