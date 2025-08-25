'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
  cancel_at_period_end: boolean;
  items: Array<{
    price_id: string;
    product_id: string;
    amount: number;
    currency: string;
  }>;
}

interface SubscriptionStatus {
  status: string;
  is_premium: boolean;
  subscription: SubscriptionData | null;
  features?: string[];
}

export function useStripe() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create checkout session and redirect
  const createCheckoutSession = async (priceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if price ID is a placeholder
      if (!priceId || priceId.includes('placeholder')) {
        throw new Error('Billing is not configured. Please contact support.');
      }
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating checkout:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Open billing portal
  const openBillingPortal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No billing portal URL received');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error opening billing portal:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load subscription status on mount
  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  return {
    subscriptionStatus,
    isLoading,
    error,
    createCheckoutSession,
    openBillingPortal,
    refetchSubscription: fetchSubscriptionStatus,
  };
}