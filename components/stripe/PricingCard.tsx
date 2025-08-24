'use client';

import { useState } from 'react';
import { AXIS6_PRICING, type PricingTier } from '@/lib/stripe';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';

interface PricingCardProps {
  tier: PricingTier;
  priceId?: string;
  isCurrentPlan?: boolean;
  onUpgrade?: (priceId: string) => Promise<void>;
}

export default function PricingCard({ 
  tier, 
  priceId, 
  isCurrentPlan = false, 
  onUpgrade 
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const plan = AXIS6_PRICING[tier];

  const handleUpgrade = async () => {
    if (!priceId || !onUpgrade || isLoading) return;

    setIsLoading(true);
    try {
      await onUpgrade(priceId);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`relative ${tier === 'PREMIUM' ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
      {tier === 'PREMIUM' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-navy-800">
          {plan.name}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {plan.description}
        </CardDescription>
        
        <div className="mt-4">
          <span className="text-4xl font-bold text-navy-800">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-500 ml-2">/month</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <Button className="w-full" disabled>
            Current Plan
          </Button>
        ) : tier === 'FREE' ? (
          <Button className="w-full" variant="secondary" disabled>
            Always Free
          </Button>
        ) : (
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleUpgrade}
            disabled={isLoading || !priceId}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processing...' : 'Upgrade to Premium'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}