import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ResponseHandler } from "../_shared/response-handlers.ts";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Check subscription function started', { operation: 'check-subscription' });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logger.info('Stripe key verified', { operation: 'check-subscription' });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { endpoint: 'check-subscription' });
    }
    logger.info('Authorization header found', { operation: 'check-subscription' });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return ResponseHandler.error('Invalid or expired token', 403, { endpoint: 'check-subscription', reason: userError?.message });
    }
    const user = userData.user;
    if (!user?.email) {
      return ResponseHandler.error('User is not authenticated', 403, { endpoint: 'check-subscription' });
    }
    logger.info('User authenticated', { userId: user.id, email: user.email, operation: 'check-subscription' });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logger.info('No customer found, returning free tier', { operation: 'check-subscription' });
      return new Response(JSON.stringify({
        subscribed: false,
        tier: "free",
        product_id: null,
        subscription_end: null,
        credits_per_month: 10
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logger.info('Found Stripe customer', { customerId, operation: 'check-subscription' });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = "free";
    let productId = null;
    let subscriptionEnd = null;
    let creditsPerMonth = 10;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;

      // Determine tier based on product metadata or price
      const price = subscription.items.data[0].price;
      const metadata = price.metadata;

      if (metadata.tier) {
        tier = metadata.tier;
      } else if (price.unit_amount === 999) {
        tier = "starter";
      } else if (price.unit_amount === 1999) {
        tier = "premium";
      }

      // Set credits per month based on tier
      if (metadata.credits_per_month) {
        creditsPerMonth = parseInt(metadata.credits_per_month);
      } else if (tier === "starter") {
        creditsPerMonth = 100;
      } else if (tier === "premium") {
        creditsPerMonth = 300;
      }

      logger.info('Active subscription found', {
        subscriptionId: subscription.id,
        endDate: subscriptionEnd,
        tier,
        creditsPerMonth,
        operation: 'check-subscription'
      });
    } else {
      logger.info('No active subscription found', { operation: 'check-subscription' });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      credits_per_month: creditsPerMonth
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error in check-subscription', error, { operation: 'check-subscription' });
    return ResponseHandler.error(errorMessage, 500, { endpoint: 'check-subscription' });
  }
});