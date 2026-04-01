import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminEmail = "kamalwagdy585@gmail.com";
    const adminPassword = "1234567oK";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === adminEmail);

    let userId: string;

    if (existing) {
      userId = existing.id;
      console.log("Admin user already exists:", userId);
    } else {
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: "Super Admin", account_type: "admin" },
        });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created admin user:", userId);
    }

    // Ensure profile exists and is active
    await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          full_name: "Super Admin",
          account_status: "active",
          account_type: "admin",
        },
        { onConflict: "user_id" }
      );

    // Assign admin role (idempotent)
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role" }
      );

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Super admin account ready",
        userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
