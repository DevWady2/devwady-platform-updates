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
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: max 5 lookups per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("path", `lookup:${normalizedEmail}`)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Too many lookups. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log lookup for rate limiting
    await supabase.from("page_views").insert({
      path: `lookup:${normalizedEmail}`,
      user_agent: "booking-lookup",
    });

    // Query bookings
    const { data: bookings, error } = await supabase
      .from("consulting_bookings")
      .select(`
        id, booking_date, start_time, end_time, status, payment_status,
        amount_usd, guest_name, meeting_url, track, rating, review, reviewed_at,
        consulting_experts(id, name, name_ar, avatar_url, initials, track, track_ar, role, role_ar, slug)
      `)
      .eq("guest_email", normalizedEmail)
      .order("booking_date", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return new Response(JSON.stringify({ error: "Failed to look up bookings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ bookings: bookings ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Lookup error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
