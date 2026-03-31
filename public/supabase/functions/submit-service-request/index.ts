import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROJECT_TYPES = ["mobile_app", "website", "enterprise_system", "uiux_design", "other"];
const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];
const ALLOWED_SERVICES = [...PROJECT_TYPES, ...SERVICE_TYPES];

// Rate limit: email -> timestamps[]
const rateMap = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const {
      contact_name, contact_email, contact_phone, company_name,
      service_type, title, description, requirements, budget_range,
      timeline, preferred_start_date, attachments, user_id, source,
      metadata,
    } = body;

    // Validation
    if (!contact_name || contact_name.trim().length < 2)
      return json({ error: "Name must be at least 2 characters" }, 400);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contact_email || !emailRegex.test(contact_email))
      return json({ error: "Invalid email address" }, 400);

    if (!title || title.trim().length < 5)
      return json({ error: "Title must be at least 5 characters" }, 400);

    if (!description || description.trim().length < 50)
      return json({ error: "Description must be at least 50 characters" }, 400);

    if (!service_type || !ALLOWED_SERVICES.includes(service_type))
      return json({ error: "Invalid service type" }, 400);

    // Derive category from service_type
    const category = PROJECT_TYPES.includes(service_type) ? "project" : "service";

    // Rate limit: max 3 per email per 24h
    const normalizedEmail = contact_email.trim().toLowerCase();
    const now = Date.now();
    const DAY = 86_400_000;
    const stamps = (rateMap.get(normalizedEmail) || []).filter((t) => now - t < DAY);
    if (stamps.length >= 3) {
      return json({ error: "Too many requests. Please try again later." }, 429);
    }
    stamps.push(now);
    rateMap.set(normalizedEmail, stamps);

    // Clean old entries
    if (rateMap.size > 500) {
      for (const [k, v] of rateMap) {
        const fresh = v.filter((t) => now - t < DAY);
        if (fresh.length === 0) rateMap.delete(k);
        else rateMap.set(k, fresh);
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase.from("service_requests").insert({
      user_id: user_id || null,
      contact_name: contact_name.trim(),
      contact_email: normalizedEmail,
      contact_phone: contact_phone?.trim() || null,
      company_name: company_name?.trim() || null,
      service_type,
      category,
      title: title.trim(),
      description: description.trim(),
      requirements: requirements?.trim() || null,
      budget_range: budget_range || null,
      timeline: timeline || null,
      preferred_start_date: preferred_start_date || null,
      attachments: attachments || [],
      source: source || "website",
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    }).select("id").single();

    if (error) throw error;

    // Send confirmation email (fire-and-forget)
    const siteUrl = Deno.env.get("SITE_URL") || "https://devwady-heartbeat.lovable.app";
    const trackUrl = user_id
      ? `${siteUrl}/my-projects`
      : `${siteUrl}/request-status?email=${encodeURIComponent(normalizedEmail)}`;

    const emailSubject = category === "project"
      ? "We received your project brief — DevWady"
      : "We received your service request — DevWady";
    const emailTitle = category === "project"
      ? "We received your project brief"
      : "We received your service request";

    fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        to: normalizedEmail,
        subject: emailSubject,
        template: "generic",
        data: {
          title: emailTitle,
          body: `Thank you ${contact_name.trim()}! Our team will review your request for "${title.trim()}" and get back to you within 48 hours.`,
          cta_text: "Track your request",
          cta_url: trackUrl,
        },
      }),
    }).catch((e) => console.error("Email error:", e));

    return json({ success: true, id: data.id, category });
  } catch (err) {
    console.error("submit-service-request error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
