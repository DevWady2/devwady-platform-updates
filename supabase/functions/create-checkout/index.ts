import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:8080";

    if (!STRIPE_SECRET_KEY) {
      console.warn("STRIPE_SECRET_KEY not set — running in dev mode");
      return new Response(JSON.stringify({
        dev_mode: true,
        message: "Stripe not configured. Payment skipped in dev mode."
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      type,
      reference_id,
      amount_usd,
      description,
      customer_email,
      user_id,
      metadata: extraMeta,
      success_path,
      cancel_path,
    } = body;

    if (!type || !amount_usd || amount_usd <= 0) {
      return new Response(JSON.stringify({ error: "Invalid payment request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout Session via REST API
    const stripeParams = new URLSearchParams();
    stripeParams.append("mode", "payment");
    stripeParams.append("payment_method_types[]", "card");
    stripeParams.append("line_items[0][price_data][currency]", "usd");
    stripeParams.append("line_items[0][price_data][unit_amount]", String(Math.round(amount_usd * 100)));
    stripeParams.append("line_items[0][price_data][product_data][name]", description || "DevWady Payment");
    stripeParams.append("line_items[0][quantity]", "1");
    stripeParams.append("success_url", `${SITE_URL}${success_path || "/payment/success"}?session_id={CHECKOUT_SESSION_ID}`);
    stripeParams.append("cancel_url", `${SITE_URL}${cancel_path || "/payment/cancel"}?session_id={CHECKOUT_SESSION_ID}`);
    if (customer_email) stripeParams.append("customer_email", customer_email);
    stripeParams.append("metadata[type]", type);
    stripeParams.append("metadata[reference_id]", reference_id || "");
    stripeParams.append("metadata[user_id]", user_id || "");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeParams.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record pending payment in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("payments").insert({
      user_id: user_id || null,
      guest_email: customer_email || null,
      type,
      status: "pending",
      amount_usd,
      currency: "usd",
      stripe_session_id: session.id,
      reference_type: type === "consulting_session" ? "consulting_booking" : type === "course_purchase" ? "course_enrollment" : "other",
      reference_id: reference_id || null,
      description,
      metadata: extraMeta || {},
    });

    return new Response(JSON.stringify({
      checkout_url: session.url,
      session_id: session.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
