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
    description: 'Start your wellness journey',
    features: [
      'Daily check-ins (all 6 dimensions)',
      'Basic streak tracking',
      'Personal dashboard',
      '30-day history',
      'Mobile responsive design'
    ],
    price: 0,
    stripePriceId: null,
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Unlock your full potential',
    features: [
      'Everything in Free',
      'Unlimited history',
      'Advanced analytics & insights',
      'Goal setting & tracking',
      'Data export (CSV/PDF)',
      'Psychological profiling',
      'Activity suggestions',
      'Priority support',
      'Early access to new features'
    ],
    price: 6,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID,
  }
} as const;

export type PricingTier = keyof typeof AXIS6_PRICING;