#!/usr/bin/env node

/**
 * STATIC API ANALYSIS
 * 
 * Analyzes all API endpoint files for structure, security, and implementation quality
 * without requiring a running server.
 */

const fs = require('fs').promises;
const path = require('path');

console.log('📊 AXIS6 STATIC API ANALYSIS');
console.log('==================================================');

const API_DIR = '/Users/nadalpiantini/Dev/axis6-mvp/axis6/app/api';

async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const relativePath = filePath.replace('/Users/nadalpiantini/Dev/axis6-mvp/axis6', '');
    
    const analysis = {
      path: relativePath,
      size: content.length,
      lines: content.split('\n').length,
      methods: [],
      hasAuth: false,
      hasValidation: false,
      hasErrorHandling: false,
      hasRateLimit: false,
      hasTypes: false,
      issues: [],
      security: {
        hasAuthCheck: false,
        hasInputValidation: false,
        hasOutputSanitization: false,
        hasRLS: false
      }
    };
    
    // Extract HTTP methods
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      analysis.methods.push(match[1]);
    }
    
    // Check for authentication
    if (content.includes('getUser') || content.includes('auth.getUser') || content.includes('session') || content.includes('jwt')) {
      analysis.hasAuth = true;
      analysis.security.hasAuthCheck = true;
    }
    
    // Check for validation
    if (content.includes('zod') || content.includes('z.') || content.includes('validate') || content.includes('schema')) {
      analysis.hasValidation = true;
      analysis.security.hasInputValidation = true;
    }
    
    // Check for error handling
    if (content.includes('try') && content.includes('catch')) {
      analysis.hasErrorHandling = true;
    }
    
    // Check for rate limiting
    if (content.includes('ratelimit') || content.includes('rate-limit') || content.includes('Ratelimit')) {
      analysis.hasRateLimit = true;
    }
    
    // Check for TypeScript
    if (content.includes(': ') && (content.includes('interface') || content.includes('type'))) {
      analysis.hasTypes = true;
    }
    
    // Check for RLS (Row Level Security)
    if (content.includes('rls') || content.includes('RLS') || content.includes('policy')) {
      analysis.security.hasRLS = true;
    }
    
    // Security issues
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY') && !content.includes('// Admin only')) {
      analysis.issues.push({
        type: 'SECURITY',
        severity: 'HIGH',
        message: 'Uses service role key without admin check'
      });
    }
    
    if (content.includes('console.log') && !content.includes('// DEBUG')) {
      analysis.issues.push({
        type: 'SECURITY',
        severity: 'LOW',
        message: 'Contains console.log statements'
      });
    }
    
    // Missing error handling
    if (analysis.methods.length > 0 && !analysis.hasErrorHandling) {
      analysis.issues.push({
        type: 'RELIABILITY',
        severity: 'MEDIUM',
        message: 'Missing try/catch error handling'
      });
    }
    
    // Missing authentication on non-public endpoints
    const isPublic = relativePath.includes('/health') || 
                    relativePath.includes('/csp-report') ||
                    relativePath.includes('/auth/') ||
                    relativePath.includes('/email/test');
    
    if (!isPublic && !analysis.hasAuth) {
      analysis.issues.push({
        type: 'SECURITY',
        severity: 'HIGH',
        message: 'Missing authentication check'
      });
    }
    
    // Missing input validation
    if ((analysis.methods.includes('POST') || analysis.methods.includes('PUT')) && !analysis.hasValidation) {
      analysis.issues.push({
        type: 'SECURITY',
        severity: 'MEDIUM',
        message: 'Missing input validation on write operations'
      });
    }
    
    return analysis;
    
  } catch (error) {
    return {
      path: filePath,
      error: error.message,
      issues: [{
        type: 'ANALYSIS',
        severity: 'HIGH',
        message: `Failed to analyze file: ${error.message}`
      }]
    };
  }
}

