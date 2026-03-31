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
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
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

    // Get target user IDs based on audience
    let userIds: string[] = [];
    if (target === "all") {
      const { data: roles } = await adminClient.from("user_roles").select("user_id");
      userIds = [...new Set((roles || []).map((r: any) => r.user_id))];
    } else if (target === "individuals" || target === "companies" || target === "admins") {
      const roleValue = target === "individuals" ? "individual" : target === "companies" ? "company" : "admin";
      const { data: roles } = await adminClient.from("user_roles").select("user_id").eq("role", roleValue);
      userIds = (roles || []).map((r: any) => r.user_id);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ count: 0 }), {
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
        _metadata: JSON.stringify({ broadcast: true, sent_by: caller.id }),
      });
      if (!error) count++;
    }

    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
