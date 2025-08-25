import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('axis6_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching subscription:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    // If no subscription found, create a free tier entry
    if (!subscription) {
      const { data: newSub, error: insertError } = await supabase
        .from('axis6_subscriptions')
        .insert({
          user_id: user.id,
          status: 'active',
          tier: 'free',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating free subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'active',
        is_premium: false,
        subscription: newSub,
      });
    }

    // Check if subscription is active and premium
    const isPremium = subscription.tier === 'premium' && 
                     ['active', 'trialing'].includes(subscription.status);

    // Get billing history if premium
    let billingHistory = [];
    if (isPremium) {
      const { data: history } = await supabase
        .from('axis6_billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      billingHistory = history || [];
    }

    // Get feature access
    const { data: features } = await supabase
      .from('axis6_feature_access')
      .select('*')
      .eq('is_active', true);

    // Determine which features user has access to
    const userFeatures = features?.filter(feature => {
      if (feature.tier_required === 'free') return true;
      if (feature.tier_required === 'premium' && isPremium) return true;
      return false;
    }) || [];

    return NextResponse.json({
      status: subscription.status,
      is_premium: isPremium,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        current_period_start: subscription.current_period_start,
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_subscription_id: subscription.stripe_subscription_id,
      },
      billing_history: billingHistory,
      features: userFeatures.map(f => f.feature_key),
      all_features: features?.map(f => ({
        key: f.feature_key,
        name: f.feature_name,
        description: f.description,
        tier_required: f.tier_required,
        has_access: userFeatures.some(uf => uf.feature_key === f.feature_key),
      })) || [],
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}