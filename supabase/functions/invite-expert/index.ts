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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { expert_id, existing_user_id } = body;

    if (!expert_id) {
      return new Response(JSON.stringify({ error: "expert_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get expert record
    const { data: expert, error: expErr } = await adminClient
      .from("consulting_experts").select("*").eq("id", expert_id).single();
    if (expErr || !expert) {
      return new Response(JSON.stringify({ error: "Expert not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (expert.user_id) {
      return new Response(JSON.stringify({ error: "Expert already linked to an account" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string;

    if (existing_user_id) {
      // Link to existing user account
      userId = existing_user_id;

      // Update or insert expert role
      const { data: existingRole } = await adminClient
        .from("user_roles").select("id, role").eq("user_id", userId).maybeSingle();

      if (existingRole) {
        await adminClient.from("user_roles").update({ role: "expert" as any }).eq("id", existingRole.id);
      } else {
        await adminClient.from("user_roles").insert({ user_id: userId, role: "expert" as any });
      }

      // Send notification
      await adminClient.rpc("create_notification", {
        _user_id: userId,
        _type: "system",
        _title_en: "You have been added as a consulting expert",
        _title_ar: "تم إضافتك كخبير استشاري",
        _body_en: "You can now manage your availability and bookings from the expert dashboard.",
        _body_ar: "يمكنك الآن إدارة جدولك وحجوزاتك من لوحة الخبير.",
        _link: "/expert/dashboard",
        _metadata: { expert_id },
      });
    } else {
      // Create new user account
      if (!expert.email) {
        return new Response(JSON.stringify({ error: "Expert has no email address" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: expert.email,
        email_confirm: false,
        user_metadata: { full_name: expert.name, account_type: "expert" },
      });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;

      // Insert expert role
      await adminClient.from("user_roles").insert({ user_id: userId, role: "expert" as any });

      // Generate magic link for invitation
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: expert.email,
      });

      // Send invitation email (fire-and-forget)
      if (!linkErr && linkData) {
        const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:8080";
        fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            to: expert.email,
            subject: "You're invited to DevWady as an Expert!",
            template: "generic",
            data: {
              name: expert.name,
              title: "Welcome to DevWady Expert Platform",
              body: `You've been invited to join DevWady as a consulting expert. Click the button below to set up your account and start managing your consulting sessions.`,
              cta_text: "Set Up Your Account",
              cta_url: linkData.properties?.action_link || `${SITE_URL}/login`,
              lang: "en",
            },
          }),
        }).catch((e) => console.error("Email error:", e));
      }
    }

    // Link expert to user account
    const { error: updateErr } = await adminClient
      .from("consulting_experts").update({ user_id: userId }).eq("id", expert_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("invite-expert error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
