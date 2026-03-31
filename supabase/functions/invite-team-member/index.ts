import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildAccountTypeConflictPayload, ensureCanonicalProfile, isAdminUser, syncLegacyRoleBridge } from "../_shared/account-identity.ts";

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is company owner or admin team member
    const { data: callerTeam } = await adminClient
      .from("company_team_members")
      .select("role")
      .eq("company_user_id", caller.id)
      .eq("member_user_id", caller.id)
      .maybeSingle();

    // Also allow if caller IS the company_user_id with owner role, or is platform admin
    const isAdmin = await isAdminUser(adminClient, caller.id);

    if (!isAdmin && (!callerTeam || !["owner", "admin"].includes(callerTeam.role))) {
      return new Response(JSON.stringify({ error: "Only company owners or admins can invite team members" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role: memberRole } = await req.json();

    if (!email || !memberRole || !["admin", "member"].includes(memberRole)) {
      return new Response(JSON.stringify({ error: "Valid email and role (admin/member) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company name
    const { data: companyProfile } = await adminClient
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", caller.id)
      .maybeSingle();

    const companyName = companyProfile?.company_name || "A company";

    // Check if email already has an account
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let memberUserId: string;
    let resolvedAccountType: string | null = "company";

    if (existingUser) {
      memberUserId = existingUser.id;

      // Check if already a team member
      const { data: existing } = await adminClient
        .from("company_team_members")
        .select("id")
        .eq("company_user_id", caller.id)
        .eq("member_user_id", memberUserId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "This user is already a team member" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const canonicalProfile = await ensureCanonicalProfile(adminClient, memberUserId, "company");
      resolvedAccountType = canonicalProfile.resolvedAccountType || resolvedAccountType;
      if (canonicalProfile.conflict) {
        return new Response(JSON.stringify(buildAccountTypeConflictPayload(canonicalProfile)), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await syncLegacyRoleBridge(adminClient, memberUserId, "company");

      // Add to team
      await adminClient.from("company_team_members").insert({
        company_user_id: caller.id,
        member_user_id: memberUserId,
        role: memberRole,
        invited_by: caller.id,
        accepted_at: new Date().toISOString(),
      });

      // Notify them
      await adminClient.from("notifications").insert({
        user_id: memberUserId,
        type: "team_invite",
        title_en: `You've been added to ${companyName}'s team`,
        title_ar: `تمت إضافتك إلى فريق ${companyName}`,
        body_en: `You now have ${memberRole} access to ${companyName} on DevWady.`,
        body_ar: `لديك الآن صلاحية ${memberRole} في ${companyName} على DevWady.`,
        link: "/company",
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: email.split("@")[0], account_type: "company" },
      });

      if (createError || !newUser?.user) {
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      memberUserId = newUser.user.id;

      const canonicalProfile = await ensureCanonicalProfile(adminClient, memberUserId, "company");
      resolvedAccountType = canonicalProfile.resolvedAccountType || resolvedAccountType;
      if (canonicalProfile.conflict) {
        return new Response(JSON.stringify(buildAccountTypeConflictPayload(canonicalProfile)), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await syncLegacyRoleBridge(adminClient, memberUserId, "company");

      // Add to team
      await adminClient.from("company_team_members").insert({
        company_user_id: caller.id,
        member_user_id: memberUserId,
        role: memberRole,
        invited_by: caller.id,
        accepted_at: new Date().toISOString(),
      });

      // Send invitation email via magic link
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${Deno.env.get("SITE_URL") || supabaseUrl}/company` },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      member_user_id: memberUserId,
      account_type: resolvedAccountType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
