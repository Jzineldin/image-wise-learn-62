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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
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

    

    // First, check the database subscription_tier field (supports manual upgrades)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    const dbTier = profile?.subscription_tier || 'free';
    const dbStatus = profile?.subscription_status || 'active';

    // If user has a paid tier in the database and it's active, return that immediately
    if (dbTier !== 'free' && dbStatus === 'active') {
      logger.info('Using database subscription tier', { dbTier, userId: user.id, operation: 'check-subscription' });
      
      const creditsPerMonth = dbTier === 'starter' ? 100 : dbTier === 'premium' ? 300 : 10;
      
      return new Response(JSON.stringify({
        subscribed: true,
        tier: dbTier,
        product_id: null, // Database-based subscription, no Stripe product
        subscription_end: null,
        credits_per_month: creditsPerMonth
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Otherwise, check Stripe for active subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = profile?.stripe_customer_id || null;

    if (!customerId) {
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
      customerId = customers.data[0].id;
      // persist for future
      await supabaseClient.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    logger.info('Using Stripe customer', { customerId, operation: 'check-subscription' });

    // Find subscriptions (any status) and pick the most relevant
    const subsAll = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
      expand: ['data.items.data.price']
    });

    const pick = subsAll.data.find(s => ['active','trialing','past_due','unpaid'].includes(s.status))
      || subsAll.data[0];

    let hasActiveSub = false;
    let tier: 'free' | 'starter' | 'premium' = 'free';
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let creditsPerMonth = 10;

    if (pick) {
      const status = pick.status;
      hasActiveSub = ['active','trialing','past_due','unpaid'].includes(status);
      subscriptionEnd = pick.current_period_end ? new Date(pick.current_period_end * 1000).toISOString() : null;

      const price = pick.items.data[0]?.price;
      productId = (price?.product as string) ?? null;
      const metadata = price?.metadata ?? {} as any;

      // Determine tier
      if (metadata.tier === 'starter' || metadata.tier === 'premium') {
        tier = metadata.tier;
      } else if (price?.id === 'price_1S0fYXDSKngmC6wHQuhgXK92' || price?.unit_amount === 999) {
        tier = 'starter';
      } else if (price?.id === 'price_1S0fYXDSKngmC6wHFADzfnbx' || price?.unit_amount === 1999) {
        tier = 'premium';
      }

      if (metadata.credits_per_month) {
        creditsPerMonth = parseInt(String(metadata.credits_per_month));
      } else if (tier === 'starter') {
        creditsPerMonth = 100;
      } else if (tier === 'premium') {
        creditsPerMonth = 300;
      }

      logger.info('Subscription status evaluated', {
        status,
        hasActiveSub,
        subscriptionId: pick.id,
        tier,
        creditsPerMonth,
        operation: 'check-subscription'
      });
    } else {
      logger.info('No subscriptions found for customer', { operation: 'check-subscription' });
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