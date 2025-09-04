#!/usr/bin/env node

/**
 * SIMPLIFIED API VALIDATION SCRIPT
 * 
 * Quick validation of all API endpoints with proper error handling
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 5000;

console.log('🔍 AXIS6 API VALIDATION');
console.log('==================================================');

// Core API endpoints to validate
const ENDPOINTS = [
  // Health & Utility
  { path: '/api/health', method: 'GET', auth: false, critical: true },
  { path: '/api/csp-report', method: 'POST', auth: false, critical: false },
  
  // Authentication
  { path: '/api/auth/test', method: 'GET', auth: false, critical: true },
  { path: '/api/auth/login', method: 'POST', auth: false, critical: true },
  { path: '/api/auth/register', method: 'POST', auth: false, critical: true },
  { path: '/api/auth/user', method: 'GET', auth: true, critical: true },
  { path: '/api/auth/logout', method: 'POST', auth: true, critical: true },
  
  // Core Features
  { path: '/api/categories', method: 'GET', auth: true, critical: true },
  { path: '/api/checkins', method: 'GET', auth: true, critical: true },
  { path: '/api/checkins', method: 'POST', auth: true, critical: true },
  { path: '/api/streaks', method: 'GET', auth: true, critical: true },
  { path: '/api/analytics', method: 'GET', auth: true, critical: true },
  
  // Dashboard & Stats
  { path: '/api/my-day/stats', method: 'GET', auth: true, critical: true },
  
  // Settings
  { path: '/api/settings/privacy', method: 'GET', auth: true, critical: false },
  { path: '/api/settings/security', method: 'GET', auth: true, critical: false },
  { path: '/api/settings/notifications', method: 'GET', auth: true, critical: false },
  { path: '/api/settings/axis-customization', method: 'GET', auth: true, critical: false },
  { path: '/api/settings/user-preferences', method: 'GET', auth: true, critical: false },
  
  // Mantras & Content
  { path: '/api/mantras/daily', method: 'GET', auth: true, critical: false },
  
  // Time Management
  { path: '/api/time-blocks', method: 'GET', auth: true, critical: false },
  { path: '/api/activity-timer', method: 'GET', auth: true, critical: false },
  { path: '/api/micro-wins', method: 'GET', auth: true, critical: false },
  
  // AI & Intelligence
  { path: '/api/ai/recommendations', method: 'GET', auth: true, critical: false },
  { path: '/api/constellation', method: 'GET', auth: true, critical: false },
  
  // Hexagon & Resonance
  { path: '/api/hex-reactions', method: 'GET', auth: true, critical: false },
  { path: '/api/resonance/hexagon', method: 'GET', auth: true, critical: false },
  { path: '/api/resonance/streaks', method: 'GET', auth: true, critical: false },
  
  // Chat System (basic checks)
  { path: '/api/chat/rooms', method: 'GET', auth: true, critical: false },
  { path: '/api/chat/search', method: 'GET', auth: true, critical: false },
  { path: '/api/chat/analytics', method: 'GET', auth: true, critical: false },
  
  // Monitoring
  { path: '/api/monitoring', method: 'GET', auth: true, critical: false },
  { path: '/api/admin/rate-limit-stats', method: 'GET', auth: true, critical: false },
  
  // Email
  { path: '/api/email/test', method: 'POST', auth: false, critical: false }
];

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AXIS6-API-Validator/1.0',
        ...headers
      },
      timeout: TIMEOUT
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function getStatusIcon(statusCode, requiresAuth, hasAuth) {
  if (!statusCode) return '💥';
  
  // If auth required but not provided, 401 is expected
  if (requiresAuth && !hasAuth && statusCode === 401) return '🔐';
  
  // Success codes
  if (statusCode >= 200 && statusCode < 300) return '✅';
  
  // Client errors
  if (statusCode === 404) return '🔍';
  if (statusCode === 429) return '⏰';
  if (statusCode >= 400 && statusCode < 500) return '⚠️';
  
  // Server errors
  if (statusCode >= 500) return '💥';
  
  return '❓';
}

async function main() {
  let results = {
    total: ENDPOINTS.length,
    success: 0,
    failed: 0,
    critical_failed: 0,
    auth_blocked: 0,
    server_errors: 0,
    not_found: 0,
    details: []
  };
  
  console.log(`Testing ${ENDPOINTS.length} API endpoints...`);
  console.log('');
  
  for (const endpoint of ENDPOINTS) {
    try {
      const url = `${BASE_URL}${endpoint.path}`;
      const response = await makeRequest(url, endpoint.method);
      
      const status = getStatusIcon(response.statusCode, endpoint.auth, false);
      const critical = endpoint.critical ? '🚨' : '📋';
      
      console.log(`${status} ${critical} ${endpoint.method} ${endpoint.path} - ${response.statusCode}`);
      
      const result = {
        path: endpoint.path,
        method: endpoint.method,
        statusCode: response.statusCode,
        critical: endpoint.critical,
        requiresAuth: endpoint.auth,
        success: false
      };
      
      // Determine if result is successful
      if (endpoint.auth && response.statusCode === 401) {
        result.success = true; // Auth required, got 401 = correct
        results.auth_blocked++;
      } else if (response.statusCode >= 200 && response.statusCode < 300) {
        result.success = true;
        results.success++;
      } else {
        results.failed++;
        if (endpoint.critical) {
          results.critical_failed++;
        }
        if (response.statusCode >= 500) {
          results.server_errors++;
        }
        if (response.statusCode === 404) {
          results.not_found++;
        }
      }
      
      results.details.push(result);
      
    } catch (error) {
      const critical = endpoint.critical ? '🚨' : '📋';
      console.log(`💥 ${critical} ${endpoint.method} ${endpoint.path} - ERROR: ${error.message}`);
      
      results.details.push({
        path: endpoint.path,
        method: endpoint.method,
        error: error.message,
        critical: endpoint.critical,
        success: false
      });
      
      results.failed++;
      if (endpoint.critical) {
        results.critical_failed++;
      }
    }
  }
  
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('==================================================');
  console.log(`Total endpoints tested: ${results.total}`);
  console.log(`Successful responses: ${results.success} ✅`);
  console.log(`Auth-protected (401): ${results.auth_blocked} 🔐`);
  console.log(`Failed requests: ${results.failed} ❌`);
  console.log(`Critical failures: ${results.critical_failed} 🚨`);
  console.log(`Server errors (5xx): ${results.server_errors} 💥`);
  console.log(`Not found (404): ${results.not_found} 🔍`);
  
  const successRate = ((results.success + results.auth_blocked) / results.total * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  // Key findings
  console.log('\n🔍 KEY FINDINGS');
  console.log('==================================================');
  
  const criticalFailures = results.details.filter(r => r.critical && !r.success);
  if (criticalFailures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:');
    criticalFailures.forEach(f => {
      console.log(`  - ${f.method} ${f.path}: ${f.statusCode || 'ERROR'}`);
    });
    console.log('');
  }
  
  const serverErrors = results.details.filter(r => r.statusCode >= 500);
  if (serverErrors.length > 0) {
    console.log('💥 SERVER ERRORS:');
    serverErrors.forEach(e => {
      console.log(`  - ${e.method} ${e.path}: ${e.statusCode}`);
    });
    console.log('');
  }
  
  const notFound = results.details.filter(r => r.statusCode === 404);
  if (notFound.length > 0) {
    console.log('🔍 NOT FOUND (Missing Endpoints):');
    notFound.forEach(n => {
      console.log(`  - ${n.method} ${n.path}`);
    });
    console.log('');
  }
  
  const authProtected = results.details.filter(r => r.statusCode === 401);
  console.log('🔐 AUTH-PROTECTED ENDPOINTS:');
  console.log(`  ${authProtected.length} endpoints correctly require authentication`);
  console.log('');
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('==================================================');
  
  if (results.critical_failed > 0) {
    console.log('🚨 HIGH PRIORITY: Fix critical endpoint failures');
    console.log('   These endpoints are essential for core functionality');
  }
  
  if (results.server_errors > 0) {
    console.log('💥 HIGH PRIORITY: Resolve server errors (5xx responses)');
    console.log('   Check logs and fix implementation issues');
  }
  
  if (results.not_found > 3) {
    console.log('🔍 MEDIUM PRIORITY: Implement missing endpoints');
    console.log('   Several expected endpoints return 404');
  }
  
  if (successRate < 70) {
    console.log('⚠️ OVERALL: API health is concerning');
    console.log('   Consider comprehensive API review and testing');
  } else if (successRate < 90) {
    console.log('📈 OVERALL: API health is acceptable but needs improvement');
  } else {
    console.log('✅ OVERALL: API health is good');
  }
  
  console.log('\n✅ API validation completed!\n');
  
  // Save report
  try {
    const fs = require('fs');
    const reportPath = '/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    fs.writeFileSync(`${reportPath}/api-validation-report.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: results,
      endpoints: ENDPOINTS
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}/api-validation-report.json`);
  } catch (error) {
    console.log(`⚠️ Could not save report: ${error.message}`);
  }
}

// Execute
main().catch(console.error);