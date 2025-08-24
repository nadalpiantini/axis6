import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase
    const supabase = await createClient();
    const cookieStore = cookies();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('stripe_customer_id, stripe_subscription_id, is_premium')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({
        status: 'free',
        is_premium: false,
        subscription: null,
      });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    return NextResponse.json({
      status: subscription.status,
      is_premium: subscription.status === 'active',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        current_period_start: subscription.current_period_start,
        cancel_at_period_end: subscription.cancel_at_period_end,
        items: subscription.items.data.map(item => ({
          price_id: item.price.id,
          product_id: item.price.product,
          amount: item.price.unit_amount,
          currency: item.price.currency,
        })),
      },
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}