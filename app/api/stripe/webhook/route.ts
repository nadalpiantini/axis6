import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase with service role for webhook handling
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Log webhook event
  await supabaseAdmin
    .from('axis6_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      api_version: event.api_version,
      data: event.data,
      processed: false,
    });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabaseAdmin
      .from('axis6_webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Log error
    await supabaseAdmin
      .from('axis6_webhook_events')
      .update({ 
        processed: false,
        error: error.message 
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  // Get the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update or create subscription record
  await supabaseAdmin
    .from('axis6_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      tier: 'premium',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    // Try to find user by customer ID
    const { data: existingSub } = await supabaseAdmin
      .from('axis6_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();
    
    if (!existingSub) {
      console.error('Cannot find user for subscription:', subscription.id);
      return;
    }
  }

  // Determine tier based on status
  const tier = ['active', 'trialing'].includes(subscription.status) ? 'premium' : 'free';

  // Update subscription record
  await supabaseAdmin
    .from('axis6_subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      tier: tier,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
    .eq('stripe_customer_id', subscription.customer as string);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Update subscription to free tier
  await supabaseAdmin
    .from('axis6_subscriptions')
    .update({
      status: 'canceled',
      tier: 'free',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: subscription } = await supabaseAdmin
    .from('axis6_subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!subscription) {
    console.error('Cannot find subscription for invoice:', invoice.id);
    return;
  }

  // Record payment in billing history
  await supabaseAdmin
    .from('axis6_billing_history')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_charge_id: invoice.charge as string,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      description: invoice.description,
      billing_reason: invoice.billing_reason,
      paid_at: new Date().toISOString(),
    });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: subscription } = await supabaseAdmin
    .from('axis6_subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!subscription) return;

  // Record failed payment
  await supabaseAdmin
    .from('axis6_billing_history')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      amount_paid: 0,
      currency: invoice.currency,
      status: 'failed',
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      description: invoice.description,
      billing_reason: invoice.billing_reason,
    });

  // Could send an email notification here
}