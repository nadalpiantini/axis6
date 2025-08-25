import Stripe from 'stripe';

// Check if Stripe is properly configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here' &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_')
);

// Export flag for checking Stripe availability
export const stripeEnabled = isStripeConfigured;

// Only initialize Stripe if properly configured
export const stripe = isStripeConfigured 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null as any; // Type assertion for build compatibility

// Helper to check if Stripe is available
export function requireStripe(): Stripe {
  if (!stripe || !stripeEnabled) {
    throw new Error('Stripe is not configured. Please add valid Stripe API keys to enable billing features.');
  }
  return stripe;
}

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