async function findApiFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findApiFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not read directory ${dir}: ${error.message}`);
  }
  
  return files;
}

function generateSecurityScore(analysis) {
  let score = 100;
  
  // Deduct points for security issues
  analysis.forEach(endpoint => {
    if (endpoint.issues) {
      endpoint.issues.forEach(issue => {
        if (issue.type === 'SECURITY') {
          switch (issue.severity) {
            case 'HIGH': score -= 10; break;
            case 'MEDIUM': score -= 5; break;
            case 'LOW': score -= 2; break;
          }
        }
      });
    }
  });
  
  return Math.max(0, score);
}

function generateReliabilityScore(analysis) {
  let score = 100;
  let totalEndpoints = analysis.length;
  let endpointsWithErrorHandling = analysis.filter(a => a.hasErrorHandling).length;
  let endpointsWithValidation = analysis.filter(a => a.hasValidation).length;
  
  // Deduct for missing error handling
  score -= ((totalEndpoints - endpointsWithErrorHandling) / totalEndpoints) * 30;
  
  // Deduct for missing validation
  score -= ((totalEndpoints - endpointsWithValidation) / totalEndpoints) * 20;
  
  // Deduct for reliability issues
  analysis.forEach(endpoint => {
    if (endpoint.issues) {
      endpoint.issues.forEach(issue => {
        if (issue.type === 'RELIABILITY') {
          switch (issue.severity) {
            case 'HIGH': score -= 8; break;
            case 'MEDIUM': score -= 4; break;
            case 'LOW': score -= 1; break;
          }
        }
      });
    }
  });
  
  return Math.max(0, Math.round(score));
}

async function main() {
  const apiFiles = await findApiFiles(API_DIR);
  console.log(`Found ${apiFiles.length} API endpoint files\n`);
  
  const analysis = [];
  
  for (const file of apiFiles) {
    const result = await analyzeFile(file);
    analysis.push(result);
    
    const methods = result.methods?.join(', ') || 'Unknown';
    const issues = result.issues?.length || 0;
    const status = issues === 0 ? '✅' : issues <= 2 ? '⚠️' : '❌';
    
    console.log(`${status} ${result.path}`);
    console.log(`   Methods: ${methods}`);
    console.log(`   Lines: ${result.lines || 'Unknown'}`);
    console.log(`   Auth: ${result.hasAuth ? '✅' : '❌'}`);
    console.log(`   Validation: ${result.hasValidation ? '✅' : '❌'}`);
    console.log(`   Error Handling: ${result.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Issues: ${issues}`);
    console.log('');
  }
  
  // Generate summary
  const totalEndpoints = analysis.length;
  const withAuth = analysis.filter(a => a.hasAuth).length;
  const withValidation = analysis.filter(a => a.hasValidation).length;
  const withErrorHandling = analysis.filter(a => a.hasErrorHandling).length;
  const withRateLimit = analysis.filter(a => a.hasRateLimit).length;
  const totalIssues = analysis.reduce((sum, a) => sum + (a.issues?.length || 0), 0);
  const highSeverityIssues = analysis.reduce((sum, a) => {
    return sum + (a.issues?.filter(i => i.severity === 'HIGH')?.length || 0);
  }, 0);
  
  console.log('📊 ANALYSIS SUMMARY');
  console.log('==================================================');
  console.log(`Total API Endpoints: ${totalEndpoints}`);
  console.log(`With Authentication: ${withAuth}/${totalEndpoints} (${Math.round(withAuth/totalEndpoints*100)}%)`);
  console.log(`With Validation: ${withValidation}/${totalEndpoints} (${Math.round(withValidation/totalEndpoints*100)}%)`);
  console.log(`With Error Handling: ${withErrorHandling}/${totalEndpoints} (${Math.round(withErrorHandling/totalEndpoints*100)}%)`);
  console.log(`With Rate Limiting: ${withRateLimit}/${totalEndpoints} (${Math.round(withRateLimit/totalEndpoints*100)}%)`);
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`High Severity Issues: ${highSeverityIssues}`);
  
  // Scores
  const securityScore = generateSecurityScore(analysis);
  const reliabilityScore = generateReliabilityScore(analysis);
  
  console.log('\n🏆 QUALITY SCORES');
  console.log('==================================================');
  console.log(`Security Score: ${securityScore}/100 ${securityScore >= 80 ? '✅' : securityScore >= 60 ? '⚠️' : '❌'}`);
  console.log(`Reliability Score: ${reliabilityScore}/100 ${reliabilityScore >= 80 ? '✅' : reliabilityScore >= 60 ? '⚠️' : '❌'}`);
  
  // Critical issues
  const criticalIssues = analysis.filter(a => 
    a.issues && a.issues.some(i => i.severity === 'HIGH')
  );
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES');
    console.log('==================================================');
    criticalIssues.forEach(endpoint => {
      console.log(`${endpoint.path}:`);
      endpoint.issues.filter(i => i.severity === 'HIGH').forEach(issue => {
        console.log(`  ❌ ${issue.message}`);
      });
      console.log('');
    });
  }
  
  // Recommendations by category
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================================================');
  
  if (securityScore < 80) {
    console.log('🔒 SECURITY (Priority: HIGH)');
    console.log('  - Add authentication checks to protected endpoints');
    console.log('  - Implement input validation on all POST/PUT endpoints');
    console.log('  - Remove or secure service role key usage');
    console.log('  - Add rate limiting to prevent abuse');
    console.log('');
  }
  
  if (reliabilityScore < 80) {
    console.log('🛠️ RELIABILITY (Priority: HIGH)');
    console.log('  - Add comprehensive error handling (try/catch blocks)');
    console.log('  - Implement request validation schemas');
    console.log('  - Add logging for debugging and monitoring');
    console.log('  - Create consistent error response formats');
    console.log('');
  }
  
  if (withErrorHandling / totalEndpoints < 0.8) {
    console.log('📊 PERFORMANCE & MONITORING (Priority: MEDIUM)');
    console.log('  - Add request/response logging');
    console.log('  - Implement health checks and metrics');
    console.log('  - Add response caching where appropriate');
    console.log('  - Monitor API response times and error rates');
    console.log('');
  }
  
  // Method distribution
  const methodCounts = {};
  analysis.forEach(endpoint => {
    if (endpoint.methods) {
      endpoint.methods.forEach(method => {
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });
    }
  });
  
  console.log('📈 HTTP METHOD DISTRIBUTION');
  console.log('==================================================');
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`${method}: ${count} endpoints`);
  });
  
  // Save detailed report
  const reportPath = '/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs/static-api-analysis.json';
  try {
    await fs.mkdir('/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints,
        withAuth,
        withValidation,
        withErrorHandling,
        withRateLimit,
        totalIssues,
        highSeverityIssues,
        securityScore,
        reliabilityScore,
        methodCounts
      },
      endpoints: analysis,
      criticalIssues: criticalIssues.map(e => ({
        path: e.path,
        issues: e.issues.filter(i => i.severity === 'HIGH')
      }))
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️ Could not save report: ${error.message}`);
  }
  
  console.log('\n✅ Static API analysis completed!');
  
  // Exit code based on critical issues
  if (highSeverityIssues > 0) {
    console.log('\n⚠️ Exiting with error code due to critical security issues');
    process.exit(1);
  }
}

main().catch(console.error);