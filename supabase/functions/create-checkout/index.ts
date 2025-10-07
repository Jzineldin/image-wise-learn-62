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
    logger.info('Create checkout function started', { operation: 'create-checkout' });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logger.info('Stripe key verified', { operation: 'create-checkout' });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { endpoint: 'create-checkout' });
    }
    logger.info('Authorization header found', { operation: 'create-checkout' });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return ResponseHandler.error('Invalid or expired token', 403, { endpoint: 'create-checkout', reason: userError?.message });
    }
    const user = userData.user;
    if (!user?.email) {
      return ResponseHandler.error('User is not authenticated', 403, { endpoint: 'create-checkout' });
    }
    logger.info('User authenticated', { userId: user.id, email: user.email, operation: 'create-checkout' });

    const { price_id, type = "subscription" } = await req.json();
    if (!price_id) throw new Error("price_id is required");
    logger.info('Request parsed', { price_id, type, operation: 'create-checkout' });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logger.info('Existing customer found', { customerId, operation: 'create-checkout' });
    } else {
      logger.info('No existing customer found', { operation: 'create-checkout' });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create checkout session based on type
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: type === "subscription" ? "subscription" : "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true, // Enable promo codes for all checkout types
      metadata: {
        user_id: user.id,
        type: type,
      },
    };

    // Add additional config for subscriptions
    if (type === "subscription") {
      sessionConfig.billing_address_collection = "auto";
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logger.info('Checkout session created', { sessionId: session.id, url: session.url, operation: 'create-checkout' });

    return new Response(JSON.stringify({
      url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error in create-checkout', error, { operation: 'create-checkout' });
    return ResponseHandler.error(errorMessage, 500, { endpoint: 'create-checkout' });
  }
});