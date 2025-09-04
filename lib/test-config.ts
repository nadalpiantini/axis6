/**
 * Test Environment Configuration
 * Handles test-specific settings and bypasses
 */
export const isTestEnvironment = () => {
  return process.env['NODE_ENV'] === 'test' ||
         process.env['PLAYWRIGHT_TEST_BASE_URL'] !== undefined ||
         typeof window !== 'undefined' && window.localStorage?.getItem('testMode') === 'true';
};
export const shouldBypassRateLimit = () => {
  return isTestEnvironment() ||
         typeof window !== 'undefined' && window.localStorage?.getItem('bypassRateLimit') === 'true';
};
export const shouldBypassEmailConfirmation = () => {
  return isTestEnvironment() ||
         typeof window !== 'undefined' && window.localStorage?.getItem('bypassEmailConfirmation') === 'true';
};
export const getTestConfig = () => ({
  bypassRateLimit: shouldBypassRateLimit(),
  bypassEmailConfirmation: shouldBypassEmailConfirmation(),
  isTestEnvironment: isTestEnvironment(),
  testTimeout: 60000,
  retryDelay: 1000,
  maxRetries: 3
});
