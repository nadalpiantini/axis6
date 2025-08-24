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
      description: 'Advanced wellness tracking with analytics and insights across all 6 life dimensions',
      images: [], // Add product images URLs here when available
      metadata: {
        app: 'axis6',
        tier: 'premium',
        version: '1.0',
      },
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create Monthly Price
    console.log('💰 Creating monthly pricing...');
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        billing_period: 'monthly',
        plan_name: 'Premium Monthly',
      },
    });

    console.log(`✅ Monthly price created: ${monthlyPrice.id}`);

    // Create Annual Price (with 2 months free)
    console.log('💰 Creating annual pricing...');
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9999, // $99.99 in cents (2 months free)
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        billing_period: 'annual',
        plan_name: 'Premium Annual',
        discount: '2 months free',
      },
    });

    console.log(`✅ Annual price created: ${annualPrice.id}`);

    // Display configuration info
    console.log('\n🎉 Stripe setup complete!');
    console.log('\n📋 Add these to your .env.local file:');
    console.log(`STRIPE_PREMIUM_PRODUCT_ID=${product.id}`);
    console.log(`STRIPE_PREMIUM_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_PREMIUM_ANNUAL_PRICE_ID=${annualPrice.id}`);

    console.log('\n🔗 Stripe Dashboard Links:');
    console.log(`Product: https://dashboard.stripe.com/products/${product.id}`);
    console.log(`Monthly Price: https://dashboard.stripe.com/prices/${monthlyPrice.id}`);
    console.log(`Annual Price: https://dashboard.stripe.com/prices/${annualPrice.id}`);

    console.log('\n📊 Plan Summary:');
    console.log('• Premium Monthly: $9.99/month');
    console.log('• Premium Annual: $99.99/year (save $20)');
    console.log('• Features: Advanced analytics, goal tracking, data export, priority support');

    return {
      product,
      monthlyPrice,
      annualPrice,
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