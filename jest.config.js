const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns - only unit and integration tests
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/coverage/', '/dist/', '/tests/e2e/'],
  
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/.next/**',
    '!**/dist/**',
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  
  // Enhanced coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for critical modules
    './lib/utils/logger.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/middleware/enhanced-rate-limit.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/email/service.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Test timeout for integration tests
  testTimeout: 30000,
  
  // Verbose output in CI
  verbose: process.env.CI === 'true',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)