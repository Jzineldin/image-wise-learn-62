import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logger } from "../_shared/logger.ts";
import { EmailService } from "../_shared/email-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Price ID to credit amount mapping
const PRICE_TO_CREDITS: Record<string, number> = {
  // One-time credit packs
  "price_1S0fYYDSKngmC6wHpSnSJ9cf": 50,   // Small Pack - $5
  "price_1S0fYYDSKngmC6wH5OSPOwNC": 100,  // Medium Pack - $9
  "price_1S0fYZDSKngmC6wHrgIBx0Ih": 250,  // Large Pack - $20
  "price_1S0fYaDSKngmC6wHQQd34mgg": 500,  // Mega Pack - $35

  // Monthly subscriptions (credits granted monthly)
  "price_1S0fYXDSKngmC6wHQuhgXK92": 100,  // Starter - $9.99/month
  "price_1S0fYXDSKngmC6wHFADzfnbx": 300,  // Premium - $19.99/month
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-06-30.basil" });
    
    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logger.error('No stripe-signature header found', null, { operation: 'stripe-webhook' });
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature. If verification fails, fall back to validating via Stripe API
    let event: Stripe.Event | null = null;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.info('Webhook signature verified', { eventType: event.type, operation: 'stripe-webhook' });
    } catch (err) {
      logger.warn?.('Webhook signature verification failed, attempting API validation', err, { operation: 'stripe-webhook' });
      try {
        const parsed = JSON.parse(body);
        const sessionId: string | undefined = parsed?.data?.object?.id;
        const eventType: string | undefined = parsed?.type;
        if (eventType === 'checkout.session.completed' && sessionId) {
          // Retrieve from Stripe to validate authenticity
          const verifiedSession = await stripe.checkout.sessions.retrieve(sessionId);
          if (verifiedSession && verifiedSession.id === sessionId) {
            event = parsed as Stripe.Event;
            logger.info('Webhook event validated via Stripe API', { eventType, sessionId, operation: 'stripe-webhook' });
          }
        }
      } catch (fallbackErr) {
        logger.error('Webhook API validation failed', fallbackErr, { operation: 'stripe-webhook' });
      }

      if (!event) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info('Processing checkout.session.completed', { 
          sessionId: session.id,
          customerEmail: session.customer_email,
          operation: 'stripe-webhook'
        });

        // Get the price ID from line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        if (!lineItems.data || lineItems.data.length === 0) {
          logger.error('No line items found in session', null, { sessionId: session.id, operation: 'stripe-webhook' });
          break;
        }

        const priceId = lineItems.data[0].price?.id;
        if (!priceId) {
          logger.error('No price ID found in line items', null, { sessionId: session.id, operation: 'stripe-webhook' });
          break;
        }

        // Get credit amount for this price
        const creditsToAdd = PRICE_TO_CREDITS[priceId];
        if (!creditsToAdd) {
          logger.error('Unknown price ID', null, { priceId, sessionId: session.id, operation: 'stripe-webhook' });
          break;
        }

        // Get user by email
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (!customerEmail) {
          logger.error('No customer email found', null, { sessionId: session.id, operation: 'stripe-webhook' });
          break;
        }

        // Find user in database
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', customerEmail)
          .single();

        if (userError || !userData) {
          logger.error('User not found', userError, { email: customerEmail, sessionId: session.id, operation: 'stripe-webhook' });
          break;
        }

        const userId = userData.id;

        // Add credits using RPC function
        const { data: creditData, error: creditError } = await supabase.rpc('add_credits', {
          user_uuid: userId,
          credits_to_add: creditsToAdd,
          description_text: `Stripe payment - ${session.mode === 'subscription' ? 'Subscription' : 'One-time purchase'} - ${creditsToAdd} credits`,
          ref_id: session.id,
          ref_type: 'stripe_payment',
          transaction_metadata: {
            stripe_session_id: session.id,
            stripe_customer_id: session.customer,
            price_id: priceId,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status,
            mode: session.mode,
          }
        });

        // Persist Stripe linkage on profile
        try {
          const tier = (priceId === 'price_1S0fYXDSKngmC6wHQuhgXK92') ? 'starter' : (priceId === 'price_1S0fYXDSKngmC6wHFADzfnbx') ? 'premium' : null;
          const updates: Record<string, any> = { stripe_customer_id: session.customer };
          if (session.mode === 'subscription') {
            if (typeof session.subscription === 'string') updates.stripe_subscription_id = session.subscription;
            if (tier) {
              updates.subscription_tier = tier;
              updates.subscription_status = 'active';
            }
          }
          await supabase.from('profiles').update(updates).eq('id', userId);
        } catch (persistErr) {
          logger.error('Failed to persist stripe identifiers to profile', persistErr, { userId, sessionId: session.id, operation: 'stripe-webhook' });
        }

        if (creditError) {
          logger.error('Failed to add credits', creditError, { 
            userId, 
            creditsToAdd, 
            sessionId: session.id,
            operation: 'stripe-webhook'
          });
          break;
        }

        logger.info('Credits added successfully', {
          userId,
          email: customerEmail,
          creditsAdded: creditsToAdd,
          sessionId: session.id,
          priceId,
          operation: 'stripe-webhook'
        });

        // Send payment confirmation email
        try {
          const emailService = new EmailService();
          const amount = session.amount_total ? session.amount_total / 100 : 0;
          await emailService.sendPaymentConfirmationEmail(customerEmail, amount, creditsToAdd);
        } catch (emailError) {
          logger.error('Failed to send payment confirmation email', emailError, { userId, email: customerEmail, operation: 'stripe-webhook' });
        }

        break;
      }

      case "invoice.payment_succeeded": {
        // Handle recurring subscription payments
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('Processing invoice.payment_succeeded', {
          invoiceId: invoice.id,
          customerEmail: invoice.customer_email,
          operation: 'stripe-webhook'
        });

        // Skip if this is the first invoice (already handled by checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') {
          logger.info('Skipping first invoice (handled by checkout)', { invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        // Get the price ID from invoice lines
        if (!invoice.lines.data || invoice.lines.data.length === 0) {
          logger.error('No line items in invoice', null, { invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        const priceId = invoice.lines.data[0].price?.id;
        if (!priceId) {
          logger.error('No price ID in invoice line', null, { invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        // Get credit amount
        const creditsToAdd = PRICE_TO_CREDITS[priceId];
        if (!creditsToAdd) {
          logger.error('Unknown price ID in invoice', null, { priceId, invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        // Get user by email
        const customerEmail = invoice.customer_email;
        if (!customerEmail) {
          logger.error('No customer email in invoice', null, { invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        // Find user
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', customerEmail)
          .single();

        if (userError || !userData) {
          logger.error('User not found for invoice', userError, { email: customerEmail, invoiceId: invoice.id, operation: 'stripe-webhook' });
          break;
        }

        const userId = userData.id;

        // Add credits
        const { data: creditData, error: creditError } = await supabase.rpc('add_credits', {
          user_uuid: userId,
          credits_to_add: creditsToAdd,
          description_text: `Subscription renewal - ${creditsToAdd} credits`,
          ref_id: invoice.id,
          ref_type: 'stripe_subscription_renewal',
          transaction_metadata: {
            stripe_invoice_id: invoice.id,
            stripe_customer_id: invoice.customer,
            stripe_subscription_id: invoice.subscription,
            price_id: priceId,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            billing_reason: invoice.billing_reason,
          }
        });

        // Ensure profile has stripe identifiers & tier
        try {
          const tier = (priceId === 'price_1S0fYXDSKngmC6wHQuhgXK92') ? 'starter' : (priceId === 'price_1S0fYXDSKngmC6wHFADzfnbx') ? 'premium' : null;
          const updates: Record<string, any> = { stripe_customer_id: invoice.customer };
          if (invoice.subscription) updates.stripe_subscription_id = String(invoice.subscription);
          if (tier) {
            updates.subscription_tier = tier;
            updates.subscription_status = 'active';
          }
          await supabase.from('profiles').update(updates).eq('id', userId);
        } catch (persistErr) {
          logger.error('Failed to persist stripe identifiers to profile (invoice)', persistErr, { userId, invoiceId: invoice.id, operation: 'stripe-webhook' });
        }

        if (creditError) {
          logger.error('Failed to add subscription credits', creditError, {
            userId,
            creditsToAdd,
            invoiceId: invoice.id,
            operation: 'stripe-webhook'
          });
          break;
        }

        logger.info('Subscription credits added successfully', {
          userId,
          email: customerEmail,
          creditsAdded: creditsToAdd,
          invoiceId: invoice.id,
          priceId,
          operation: 'stripe-webhook'
        });

        // Send subscription renewal email
        try {
          const emailService = new EmailService();
          const plan = (priceId === 'price_1S0fYXDSKngmC6wHQuhgXK92') ? 'Starter' : (priceId === 'price_1S0fYXDSKngmC6wHFADzfnbx') ? 'Premium' : 'Subscription';
          await emailService.sendSubscriptionConfirmationEmail(customerEmail, plan);
        } catch (emailError) {
          logger.error('Failed to send subscription renewal email', emailError, { userId, email: customerEmail, operation: 'stripe-webhook' });
        }

        break;
      }

      case "customer.subscription.deleted": {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription cancelled', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          operation: 'stripe-webhook'
        });
        // Note: We don't remove credits when subscription is cancelled
        // User keeps their current balance
        break;
      }

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type, operation: 'stripe-webhook' });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Webhook error', error, { operation: 'stripe-webhook' });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

