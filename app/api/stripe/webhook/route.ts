import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createClient();

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update user profile with subscription info
        const { error } = await supabase
          .from('axis6_profiles')
          .update({
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            is_premium: subscription.status === 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer);

        if (error) {
          console.error('Error updating user subscription:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Remove premium status
        const { error } = await supabase
          .from('axis6_profiles')
          .update({
            is_premium: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer);

        if (error) {
          console.error('Error removing premium status:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Mark subscription as past due or cancel
        const { error } = await supabase
          .from('axis6_profiles')
          .update({
            is_premium: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', invoice.customer);

        if (error) {
          console.error('Error handling payment failure:', error);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Ensure premium status is active
        const { error } = await supabase
          .from('axis6_profiles')
          .update({
            is_premium: true,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', invoice.customer);

        if (error) {
          console.error('Error confirming payment success:', error);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}