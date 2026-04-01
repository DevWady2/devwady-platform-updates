import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit: email -> array of timestamps (max 3 per day)
const rateMap = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      expert_id, booking_date, start_time, end_time,
      guest_name, guest_email, guest_phone, notes,
      track, amount_usd, user_id, user_email,
    } = body;

    // Validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!expert_id || !uuidRegex.test(expert_id)) {
      return new Response(JSON.stringify({ error: "Invalid expert" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!booking_date) {
      return new Response(JSON.stringify({ error: "Booking date is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Check date is not in the past
    const bookDate = new Date(booking_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookDate < today) {
      return new Response(JSON.stringify({ error: "Booking date must be in the future" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!start_time) {
      return new Response(JSON.stringify({ error: "Start time is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the email for rate limiting
    const rateLimitEmail = (user_email || guest_email || "").trim().toLowerCase();
    if (!rateLimitEmail) {
      return new Response(JSON.stringify({ error: "Email is required for booking" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 3 bookings per email per day
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const timestamps = (rateMap.get(rateLimitEmail) || []).filter((t) => now - t < dayMs);
    if (timestamps.length >= 3) {
      return new Response(JSON.stringify({ error: "Too many bookings today. Max 3 per day." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    timestamps.push(now);
    rateMap.set(rateLimitEmail, timestamps);

    // Clean old entries
    if (rateMap.size > 1000) {
      for (const [k, v] of rateMap) {
        const fresh = v.filter((t) => now - t < dayMs);
        if (fresh.length === 0) rateMap.delete(k); else rateMap.set(k, fresh);
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: insertedBooking, error } = await supabase.from("consulting_bookings").insert({
      expert_id,
      user_id: user_id || null,
      guest_name: guest_name?.trim() || null,
      guest_email: user_email || guest_email?.trim() || null,
      guest_phone: guest_phone?.trim() || null,
      booking_date,
      start_time,
      end_time: end_time || start_time,
      status: body.status || "pending",
      notes: notes?.trim() || null,
      track: track || null,
      amount_usd: amount_usd || null,
      payment_status: body.payment_status || "unpaid",
    }).select("id").single();

    if (error) throw error;

    // Fetch expert name for the email
    let expertName = "our expert";
    try {
      const { data: expert } = await supabase.from("consulting_experts").select("name").eq("id", expert_id).maybeSingle();
      if (expert?.name) expertName = expert.name;
    } catch (_) { /* ignore */ }

    // Send booking confirmation email (fire-and-forget)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: rateLimitEmail,
        subject: "Booking confirmed — DevWady Consulting",
        template: "booking_confirmation",
        data: {
          guest_name: guest_name?.trim() || "there",
          expert_name: expertName,
          booking_date,
          start_time,
          end_time: end_time || start_time,
          amount: amount_usd ? `$${amount_usd}` : "Free consultation",
          lang: "en",
        },
      }),
    }).catch((e) => console.error("Email error:", e));

    return new Response(JSON.stringify({ success: true, booking_id: insertedBooking.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
