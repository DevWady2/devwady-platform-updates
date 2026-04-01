import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAdminUser } from "../_shared/account-identity.ts";

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const isAdmin = await isAdminUser(adminClient, caller.id);

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRes, unreadRes, todayRes, recentRes, typesRes] = await Promise.all([
      adminClient.from("notifications").select("id", { count: "exact", head: true }),
      adminClient.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
      adminClient.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      adminClient
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient.from("notifications").select("type"),
    ]);

    const typeCounts: Record<string, number> = {};
    for (const r of typesRes.data || []) {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    }
    const mostActiveType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    const notifications = recentRes.data || [];
    const userIds = [...new Set(notifications.map((n: any) => n.user_id))];
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    }

    const enriched = notifications.map((n: any) => {
      const profile = profileMap.get(n.user_id);
      return {
        ...n,
        user_name: profile?.full_name || null,
        user_avatar: profile?.avatar_url || null,
      };
    });

    return new Response(JSON.stringify({
      stats: {
        total: totalRes.count || 0,
        unread: unreadRes.count || 0,
        today: todayRes.count || 0,
        mostActiveType,
      },
      notifications: enriched,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
