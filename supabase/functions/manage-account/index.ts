import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDefaultCapabilities, isAdminUser, normalizeAccountType } from "../_shared/account-identity.ts";

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
    const isAdmin = await isAdminUser(adminClient, caller.id);

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      action,
      user_id,
      reason,
      account_type,
      capabilities,
      approval_status,
      badges,
      entitlements,
      account_status,
    } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const canonicalAccountType = normalizeAccountType(account_type);
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("account_type")
      .eq("user_id", user_id)
      .maybeSingle();
    const resolvedExistingAccountType = normalizeAccountType(existingProfile?.account_type);
    const profilePatch: Record<string, unknown> = {};

    if (canonicalAccountType) {
      profilePatch.account_type = canonicalAccountType;
      if (Array.isArray(capabilities)) {
        profilePatch.capabilities = capabilities.filter(Boolean);
      } else {
        profilePatch.capabilities = await getDefaultCapabilities(adminClient, canonicalAccountType);
      }
    } else if (Array.isArray(capabilities)) {
      profilePatch.capabilities = capabilities.filter(Boolean);
    }

    if (account_status) profilePatch.account_status = account_status;
    if (typeof approval_status !== "undefined") profilePatch.approval_status = approval_status;
    if (typeof badges !== "undefined") profilePatch.badges = badges;
    if (typeof entitlements !== "undefined") profilePatch.entitlements = entitlements;

    let newStatus: string | null = null;
    let notificationTitle_en: string | null = null;
    let notificationTitle_ar: string | null = null;
    let notificationBody_en: string | null = null;
    let notificationBody_ar: string | null = null;

    switch (action) {
      case undefined:
      case null:
      case "":
        break;
      case "approve":
        newStatus = "active";
        profilePatch.account_status = newStatus;
        profilePatch.approval_status = "approved";
        notificationTitle_en = "Your account has been approved!";
        notificationTitle_ar = "تم الموافقة على حسابك!";
        notificationBody_en = "You now have full access to DevWady.";
        notificationBody_ar = "لديك الآن حق الوصول الكامل إلى DevWady.";
        break;
      case "activate":
        newStatus = "active";
        profilePatch.account_status = newStatus;
        notificationTitle_en = "Your account has been reactivated";
        notificationTitle_ar = "تم إعادة تفعيل حسابك";
        break;
      case "suspend":
        if (!reason) {
          return new Response(JSON.stringify({ error: "Reason required for suspension" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        newStatus = "suspended";
        profilePatch.account_status = newStatus;
        notificationTitle_en = "Your account has been suspended";
        notificationTitle_ar = "تم تعليق حسابك";
        notificationBody_en = reason;
        notificationBody_ar = reason;
        break;
      case "ban":
        if (!reason) {
          return new Response(JSON.stringify({ error: "Reason required for ban" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        newStatus = "banned";
        profilePatch.account_status = newStatus;
        notificationTitle_en = "Your account has been disabled";
        notificationTitle_ar = "تم تعطيل حسابك";
        notificationBody_en = reason;
        notificationBody_ar = reason;
        break;
      case "unban":
        newStatus = "active";
        profilePatch.account_status = newStatus;
        notificationTitle_en = "Your account has been restored";
        notificationTitle_ar = "تم استعادة حسابك";
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (Object.keys(profilePatch).length > 0) {
      if (action || account_status) {
        profilePatch.status_reason = reason || null;
        profilePatch.status_changed_at = new Date().toISOString();
        profilePatch.status_changed_by = caller.id;
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .upsert({ user_id, ...profilePatch }, { onConflict: "user_id" });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    // For approve action on company accounts, verify the company
    const resolvedAccountType = canonicalAccountType || resolvedExistingAccountType || normalizeAccountType((profilePatch.account_type as string | undefined) || null);
    if (action === "approve" && resolvedAccountType === "company") {
      await adminClient
        .from("company_profiles")
        .update({ is_verified: true })
        .eq("user_id", user_id);
    }

    // Ban/unban auth user
    if (action === "ban") {
      await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h",
      });
    } else if (action === "unban") {
      await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });
    }

    // Create notification (skip for banned users — they can't see it)
    if (action && action !== "ban" && notificationTitle_en && notificationTitle_ar) {
      try {
        await adminClient.rpc("create_notification", {
          _user_id: user_id,
          _type: "account_status",
          _title_en: notificationTitle_en,
          _title_ar: notificationTitle_ar,
          _body_en: notificationBody_en,
          _body_ar: notificationBody_ar,
          _link: "/profile",
          _metadata: {},
        });
      } catch {
        // Non-critical
      }
    }

    return new Response(JSON.stringify({
      success: true,
      new_status: newStatus || profilePatch.account_status || null,
      account_type: canonicalAccountType || resolvedExistingAccountType || null,
      capabilities: Array.isArray(profilePatch.capabilities) ? profilePatch.capabilities : undefined,
      approval_status: typeof profilePatch.approval_status === "undefined" ? null : profilePatch.approval_status,
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
