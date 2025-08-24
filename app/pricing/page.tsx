'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe } from '@/lib/hooks/useStripe';
import { AXIS6_PRICING } from '@/lib/stripe';
import PricingCard from '@/components/stripe/PricingCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { subscriptionStatus, createCheckoutSession, isLoading } = useStripe();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  // This would come from environment variables or be fetched from your backend
  const priceIds = {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_monthly_placeholder',
    annual: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID || 'price_annual_placeholder',
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const isPremium = subscriptionStatus?.is_premium || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold text-navy-800 mb-4">
            Choose Your AXIS6 Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Balance your life across all 6 dimensions with the right plan for you
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md">
              <Button
                variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingInterval('monthly')}
                className="px-4 py-2"
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === 'annual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingInterval('annual')}
                className="px-4 py-2"
              >
                Annual
                <Badge variant="secondary" className="ml-2">Save 17%</Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <PricingCard
            tier="FREE"
            isCurrentPlan={!isPremium}
          />
          
          <PricingCard
            tier="PREMIUM"
            priceId={priceIds[billingInterval]}
            isCurrentPlan={isPremium}
            onUpgrade={handleUpgrade}
          />
        </div>

        {/* Feature Comparison */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Feature Comparison</CardTitle>
            <CardDescription className="text-center">
              See what's included in each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4 text-center">Free</th>
                    <th className="py-3 px-4 text-center">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Daily check-ins (all 6 dimensions)</td>
                    <td className="py-3 px-4 text-center">✅</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Basic streak tracking</td>
                    <td className="py-3 px-4 text-center">✅</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Personal dashboard</td>
                    <td className="py-3 px-4 text-center">✅</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Advanced analytics & insights</td>
                    <td className="py-3 px-4 text-center">❌</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Goal setting and tracking</td>
                    <td className="py-3 px-4 text-center">❌</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Data export capabilities</td>
                    <td className="py-3 px-4 text-center">❌</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Priority support</td>
                    <td className="py-3 px-4 text-center">❌</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Custom categories (coming soon)</td>
                    <td className="py-3 px-4 text-center">❌</td>
                    <td className="py-3 px-4 text-center">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change my plan at any time?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time through your account settings.
                Changes will be prorated based on your current billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-600">
                Your data is always yours. If you cancel Premium, you'll still have access to all your
                historical data through the Free plan. Premium features will become unavailable.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all Premium subscriptions. If you're not
                satisfied within the first 30 days, we'll provide a full refund.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">How secure is my data?</h3>
              <p className="text-gray-600">
                Your privacy and security are our top priorities. All data is encrypted in transit and
                at rest, and we never share your personal information with third parties.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}