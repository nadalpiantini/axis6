'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStripe } from '@/lib/hooks/useStripe';
import { format } from 'date-fns';

export default function SubscriptionStatus() {
  const router = useRouter();
  const { subscriptionStatus, openBillingPortal, isLoading } = useStripe();
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptionStatus?.subscription?.current_period_end) {
      const date = new Date(subscriptionStatus.subscription.current_period_end);
      setNextBillingDate(format(date, 'MMMM d, yyyy'));
    }
  }, [subscriptionStatus]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscriptionStatus?.is_premium || false;
  const subscription = subscriptionStatus?.subscription;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
            <CardTitle>Subscription Status</CardTitle>
          </div>
          <Badge variant={isPremium ? 'default' : 'secondary'}>
            {isPremium ? 'Premium' : 'Free'}
          </Badge>
        </div>
        <CardDescription>
          Manage your AXIS6 subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">AXIS6 Premium</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price</span>
                <span className="font-medium">$6.00/month</span>
              </div>
              {nextBillingDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Next billing date</span>
                  <span className="font-medium">{nextBillingDate}</span>
                </div>
              )}
              {subscription?.cancel_at_period_end && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Subscription will end on {nextBillingDate}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Premium Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Unlimited history</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Goal tracking</li>
                <li>✓ Data export</li>
                <li>✓ Psychological profiling</li>
                <li>✓ Activity suggestions</li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            <Button
              onClick={openBillingPortal}
              variant="secondary"
              className="w-full"
              disabled={isLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                You're currently on the Free plan with basic features.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Upgrade to Premium for just $6/month
                </p>
                <p className="text-xs text-blue-700">
                  Unlock advanced analytics, unlimited history, and personalized insights
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Free Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Daily check-ins (all 6 dimensions)</li>
                <li>✓ Basic streak tracking</li>
                <li>✓ Personal dashboard</li>
                <li>✓ 30-day history</li>
                <li>✓ Mobile responsive design</li>
              </ul>
            </div>

            <Button
              onClick={() => router.push('/pricing')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}