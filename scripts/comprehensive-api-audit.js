#!/usr/bin/env node

/**
 * COMPREHENSIVE API AUDIT SCRIPT
 * 
 * Systematically validates all 53 API endpoints in AXIS6 application
 * for reliability, security, and performance.
 * 
 * Usage: node scripts/comprehensive-api-audit.js [--production]
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
  baseUrl: process.argv.includes('--production') ? 'https://axis6.app' : 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  testUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  }
};

console.log(`🔍 AXIS6 COMPREHENSIVE API AUDIT`);
console.log(`==================================================`);
console.log(`Target: ${CONFIG.baseUrl}`);
console.log(`Timeout: ${CONFIG.timeout}ms`);
console.log(`Retries: ${CONFIG.retries}`);
console.log('');

// API endpoint definitions (all 53 discovered)
const API_ENDPOINTS = {
  // Authentication APIs (5)
  auth: [
    { path: '/api/auth/login', methods: ['POST'], requiresAuth: false },
    { path: '/api/auth/register', methods: ['POST'], requiresAuth: false },
    { path: '/api/auth/user', methods: ['GET'], requiresAuth: true },
    { path: '/api/auth/logout', methods: ['POST'], requiresAuth: true },
    { path: '/api/auth/test', methods: ['GET'], requiresAuth: false }
  ],
  
  // Core Application APIs (8)
  core: [
    { path: '/api/checkins', methods: ['GET', 'POST', 'PUT', 'DELETE'], requiresAuth: true },
    { path: '/api/streaks', methods: ['GET'], requiresAuth: true },
    { path: '/api/categories', methods: ['GET'], requiresAuth: true },
    { path: '/api/analytics', methods: ['GET'], requiresAuth: true },
    { path: '/api/time-blocks', methods: ['GET', 'POST'], requiresAuth: true },
    { path: '/api/micro-wins', methods: ['GET', 'POST'], requiresAuth: true },
    { path: '/api/activity-timer', methods: ['GET', 'POST'], requiresAuth: true },
    { path: '/api/micro-posts', methods: ['GET', 'POST'], requiresAuth: true }
  ],
  
  // Mantras & Daily Content (2)
  mantras: [
    { path: '/api/mantras/daily', methods: ['GET'], requiresAuth: true },
    { path: '/api/mantras/complete', methods: ['POST'], requiresAuth: true }
  ],
  
  // Chat System APIs (12)
  chat: [
    { path: '/api/chat/rooms', methods: ['GET', 'POST'], requiresAuth: true },
    { path: '/api/chat/rooms/:roomId', methods: ['GET', 'PUT', 'DELETE'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/rooms/:roomId/messages', methods: ['GET', 'POST'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/rooms/:roomId/messages/:messageId', methods: ['GET', 'PUT', 'DELETE'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/rooms/:roomId/messages/:messageId/reactions', methods: ['GET', 'POST'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/rooms/:roomId/participants', methods: ['GET', 'POST'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/rooms/:roomId/participants/:userId', methods: ['DELETE'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/attachments', methods: ['POST'], requiresAuth: true },
    { path: '/api/chat/attachments/:id', methods: ['GET', 'DELETE'], requiresAuth: true, dynamic: true },
    { path: '/api/chat/search', methods: ['GET'], requiresAuth: true },
    { path: '/api/chat/search/analytics', methods: ['GET'], requiresAuth: true },
    { path: '/api/chat/mentions', methods: ['GET'], requiresAuth: true },
    { path: '/api/chat/analytics', methods: ['GET'], requiresAuth: true }
  ],
  
  // AI & Intelligence APIs (8)
  ai: [
    { path: '/api/ai/analyze-personality', methods: ['POST'], requiresAuth: true },
    { path: '/api/ai/behavior-analysis', methods: ['POST'], requiresAuth: true },
    { path: '/api/ai/generate-questions', methods: ['POST'], requiresAuth: true },
    { path: '/api/ai/optimal-times', methods: ['GET'], requiresAuth: true },
    { path: '/api/ai/recommend-activities', methods: ['POST'], requiresAuth: true },
    { path: '/api/ai/recommendations', methods: ['GET'], requiresAuth: true },
    { path: '/api/ai/smart-notifications', methods: ['GET'], requiresAuth: true },
    { path: '/api/constellation', methods: ['GET', 'POST'], requiresAuth: true }
  ],
  
  // Hexagon & Resonance APIs (3)
  resonance: [
    { path: '/api/hex-reactions', methods: ['GET', 'POST'], requiresAuth: true },
    { path: '/api/resonance/hexagon', methods: ['GET'], requiresAuth: true },
    { path: '/api/resonance/streaks', methods: ['GET'], requiresAuth: true }
  ],
  
  // Settings APIs (5)
  settings: [
    { path: '/api/settings/privacy', methods: ['GET', 'PUT'], requiresAuth: true },
    { path: '/api/settings/security', methods: ['GET', 'PUT'], requiresAuth: true },
    { path: '/api/settings/user-preferences', methods: ['GET', 'PUT'], requiresAuth: true },
    { path: '/api/settings/axis-customization', methods: ['GET', 'PUT'], requiresAuth: true },
    { path: '/api/settings/notifications', methods: ['GET', 'PUT'], requiresAuth: true }
  ],
  
  // Dashboard APIs (1)
  dashboard: [
    { path: '/api/my-day/stats', methods: ['GET'], requiresAuth: true }
  ],
  
  // Monitoring & Admin APIs (4)
  monitoring: [
    { path: '/api/monitoring', methods: ['GET'], requiresAuth: true },
    { path: '/api/monitoring/logs', methods: ['GET'], requiresAuth: true },
    { path: '/api/monitoring/report', methods: ['POST'], requiresAuth: true },
    { path: '/api/admin/rate-limit-stats', methods: ['GET'], requiresAuth: true }
  ],
  
  // Utility & Infrastructure APIs (5)
  utility: [
    { path: '/api/health', methods: ['GET'], requiresAuth: false },
    { path: '/api/email', methods: ['POST'], requiresAuth: false },
    { path: '/api/email/test', methods: ['POST'], requiresAuth: false },
    { path: '/api/csp-report', methods: ['POST'], requiresAuth: false }
  ]
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AXIS6-API-Audit/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(endpoint, authToken = null) {
  const results = {};
  
  for (const method of endpoint.methods) {
    const testId = `${endpoint.path}:${method}`;
    console.log(`🧪 Testing ${testId}...`);
    
    try {
      // Replace dynamic parameters with test values
      let testPath = endpoint.path;
      if (endpoint.dynamic) {
        testPath = testPath
          .replace(':roomId', 'test-room-123')
          .replace(':messageId', 'test-message-123')
          .replace(':userId', 'test-user-123')
          .replace(':id', 'test-id-123');
      }
      
      const url = `${CONFIG.baseUrl}${testPath}`;
      const headers = {};
      
      if (authToken && endpoint.requiresAuth) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      let body = null;
      if (['POST', 'PUT'].includes(method)) {
        // Add test body based on endpoint type
        body = getTestPayload(endpoint.path);
      }
      
      const response = await makeRequest(url, { method, headers, body });
      
      results[method] = {
        statusCode: response.statusCode,
        success: isSuccessfulResponse(response.statusCode, endpoint.requiresAuth, authToken),
        responseTime: Date.now() - startTime,
        hasSecurityHeaders: checkSecurityHeaders(response.headers),
        rateLimited: response.statusCode === 429,
        error: response.statusCode >= 400 ? response.rawData : null
      };
      
      console.log(`  ${method}: ${response.statusCode} ${getStatusEmoji(response.statusCode)}`);
      
    } catch (error) {
      results[method] = {
        statusCode: null,
        success: false,
        error: error.message,
        timeout: error.message.includes('timeout')
      };
      console.log(`  ${method}: ERROR ${error.message} ❌`);
    }
    
    const startTime = Date.now();
  }
  
  return results;
}

function getTestPayload(path) {
  const payloads = {
    '/api/auth/login': { email: CONFIG.testUser.email, password: CONFIG.testUser.password },
    '/api/auth/register': { ...CONFIG.testUser },
    '/api/checkins': { category_id: 1, mood: 7, notes: 'Test checkin' },
    '/api/time-blocks': { title: 'Test Block', start_time: '09:00', duration: 60 },
    '/api/micro-wins': { title: 'Test Win', category: 'Physical' },
    '/api/chat/rooms': { name: 'Test Room', description: 'Test chat room' },
    '/api/mantras/complete': { mantra_id: 1 },
    '/api/settings/privacy': { data_sharing: false, analytics_opt_in: false }
  };
  
  return payloads[path] || { test: true, timestamp: Date.now() };
}

function isSuccessfulResponse(statusCode, requiresAuth, hasAuth) {
  if (!statusCode) return false;
  
  // If auth is required but not provided, expect 401
  if (requiresAuth && !hasAuth) {
    return statusCode === 401;
  }
  
  // Otherwise expect success codes
  return statusCode >= 200 && statusCode < 300;
}

function checkSecurityHeaders(headers) {
  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'strict-transport-security'
  ];
  
  return securityHeaders.some(header => headers[header]);
}

function getStatusEmoji(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return '✅';
  if (statusCode >= 300 && statusCode < 400) return '🔄';
  if (statusCode === 401 || statusCode === 403) return '🔐';
  if (statusCode === 404) return '🔍';
  if (statusCode === 429) return '⏰';
  if (statusCode >= 500) return '💥';
  return '⚠️';
}

async function attemptAuthentication() {
  console.log('🔐 Attempting authentication for protected endpoints...');
  
  try {
    const loginResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      body: {
        email: CONFIG.testUser.email,
        password: CONFIG.testUser.password
      }
    });
    
    if (loginResponse.statusCode === 200 && loginResponse.data?.access_token) {
      console.log('✅ Authentication successful');
      return loginResponse.data.access_token;
    }
    
    // Try registration if login fails
    console.log('🔄 Login failed, attempting registration...');
    const registerResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/register`, {
      method: 'POST',
      body: CONFIG.testUser
    });
    
    if (registerResponse.statusCode === 201 && registerResponse.data?.access_token) {
      console.log('✅ Registration successful');
      return registerResponse.data.access_token;
    }
    
    console.log('❌ Authentication failed');
    return null;
    
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return null;
  }
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      totalEndpoints: 0,
      totalMethods: 0,
      successfulTests: 0,
      failedTests: 0,
      timeoutTests: 0,
      rateLimitedTests: 0,
      securityHeadersPresent: 0
    },
    categories: {},
    recommendations: []
  };
  
  // Analyze results
  for (const [category, endpoints] of Object.entries(results)) {
    report.categories[category] = { endpoints: {} };
    
    for (const [path, methodResults] of Object.entries(endpoints)) {
      report.summary.totalEndpoints++;
      report.categories[category].endpoints[path] = methodResults;
      
      for (const [method, result] of Object.entries(methodResults)) {
        report.summary.totalMethods++;
        
        if (result.success) report.summary.successfulTests++;
        else report.summary.failedTests++;
        
        if (result.timeout) report.summary.timeoutTests++;
        if (result.rateLimited) report.summary.rateLimitedTests++;
        if (result.hasSecurityHeaders) report.summary.securityHeadersPresent++;
      }
    }
  }
  
  // Generate recommendations
  if (report.summary.failedTests > 0) {
    report.recommendations.push({
      priority: 'HIGH',
      category: 'Reliability',
      issue: `${report.summary.failedTests} API tests failed`,
      action: 'Review failed endpoints and fix implementation issues'
    });
  }
  
  if (report.summary.timeoutTests > 0) {
    report.recommendations.push({
      priority: 'MEDIUM',
      category: 'Performance',
      issue: `${report.summary.timeoutTests} API tests timed out`,
      action: 'Optimize slow endpoints and consider caching'
    });
  }
  
  if (report.summary.securityHeadersPresent < report.summary.totalMethods * 0.8) {
    report.recommendations.push({
      priority: 'HIGH',
      category: 'Security',
      issue: 'Missing security headers on many endpoints',
      action: 'Implement consistent security headers across all API routes'
    });
  }
  
  if (report.summary.rateLimitedTests === 0) {
    report.recommendations.push({
      priority: 'MEDIUM',
      category: 'Security',
      issue: 'No rate limiting detected',
      action: 'Implement rate limiting on sensitive endpoints'
    });
  }
  
  return report;
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive API audit...\n');
  
  // Check if server is reachable
  try {
    await makeRequest(`${CONFIG.baseUrl}/api/health`);
    console.log('✅ Server is reachable');
  } catch (error) {
    console.log('❌ Server is not reachable:', error.message);
    console.log('\n💡 Start the development server with: npm run dev');
    process.exit(1);
  }
  
  // Attempt authentication
  const authToken = await attemptAuthentication();
  console.log('');
  
  // Test all endpoints
  const results = {};
  
  for (const [category, endpoints] of Object.entries(API_ENDPOINTS)) {
    console.log(`📁 Testing ${category.toUpperCase()} APIs (${endpoints.length} endpoints)`);
    results[category] = {};
    
    for (const endpoint of endpoints) {
      results[category][endpoint.path] = await testEndpoint(endpoint, authToken);
    }
    
    console.log('');
  }
  
  // Generate and save report
  const report = await generateReport(results);
  const reportPath = '/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs/api-audit-report.json';
  
  try {
    await fs.mkdir('/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️ Could not save report: ${error.message}`);
  }
  
  // Print summary
  console.log('\n📋 AUDIT SUMMARY');
  console.log('==================================================');
  console.log(`Total Endpoints: ${report.summary.totalEndpoints}`);
  console.log(`Total Methods: ${report.summary.totalMethods}`);
  console.log(`Successful Tests: ${report.summary.successfulTests} ✅`);
  console.log(`Failed Tests: ${report.summary.failedTests} ❌`);
  console.log(`Timeout Tests: ${report.summary.timeoutTests} ⏰`);
  console.log(`Rate Limited: ${report.summary.rateLimitedTests} 🚦`);
  console.log(`Security Headers: ${report.summary.securityHeadersPresent}/${report.summary.totalMethods} 🛡️`);
  
  const successRate = ((report.summary.successfulTests / report.summary.totalMethods) * 100).toFixed(1);
  console.log(`\n🎯 Overall Success Rate: ${successRate}%`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🔧 RECOMMENDATIONS');
    console.log('==================================================');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
      console.log(`   → ${rec.action}\n`);
    });
  }
  
  console.log('✅ API audit completed!\n');
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, API_ENDPOINTS };