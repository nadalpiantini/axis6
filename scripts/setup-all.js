#!/usr/bin/env node

/**
 * AXIS6 Complete Domain & Email Setup
 * Master script that orchestrates all configuration
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import all managers
const { CloudflareDNSManager } = require('./configure-dns');
const { VercelDomainManager } = require('./configure-vercel');
const { ResendEmailManager } = require('./configure-resend');
const { SupabaseEmailManager } = require('./configure-supabase-email');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(70) + '\n');
}

function logStep(step, description) {
  log(`\n[Step ${step}] ${description}`, 'cyan');
  console.log('-'.repeat(50));
}

async function checkEnvironment() {
  logSection('🔍 Environment Check');
  
  const requiredEnvVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'VERCEL_TOKEN',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = [];
  const presentVars = [];

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });

  if (presentVars.length > 0) {
    log('✅ Found environment variables:', 'green');
    presentVars.forEach(v => console.log(`   - ${v}`));
  }

  if (missingVars.length > 0) {
    log('\n❌ Missing environment variables:', 'red');
    missingVars.forEach(v => console.log(`   - ${v}`));
    
    console.log('\n📝 Instructions to get missing credentials:');
    
    if (missingVars.includes('CLOUDFLARE_API_TOKEN')) {
      console.log('\nCloudflare API Token:');
      console.log('1. Go to https://dash.cloudflare.com/profile/api-tokens');
      console.log('2. Create token with Zone:DNS:Edit permissions');
    }
    
    if (missingVars.includes('VERCEL_TOKEN')) {
      console.log('\nVercel Token:');
      console.log('1. Go to https://vercel.com/account/tokens');
      console.log('2. Create a new token with full access');
    }
    
    if (missingVars.includes('RESEND_API_KEY')) {
      console.log('\nResend API Key:');
      console.log('1. Sign up at https://resend.com');
      console.log('2. Go to API Keys and create a full access key');
    }
    
    return false;
  }

  return true;
}

async function setupDNS() {
  logStep(1, 'Configuring Cloudflare DNS');
  
  try {
    const manager = new CloudflareDNSManager(
      process.env.CLOUDFLARE_API_TOKEN,
      process.env.CLOUDFLARE_ACCOUNT_ID
    );
    
    await manager.configureDNS();
    log('\n✅ DNS configuration complete', 'green');
    return true;
  } catch (error) {
    log(`\n❌ DNS configuration failed: ${error.message}`, 'red');
    return false;
  }
}

async function setupVercel() {
  logStep(2, 'Configuring Vercel Domain');
  
  try {
    const manager = new VercelDomainManager(
      process.env.VERCEL_TOKEN,
      process.env.VERCEL_TEAM_ID
    );
    
    await manager.configureDomain();
    log('\n✅ Vercel domain configuration complete', 'green');
    return true;
  } catch (error) {
    log(`\n❌ Vercel configuration failed: ${error.message}`, 'red');
    return false;
  }
}

async function setupResend() {
  logStep(3, 'Configuring Resend Email Domain');
  
  try {
    const manager = new ResendEmailManager(process.env.RESEND_API_KEY);
    const config = await manager.configureEmail();
    
    // Save configuration
    fs.writeFileSync(
      path.join(__dirname, 'resend-config.json'),
      JSON.stringify(config, null, 2)
    );
    
    log('\n✅ Resend email configuration complete', 'green');
    return config;
  } catch (error) {
    log(`\n❌ Resend configuration failed: ${error.message}`, 'red');
    return null;
  }
}

async function setupSupabase(resendConfig) {
  logStep(4, 'Configuring Supabase Email Settings');
  
  try {
    const manager = new SupabaseEmailManager(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.RESEND_API_KEY
    );
    
    await manager.configureEmails();
    log('\n✅ Supabase email configuration complete', 'green');
    return true;
  } catch (error) {
    log(`\n❌ Supabase configuration failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateReport(results) {
  logSection('📊 Setup Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    domain: 'axis6.app',
    results: results,
    nextSteps: []
  };

  // Generate next steps based on results
  if (!results.dns) {
    report.nextSteps.push('Fix Cloudflare DNS configuration');
  }
  
  if (!results.vercel) {
    report.nextSteps.push('Fix Vercel domain configuration');
  }
  
  if (!results.resend || results.resend.status !== 'verified') {
    report.nextSteps.push('Verify Resend domain (wait for DNS propagation)');
  }
  
  if (!results.supabase) {
    report.nextSteps.push('Complete Supabase email configuration in dashboard');
  }

  // Save report
  const reportPath = path.join(__dirname, 'setup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('Configuration Status:');
  console.log(`  DNS (Cloudflare):    ${results.dns ? '✅' : '❌'}`);
  console.log(`  Domain (Vercel):     ${results.vercel ? '✅' : '❌'}`);
  console.log(`  Email (Resend):      ${results.resend ? '✅' : '❌'}`);
  console.log(`  Auth (Supabase):     ${results.supabase ? '✅' : '❌'}`);
  
  if (report.nextSteps.length > 0) {
    console.log('\n📋 Next Steps:');
    report.nextSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
  }
  
  console.log(`\n💾 Full report saved to: ${reportPath}`);
}

async function main() {
  logSection('🚀 AXIS6 Complete Setup Automation');
  
  console.log('This script will automatically configure:');
  console.log('  • Cloudflare DNS records');
  console.log('  • Vercel domain and redirects');
  console.log('  • Resend email domain');
  console.log('  • Supabase email templates and SMTP');
  
  // Check environment
  const envReady = await checkEnvironment();
  if (!envReady) {
    log('\n⚠️  Please add missing environment variables to .env.local and try again', 'yellow');
    process.exit(1);
  }

  const results = {
    dns: false,
    vercel: false,
    resend: null,
    supabase: false
  };

  // Run setup steps
  try {
    // Step 1: DNS
    results.dns = await setupDNS();
    
    // Step 2: Vercel
    results.vercel = await setupVercel();
    
    // Step 3: Resend
    const resendConfig = await setupResend();
    results.resend = resendConfig;
    
    // Step 4: Supabase
    if (resendConfig) {
      results.supabase = await setupSupabase(resendConfig);
    }
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
  }

  // Generate report
  await generateReport(results);
  
  // Final message
  if (Object.values(results).every(r => r)) {
    logSection('🎉 Setup Complete!');
    log('All services have been configured successfully.', 'green');
    console.log('\nYour domain is now configured with:');
    console.log('  • DNS records pointing to Vercel');
    console.log('  • WWW redirect to apex domain');
    console.log('  • Email domain ready for sending');
    console.log('  • Auth email templates configured');
  } else {
    logSection('⚠️  Setup Partially Complete');
    log('Some configurations require manual intervention.', 'yellow');
    console.log('Please check the report and complete the next steps.');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main };