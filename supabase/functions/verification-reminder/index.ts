import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Get users who signed up 24-72 hours ago and haven't verified email
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({
      perPage: 100,
    });

    if (listErr) {
      console.error("[verification-reminder] listUsers error:", listErr);
      return new Response(JSON.stringify({ error: listErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const unverified = (users || []).filter((u) => {
      if (u.email_confirmed_at) return false;
      const createdAt = new Date(u.created_at).getTime();
      const age = now - createdAt;
      return age >= DAY_MS && age <= 3 * DAY_MS;
    });

    let sent = 0;
    for (const user of unverified) {
      const name = user.user_metadata?.full_name || "";
      const lang = user.user_metadata?.lang || "en";

      // Send reminder via send-email function
      await admin.functions.invoke("send-email", {
        body: {
          to: user.email,
          template: "verification_reminder",
          data: { name, lang },
        },
      });
      sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, checked: users?.length || 0, reminded: sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[verification-reminder] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
