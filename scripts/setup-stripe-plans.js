#!/usr/bin/env node

/**
 * AXIS6 Stripe Plans Setup Script
 * 
 * This script creates the AXIS6 Premium subscription plan in Stripe
 * Make sure to set your STRIPE_SECRET_KEY environment variable before running
 * 
 * Usage: node scripts/setup-stripe-plans.js
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripePlans() {
  try {
    console.log('🚀 Setting up AXIS6 Stripe plans...');

    // Check if we can connect to Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables');
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('Invalid STRIPE_SECRET_KEY format');
    }

    // Create AXIS6 Premium Product
    console.log('📦 Creating AXIS6 Premium product...');
    const product = await stripe.products.create({
      name: 'AXIS6 Premium',
      description: 'Unlock your full wellness potential with advanced tracking, insights, and personalized guidance across all 6 life dimensions',
      images: [], // Add product images URLs here when available
      metadata: {
        app: 'axis6',
        tier: 'premium',
        version: '2.0',
      },
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create Single Flat Price - $6/month
    console.log('💰 Creating flat monthly pricing...');
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 600, // $6.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        billing_period: 'monthly',
        plan_name: 'Premium',
      },
    });

    console.log(`✅ Monthly price created: ${monthlyPrice.id}`);

    // Display configuration info
    console.log('\n🎉 Stripe setup complete!');
    console.log('\n📋 Add these to your .env.local file:');
    console.log(`STRIPE_PREMIUM_PRODUCT_ID=${product.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=${monthlyPrice.id}`);

    console.log('\n🔗 Stripe Dashboard Links:');
    console.log(`Product: https://dashboard.stripe.com/products/${product.id}`);
    console.log(`Monthly Price: https://dashboard.stripe.com/prices/${monthlyPrice.id}`);

    console.log('\n📊 Plan Summary:');
    console.log('• Premium: $6/month flat rate');
    console.log('• Features:');
    console.log('  - Unlimited history (vs 30 days)');
    console.log('  - Advanced analytics & insights');
    console.log('  - Goal setting & tracking');
    console.log('  - Data export (CSV/PDF)');
    console.log('  - Psychological profiling');
    console.log('  - Activity suggestions');
    console.log('  - Priority support');
    console.log('  - Early access to new features');

    return {
      product,
      monthlyPrice,
    };

  } catch (error) {
    console.error('❌ Error setting up Stripe plans:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔑 Check your STRIPE_SECRET_KEY in .env.local');
    }
    
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStripePlans();
}

module.exports = { setupStripePlans };