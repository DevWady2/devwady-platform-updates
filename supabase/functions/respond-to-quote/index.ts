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
    const { quote_id, action, email, message } = await req.json();

    if (!quote_id || !action || !email) {
      return json({ error: "Missing required fields: quote_id, action, email" }, 400);
    }
    if (!["approve", "reject"].includes(action)) {
      return json({ error: "Action must be 'approve' or 'reject'" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: max 10 actions per email per hour
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const stamps = (rateMap.get(normalizedEmail) || []).filter((t) => now - t < oneHour);
    if (stamps.length >= 10) {
      return json({ error: "Too many actions. Try again later." }, 429);
    }
    stamps.push(now);
    rateMap.set(normalizedEmail, stamps);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch quote + linked service request
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("id, quote_number, title, status, service_request_id, total_usd")
      .eq("id", quote_id)
      .single();

    if (qErr || !quote) {
      return json({ error: "Quote not found" }, 404);
    }

    // Verify email ownership
    const { data: sr, error: srErr } = await supabase
      .from("service_requests")
      .select("id, contact_email, title, status")
      .eq("id", quote.service_request_id)
      .single();

    if (srErr || !sr) {
      return json({ error: "Service request not found" }, 404);
    }

    if (sr.contact_email.toLowerCase() !== normalizedEmail) {
      return json({ error: "Email does not match the service request" }, 403);
    }

    // Only allow response to 'sent' or 'viewed' quotes
    if (!["sent", "viewed"].includes(quote.status)) {
      return json({ error: `Cannot respond to a quote with status '${quote.status}'` }, 400);
    }

    const respondedAt = new Date().toISOString();

    if (action === "approve") {
      await supabase
        .from("quotes")
        .update({ status: "approved", responded_at: respondedAt })
        .eq("id", quote_id);

      await supabase
        .from("service_requests")
        .update({ status: "approved" })
        .eq("id", sr.id);
    } else {
      await supabase
        .from("quotes")
        .update({ status: "rejected", responded_at: respondedAt })
        .eq("id", quote_id);

      if (message) {
        const existingNotes = sr.status === "rejected" ? "" : "";
        const { data: currentSr } = await supabase
          .from("service_requests")
          .select("admin_notes")
          .eq("id", sr.id)
          .single();
        const prevNotes = currentSr?.admin_notes || "";
        const newNotes = prevNotes
          ? `${prevNotes}\n\n--- Client rejection (${new Date().toLocaleDateString()}) ---\n${message}`
          : `--- Client rejection (${new Date().toLocaleDateString()}) ---\n${message}`;
        await supabase
          .from("service_requests")
          .update({ admin_notes: newNotes })
          .eq("id", sr.id);
      }
    }

    // Send confirmation email
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: normalizedEmail,
          template: "generic",
          data: {
            title: action === "approve"
              ? `Quote ${quote.quote_number} Approved`
              : `Quote ${quote.quote_number} Declined`,
            body: action === "approve"
              ? `You approved quote ${quote.quote_number} for "${sr.title}" (Total: $${quote.total_usd}). Our team will be in touch shortly to begin the project.`
              : `You declined quote ${quote.quote_number} for "${sr.title}".${message ? ` Your feedback: "${message}"` : ""} Our team may reach out with a revised proposal.`,
            cta_text: "View Request Status",
            cta_url: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || ""}/request-status?email=${encodeURIComponent(normalizedEmail)}`,
          },
        },
      });
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
    }

    return json({
      success: true,
      action,
      quote_number: quote.quote_number,
    });
  } catch (err) {
    console.error("Respond error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
