# AXIS6 Stripe Integration Deployment Guide

## 🚀 Overview
This guide walks you through deploying the AXIS6 Stripe integration with the $6/month Premium subscription tier.

## 📋 Pre-Deployment Checklist

### Local Testing
- [ ] Run `npm run dev` and test locally
- [ ] Test pricing page at `/pricing`
- [ ] Verify environment variables are set
- [ ] Run `node scripts/test-stripe-integration.js`

### Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Verify your Stripe account (required for live payments)
- [ ] Enable test mode for initial testing

## 🔧 Step 1: Database Migration

### Deploy the subscription tables to Supabase:

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `supabase/migrations/009_stripe_subscriptions.sql`
3. Execute the migration
4. Verify tables created:
   - `axis6_subscriptions`
   - `axis6_billing_history`
   - `axis6_feature_access`
   - `axis6_webhook_events`

## 💳 Step 2: Stripe Product Setup

### Create products in Stripe (TEST mode first):

```bash
# Set up your .env.local with test keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Run the setup script
node scripts/setup-stripe-plans.js
```

This will:
- Create "AXIS6 Premium" product
- Set $6/month pricing
- Output the IDs you need for environment variables

### Save the output IDs to your .env.local:
```env
STRIPE_PREMIUM_PRODUCT_ID=prod_xxx
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxx
```

## 🔗 Step 3: Webhook Configuration

### Configure webhook endpoint in Stripe Dashboard:

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL:
   - Test: `https://axis6.app/api/stripe/webhook`
   - Or use ngrok for local testing: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

## 🌐 Step 4: Environment Variables

### Add all Stripe variables to Vercel:

```bash
# Go to Vercel Dashboard > Settings > Environment Variables
# Add these variables for production:

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # Use live key for production
STRIPE_SECRET_KEY=sk_live_xxx                    # Use live key for production
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PREMIUM_PRODUCT_ID=prod_xxx
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_SUCCESS_URL=https://axis6.app/dashboard?success=true
NEXT_PUBLIC_STRIPE_CANCEL_URL=https://axis6.app/pricing?canceled=true
```

## 🧪 Step 5: Testing

### Test the complete flow:

1. **Test Checkout:**
   ```
   - Go to /pricing
   - Click "Upgrade to Premium"
   - Use test card: 4242 4242 4242 4242
   - Any future date for expiry
   - Any 3 digits for CVC
   - Any ZIP code
   ```

2. **Verify Subscription:**
   ```
   - Check /dashboard for premium status
   - Check Supabase axis6_subscriptions table
   - Verify webhook events in axis6_webhook_events table
   ```

3. **Test Billing Portal:**
   ```
   - Go to /dashboard/settings
   - Click "Manage Billing"
   - Test cancellation/reactivation
   ```

## 🚀 Step 6: Go Live

### Switch to production mode:

1. **Create Live Products:**
   ```bash
   # Update .env.local with live keys
   STRIPE_SECRET_KEY=sk_live_xxx
   
   # Run setup script again for live mode
   node scripts/setup-stripe-plans.js
   ```

2. **Update Vercel Environment:**
   - Replace test keys with live keys
   - Redeploy application

3. **Update Webhook:**
   - Create new webhook endpoint for live mode
   - Update STRIPE_WEBHOOK_SECRET with live webhook secret

4. **Enable Stripe Features:**
   - Configure customer portal: https://dashboard.stripe.com/settings/billing/portal
   - Set up tax settings if needed
   - Configure email receipts

## 📊 Step 7: Monitoring

### Set up monitoring:

1. **Stripe Dashboard:**
   - Monitor payments at https://dashboard.stripe.com/payments
   - Check subscriptions at https://dashboard.stripe.com/subscriptions
   - Review webhook logs at https://dashboard.stripe.com/webhooks

2. **Supabase Monitoring:**
   ```sql
   -- Check active subscriptions
   SELECT COUNT(*) FROM axis6_subscriptions WHERE tier = 'premium' AND status = 'active';
   
   -- Recent webhook events
   SELECT * FROM axis6_webhook_events ORDER BY created_at DESC LIMIT 10;
   
   -- Billing history
   SELECT * FROM axis6_billing_history ORDER BY created_at DESC LIMIT 10;
   ```

3. **Error Tracking:**
   - Check Vercel logs for API errors
   - Monitor webhook failures in Stripe Dashboard

## 🎯 Feature Differentiation

### Current Premium Features ($6/month):
- ✅ Unlimited history (vs 30 days)
- ✅ Advanced analytics & insights
- ✅ Goal setting & tracking
- ✅ Data export (CSV/PDF)
- ✅ Psychological profiling
- ✅ Activity suggestions
- ✅ Priority support
- ✅ Early access to new features

### Feature Gating Implementation:
```tsx
// Example usage in components
import FeatureGate from '@/components/subscription/FeatureGate';
import { FEATURES } from '@/lib/stripe/subscription';

// Gate a premium feature
<FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
  <AdvancedAnalytics />
</FeatureGate>

// Check feature access in code
const hasAccess = await hasFeatureAccess(FEATURES.DATA_EXPORT);
```

## 🐛 Troubleshooting

### Common Issues:

1. **Webhook not receiving events:**
   - Check webhook URL is correct
   - Verify STRIPE_WEBHOOK_SECRET matches
   - Check Vercel function logs

2. **Subscription not updating:**
   - Check webhook events in Stripe Dashboard
   - Verify database RLS policies
   - Check service role key is set

3. **Checkout fails:**
   - Verify price ID exists
   - Check Stripe keys are correct
   - Ensure user is authenticated

## 📝 Post-Launch Tasks

- [ ] Monitor first 24 hours closely
- [ ] Set up Stripe email notifications
- [ ] Configure tax settings if needed
- [ ] Create customer support documentation
- [ ] Set up refund policy
- [ ] Monitor conversion rates
- [ ] A/B test pricing page

## 🔒 Security Notes

- Never commit Stripe keys to git
- Use environment variables for all sensitive data
- Webhook endpoint verifies signatures
- Database uses RLS for data protection
- Service role key only used in webhook handler

## 📞 Support

For issues:
1. Check Stripe logs: https://dashboard.stripe.com/logs
2. Check Vercel logs: https://vercel.com/your-team/axis6/functions
3. Review Supabase logs: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/logs

## 🎉 Launch Checklist

- [ ] Database migration deployed
- [ ] Stripe products created (live mode)
- [ ] Webhook configured and tested
- [ ] Environment variables set in Vercel
- [ ] Pricing page tested
- [ ] Checkout flow tested
- [ ] Subscription management tested
- [ ] Feature gating verified
- [ ] Monitoring set up
- [ ] Documentation complete

---

**Ready to launch! 🚀**

Remember: Start with test mode, verify everything works, then switch to live mode.