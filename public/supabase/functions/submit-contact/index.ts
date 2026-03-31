import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit: email -> last submit timestamp
const rateMap = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message } = await req.json();

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Name must be at least 2 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message || typeof message !== "string" || message.trim().length < 10 || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message must be 10-2000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 1 per email per 60 seconds
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const lastSubmit = rateMap.get(normalizedEmail);
    if (lastSubmit && now - lastSubmit < 60_000) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait 60 seconds." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rateMap.set(normalizedEmail, now);

    // Clean old entries periodically
    if (rateMap.size > 1000) {
      for (const [k, v] of rateMap) {
        if (now - v > 120_000) rateMap.delete(k);
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
    });

    if (error) throw error;

    // Send receipt email (fire-and-forget)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: normalizedEmail,
        subject: "We received your message — DevWady",
        template: "contact_receipt",
        data: { name: name.trim(), lang: "en" },
      }),
    }).catch((e) => console.error("Email error:", e));

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
