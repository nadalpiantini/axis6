import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Pricing configuration for AXIS6 plans
export const AXIS6_PRICING = {
  FREE: {
    name: 'Free',
    description: 'Basic tracking for all 6 dimensions',
    features: [
      'Daily check-ins across all 6 dimensions',
      'Basic streak tracking',
      'Personal dashboard',
      'Mobile responsive design'
    ],
    price: 0,
    stripePriceId: null,
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Advanced analytics and insights',
    features: [
      'All Free features',
      'Advanced analytics and insights',
      'Goal setting and tracking',
      'Data export capabilities',
      'Priority support',
      'Custom categories (coming soon)'
    ],
    price: 9.99,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID,
  }
} as const;

export type PricingTier = keyof typeof AXIS6_PRICING;