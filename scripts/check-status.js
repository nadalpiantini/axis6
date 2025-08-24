#!/usr/bin/env node

/**
 * AXIS6 Configuration Status Checker
 * Verifies the current status of all configurations
 */

require('dotenv').config({ path: '.env.local' });
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDNS() {
  console.log('\n📍 DNS Configuration Status:');
  console.log('-'.repeat(40));
  
  try {
    // Check A record
    const aRecords = await dns.resolve4('axis6.app');
    if (aRecords.includes('76.76.21.21')) {
      log('  ✅ A record configured correctly', 'green');
    } else {
      log(`  ⚠️ A record points to: ${aRecords.join(', ')}`, 'yellow');
    }
  } catch (error) {
    log('  ❌ A record not found', 'red');
  }
  
  try {
    // Check CNAME for www
    const cname = await dns.resolveCname('www.axis6.app');
    if (cname[0] === 'axis6.app' || cname[0] === 'axis6.app.') {
      log('  ✅ CNAME configured correctly', 'green');
    } else {
      log(`  ⚠️ CNAME points to: ${cname[0]}`, 'yellow');
    }
  } catch (error) {
    log('  ❌ CNAME not found', 'red');
  }
  
  try {
    // Check TXT records
    const txtRecords = await dns.resolveTxt('axis6.app');
    const flatRecords = txtRecords.map(r => r.join(''));
    const hasSPF = flatRecords.some(r => r.includes('v=spf1'));
    
    if (hasSPF) {
      log('  ✅ SPF record found', 'green');
    } else {
      log('  ⚠️ SPF record not found', 'yellow');
    }
  } catch (error) {
    log('  ⚠️ TXT records not found', 'yellow');
  }
}

async function checkVercel() {
  console.log('\n🚀 Vercel Configuration Status:');
  console.log('-'.repeat(40));
  
  if (!process.env.VERCEL_TOKEN) {
    log('  ❌ VERCEL_TOKEN not configured', 'red');
    return;
  }
  
  try {
    const response = await fetch('https://api.vercel.com/v9/projects/axis6', {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
      }
    });
    
    if (response.ok) {
      const project = await response.json();
      log(`  ✅ Project found: ${project.name}`, 'green');
      
      // Check domains
      const domainsResponse = await fetch(`https://api.vercel.com/v9/projects/${project.id}/domains`, {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
        }
      });
      
      if (domainsResponse.ok) {
        const { domains } = await domainsResponse.json();
        const hasDomain = domains.some(d => d.name === 'axis6.app');
        const hasWWW = domains.some(d => d.name === 'www.axis6.app');
        
        if (hasDomain) {
          log('  ✅ Domain axis6.app configured', 'green');
        } else {
          log('  ❌ Domain axis6.app not configured', 'red');
        }
        
        if (hasWWW) {
          log('  ✅ WWW subdomain configured', 'green');
        } else {
          log('  ⚠️ WWW subdomain not configured', 'yellow');
        }
      }
    } else {
      log('  ❌ Project not found on Vercel', 'red');
    }
  } catch (error) {
    log(`  ❌ Error checking Vercel: ${error.message}`, 'red');
  }
}

async function checkResend() {
  console.log('\n📧 Resend Configuration Status:');
  console.log('-'.repeat(40));
  
  if (!process.env.RESEND_API_KEY) {
    log('  ❌ RESEND_API_KEY not configured', 'red');
    return;
  }
  
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    });
    
    if (response.ok) {
      const { data } = await response.json();
      const domain = data.find(d => d.name === 'axis6.app');
      
      if (domain) {
        log(`  ✅ Domain found: ${domain.name}`, 'green');
        
        if (domain.status === 'verified') {
          log('  ✅ Domain verified', 'green');
        } else {
          log(`  ⚠️ Domain status: ${domain.status}`, 'yellow');
        }
      } else {
        log('  ❌ Domain axis6.app not found', 'red');
      }
    } else {
      log('  ❌ Failed to fetch domains from Resend', 'red');
    }
  } catch (error) {
    log(`  ❌ Error checking Resend: ${error.message}`, 'red');
  }
}

async function checkSupabase() {
  console.log('\n🗄️ Supabase Configuration Status:');
  console.log('-'.repeat(40));
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    log('  ❌ NEXT_PUBLIC_SUPABASE_URL not configured', 'red');
    return;
  }
  
  log('  ✅ Supabase URL configured', 'green');
  
  // Check for email templates
  const templatesDir = path.join(process.cwd(), 'supabase', 'email-templates');
  if (fs.existsSync(templatesDir)) {
    const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
    if (templates.length > 0) {
      log(`  ✅ ${templates.length} email templates found`, 'green');
    } else {
      log('  ⚠️ No email templates found', 'yellow');
    }
  } else {
    log('  ⚠️ Email templates directory not found', 'yellow');
  }
}

async function checkEnvironment() {
  console.log('\n🔐 Environment Variables:');
  console.log('-'.repeat(40));
  
  const required = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'VERCEL_TOKEN',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allPresent = true;
  
  required.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✅ ${varName}`, 'green');
    } else {
      log(`  ❌ ${varName}`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function checkWebsite() {
  console.log('\n🌐 Website Accessibility:');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch('https://axis6.app', {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    if (response.ok || response.status === 308) {
      log('  ✅ axis6.app is accessible', 'green');
    } else {
      log(`  ⚠️ axis6.app returned status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log('  ❌ axis6.app is not accessible', 'red');
  }
  
  try {
    const response = await fetch('https://www.axis6.app', {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    if (response.status === 301 || response.status === 308) {
      log('  ✅ www.axis6.app redirects correctly', 'green');
    } else {
      log(`  ⚠️ www.axis6.app status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log('  ⚠️ www.axis6.app is not accessible', 'yellow');
  }
}

async function main() {
  console.log('\n' + '='.repeat(50));
  log('   AXIS6 Configuration Status Check', 'bright');
  console.log('='.repeat(50));
  
  // Check environment variables
  const envReady = await checkEnvironment();
  
  if (!envReady) {
    console.log('\n⚠️  Some environment variables are missing.');
    console.log('Copy .env.automation.example to .env.local and fill in the values.');
  }
  
  // Run all checks
  await checkDNS();
  await checkVercel();
  await checkResend();
  await checkSupabase();
  await checkWebsite();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  log('   Summary', 'bright');
  console.log('='.repeat(50));
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm run setup:all');
  console.log('2. Wait for DNS propagation (1-24 hours)');
  console.log('3. Configure Supabase email templates manually');
  console.log('4. Test email sending with a new user registration');
  
  console.log('\n💡 Tip: Run this script again after DNS propagation to verify everything is working.');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };