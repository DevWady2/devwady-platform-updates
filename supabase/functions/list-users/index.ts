import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAdminUser, normalizeAccountType } from "../_shared/account-identity.ts";

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

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 500 });

    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, full_name, avatar_url, account_type, capabilities, approval_status, badges, entitlements, account_status, status_reason, status_changed_at, status_changed_by");

    const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));

    const enriched = users.map((u: any) => {
      const profile = profileMap.get(u.id);
      const canonicalAccountType = normalizeAccountType(profile?.account_type);

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        full_name: profile?.full_name || u.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        account_type: canonicalAccountType,
        capabilities: profile?.capabilities || [],
        approval_status: profile?.approval_status || null,
        badges: profile?.badges || null,
        entitlements: profile?.entitlements || null,
        account_status: profile?.account_status || "active",
        status_reason: profile?.status_reason || null,
        status_changed_at: profile?.status_changed_at || null,
        status_changed_by: profile?.status_changed_by || null,
      };
    });

    return new Response(JSON.stringify(enriched), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
