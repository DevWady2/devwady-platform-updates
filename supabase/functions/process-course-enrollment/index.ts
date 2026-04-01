import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { payment_id, course_id, user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ enrollment_id: existing.id, already_enrolled: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from("course_enrollments")
      .insert({
        course_id,
        user_id,
        payment_id: payment_id || null,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Enrollment error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get course name for notification
    const { data: course } = await supabase
      .from("training_courses")
      .select("title_en, title_ar")
      .eq("id", course_id)
      .single();

    // Notify student
    await supabase.rpc("create_notification", {
      _user_id: user_id,
      _type: "enrollment",
      _title_en: `You're enrolled in ${course?.title_en || "a course"}!`,
      _title_ar: `تم تسجيلك في ${course?.title_ar || course?.title_en || "دورة"}!`,
      _body_en: "Start learning now",
      _body_ar: "ابدأ التعلم الآن",
      _link: `/academy/courses/${course_id}`,
      _metadata: { course_id },
    });

    // Send welcome email (fire-and-forget)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;

    if (email) {
      fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: `Welcome to ${course?.title_en || "your course"} — DevWady`,
          template: "generic",
          data: {
            name: profile?.full_name || "there",
            message: `You've been enrolled in ${course?.title_en}. Start learning now!`,
            lang: "en",
          },
        }),
      }).catch((e) => console.error("Email error:", e));
    }

    return new Response(JSON.stringify({ enrollment_id: enrollment.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Process enrollment error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
