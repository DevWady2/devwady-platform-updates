import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const rateMap = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: max 5 lookups per email per hour
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const stamps = (rateMap.get(normalizedEmail) || []).filter((t) => now - t < oneHour);
    if (stamps.length >= 5) {
      return json({ error: "Too many lookups. Try again later." }, 429);
    }
    stamps.push(now);
    rateMap.set(normalizedEmail, stamps);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch service requests
    const { data: requests, error: reqErr } = await supabase
      .from("service_requests")
      .select("id, contact_name, contact_email, contact_phone, company_name, service_type, title, description, requirements, budget_range, timeline, preferred_start_date, attachments, status, source, created_at, updated_at")
      .eq("contact_email", normalizedEmail)
      .order("created_at", { ascending: false });

    if (reqErr) {
      console.error("Request query error:", reqErr);
      return json({ error: "Failed to look up requests" }, 500);
    }

    // Fetch quotes for these requests (only non-draft)
    const requestIds = (requests || []).map((r: any) => r.id);
    let quotesMap: Record<string, any[]> = {};

    if (requestIds.length > 0) {
      const { data: quotes, error: qErr } = await supabase
        .from("quotes")
        .select("id, service_request_id, quote_number, title, description, line_items, subtotal_usd, discount_pct, tax_pct, total_usd, currency, valid_until, payment_terms, estimated_duration, notes, status, sent_at, viewed_at, responded_at, created_at")
        .in("service_request_id", requestIds)
        .in("status", ["sent", "viewed", "approved", "rejected", "expired", "revised"]);

      if (!qErr && quotes) {
        for (const q of quotes) {
          const sid = q.service_request_id;
          if (!quotesMap[sid]) quotesMap[sid] = [];
          quotesMap[sid].push(q);
        }
      }
    }

    // Attach quotes to requests
    const result = (requests || []).map((r: any) => ({
      ...r,
      quotes: quotesMap[r.id] || [],
    }));

    return json({ requests: result });
  } catch (err) {
    console.error("Lookup error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
