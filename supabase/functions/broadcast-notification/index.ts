import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAudienceUserIds, isAdminUser, normalizeBroadcastTarget } from "../_shared/account-identity.ts";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const isAdmin = await isAdminUser(adminClient, caller.id);

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target, title_en, title_ar, body_en, body_ar, link } = await req.json();

    if (!title_en) {
      return new Response(JSON.stringify({ error: "Title EN is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedTarget = normalizeBroadcastTarget(target);
    const userIds = await getAudienceUserIds(adminClient, normalizedTarget);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ count: 0, target: normalizedTarget }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert notifications using create_notification function
    let count = 0;
    for (const uid of userIds) {
      const { error } = await adminClient.rpc("create_notification", {
        _user_id: uid,
        _type: "system",
        _title_en: title_en,
        _title_ar: title_ar || null,
        _body_en: body_en || null,
        _body_ar: body_ar || null,
        _link: link || null,
        _metadata: JSON.stringify({
          broadcast: true,
          target: normalizedTarget,
          sent_by: caller.id,
        }),
      });
      if (!error) count++;
    }

    return new Response(JSON.stringify({ count, target: normalizedTarget }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
