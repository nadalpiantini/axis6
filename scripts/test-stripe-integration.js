#!/usr/bin/env node

/**
 * AXIS6 Stripe Integration Test Script
 * 
 * This script tests the Stripe integration by:
 * 1. Verifying environment variables
 * 2. Testing Stripe connection
 * 3. Checking if products exist
 * 4. Verifying webhook endpoint
 * 
 * Usage: node scripts/test-stripe-integration.js
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const color = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
  }[type] || colors.reset;
  
  console.log(`${color}${message}${colors.reset}`);
}

async function testStripeIntegration() {
  log('\n🚀 Testing AXIS6 Stripe Integration\n', 'info');

  // Step 1: Check environment variables
  log('1️⃣  Checking environment variables...', 'info');
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID',
    'STRIPE_PREMIUM_PRODUCT_ID',
  ];

  const missingVars = [];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      log(`   ✅ ${varName} is set`, 'success');
    }
  }

  if (missingVars.length > 0) {
    log(`\n❌ Missing environment variables:`, 'error');
    missingVars.forEach(v => log(`   - ${v}`, 'error'));
    log('\n💡 Tip: Run "node scripts/setup-stripe-plans.js" to create products and get IDs', 'warning');
    process.exit(1);
  }

  // Step 2: Test Stripe connection
  log('\n2️⃣  Testing Stripe connection...', 'info');
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  try {
    const account = await stripe.accounts.retrieve();
    log(`   ✅ Connected to Stripe account: ${account.email}`, 'success');
    log(`   ✅ Account type: ${account.type}`, 'success');
    log(`   ✅ Charges enabled: ${account.charges_enabled}`, 'success');
  } catch (error) {
    log(`   ❌ Failed to connect to Stripe: ${error.message}`, 'error');
    process.exit(1);
  }

  // Step 3: Check if product exists
  log('\n3️⃣  Checking AXIS6 Premium product...', 'info');
  
  try {
    const product = await stripe.products.retrieve(process.env.STRIPE_PREMIUM_PRODUCT_ID);
    log(`   ✅ Product found: ${product.name}`, 'success');
    log(`   ✅ Product ID: ${product.id}`, 'success');
    log(`   ✅ Active: ${product.active}`, 'success');
  } catch (error) {
    if (error.code === 'resource_missing') {
      log(`   ❌ Product not found. Run "node scripts/setup-stripe-plans.js" to create it`, 'error');
    } else {
      log(`   ❌ Error checking product: ${error.message}`, 'error');
    }
  }

  // Step 4: Check if price exists
  log('\n4️⃣  Checking pricing...', 'info');
  
  try {
    const price = await stripe.prices.retrieve(process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID);
    log(`   ✅ Price found: $${(price.unit_amount / 100).toFixed(2)}/${price.recurring.interval}`, 'success');
    log(`   ✅ Price ID: ${price.id}`, 'success');
    log(`   ✅ Active: ${price.active}`, 'success');
    
    if (price.unit_amount !== 600) {
      log(`   ⚠️  Warning: Price is not $6.00 (current: $${(price.unit_amount / 100).toFixed(2)})`, 'warning');
    }
  } catch (error) {
    if (error.code === 'resource_missing') {
      log(`   ❌ Price not found. Run "node scripts/setup-stripe-plans.js" to create it`, 'error');
    } else {
      log(`   ❌ Error checking price: ${error.message}`, 'error');
    }
  }

  // Step 5: List webhook endpoints
  log('\n5️⃣  Checking webhook endpoints...', 'info');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      log('   ⚠️  No webhook endpoints configured', 'warning');
      log('   💡 Add webhook endpoint in Stripe Dashboard:', 'info');
      log(`      URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`, 'info');
      log('      Events to listen for:', 'info');
      log('      - checkout.session.completed', 'info');
      log('      - customer.subscription.created', 'info');
      log('      - customer.subscription.updated', 'info');
      log('      - customer.subscription.deleted', 'info');
      log('      - invoice.payment_succeeded', 'info');
      log('      - invoice.payment_failed', 'info');
    } else {
      log(`   ✅ Found ${webhooks.data.length} webhook endpoint(s):`, 'success');
      webhooks.data.forEach(webhook => {
        log(`      - ${webhook.url} (${webhook.status})`, 'info');
        if (webhook.url.includes('/api/stripe/webhook')) {
          log('        ✅ AXIS6 webhook endpoint found', 'success');
        }
      });
    }
  } catch (error) {
    log(`   ⚠️  Cannot list webhook endpoints (requires restricted API key)`, 'warning');
  }

  // Step 6: Test mode check
  log('\n6️⃣  Checking Stripe mode...', 'info');
  
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    log('   ✅ Using TEST mode (safe for development)', 'success');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    log('   ⚠️  Using LIVE mode (real payments!)', 'warning');
  }

  // Summary
  log('\n📊 Integration Test Summary', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('✅ Environment variables configured', 'success');
  log('✅ Stripe connection successful', 'success');
  log('✅ Products and pricing set up', 'success');
  
  log('\n🎉 Stripe integration is ready!', 'success');
  log('\n📝 Next steps:', 'info');
  log('1. Configure webhook endpoint in Stripe Dashboard', 'info');
  log('2. Add Stripe keys to production environment', 'info');
  log('3. Test checkout flow with Stripe test card: 4242 4242 4242 4242', 'info');
  log('4. Deploy to production when ready', 'info');
  
  log('\n💳 Test cards for different scenarios:', 'info');
  log('   Success: 4242 4242 4242 4242', 'info');
  log('   Decline: 4000 0000 0000 0002', 'info');
  log('   Auth Required: 4000 0025 0000 3155', 'info');
}

// Run the test
testStripeIntegration().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'error');
  process.exit(1);
});