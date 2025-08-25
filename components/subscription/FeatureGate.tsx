'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStripe } from '@/lib/hooks/useStripe';
import { FeatureKey } from '@/lib/stripe/subscription';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  silentFallback?: boolean;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  silentFallback = false,
}: FeatureGateProps) {
  const router = useRouter();
  const { subscriptionStatus } = useStripe();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (subscriptionStatus) {
      const features = subscriptionStatus.features || [];
      setHasAccess(features.includes(feature));
    }
  }, [subscriptionStatus, feature]);

  // Loading state
  if (hasAccess === null) {
    return <div className="animate-pulse bg-gray-200 rounded h-32" />;
  }

  // Has access - show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - show fallback
  if (silentFallback) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  // Default upgrade prompt
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Premium Feature</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          This feature is available with AXIS6 Premium
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Unlock advanced analytics, unlimited history, goal tracking, and more for just $6/month.
        </p>
        <Button
          onClick={() => router.push('/pricing')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to check feature access
 */
export function useFeatureAccess(feature: FeatureKey): boolean {
  const { subscriptionStatus } = useStripe();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (subscriptionStatus) {
      const features = subscriptionStatus.features || [];
      setHasAccess(features.includes(feature));
    }
  }, [subscriptionStatus, feature]);

  return hasAccess;
}