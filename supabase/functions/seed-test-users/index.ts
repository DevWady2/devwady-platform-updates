import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

interface UserSeed {
  email: string;
  full_name: string;
  account_type: string;
  password?: string;
}

const PASSWORD = "TestUser123!";

async function ensureUser(u: UserSeed): Promise<string> {
  // Check existing
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1 });
  const found = (await supabase.auth.admin.listUsers({ perPage: 1000 })).data?.users?.find(
    (x: any) => x.email === u.email
  );
  if (found) {
    // Update profile
    await supabase.from("profiles").update({
      full_name: u.full_name,
      account_type: u.account_type,
      account_status: "active",
    }).eq("user_id", found.id);
    return found.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password || PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, account_type: u.account_type },
  });
  if (error) throw new Error(`createUser ${u.email}: ${error.message}`);
  // Update profile created by trigger
  await supabase.from("profiles").update({
    full_name: u.full_name,
    account_type: u.account_type,
    account_status: "active",
  }).eq("user_id", data.user.id);
  return data.user.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const results: any[] = [];

    // 1. Create instructor
    const instructorId = await ensureUser({
      email: "instructor3@devwady.com",
      full_name: "Dr. Hassan El-Sayed",
      account_type: "instructor",
    });
    results.push({ email: "instructor3@devwady.com", user_id: instructorId });

    // 2. Create courses owned by instructor (bootcamp/live)
    const courses = [
      { title_en: "Full-Stack Bootcamp", title_ar: "بوتكامب فل ستاك", slug: "full-stack-bootcamp", learning_product_type: "bootcamp_track", delivery_mode: "cohort_based", level_en: "Advanced", level_ar: "متقدم", status: "published" },
      { title_en: "Live SDET Masterclass", title_ar: "ماستركلاس SDET مباشر", slug: "live-sdet-masterclass", learning_product_type: "live_course", delivery_mode: "live", level_en: "Intermediate", level_ar: "متوسط", status: "published" },
      { title_en: "AI/ML Foundations", title_ar: "أساسيات الذكاء الاصطناعي", slug: "ai-ml-foundations", learning_product_type: "standard_course", delivery_mode: "self_paced", level_en: "Beginner", level_ar: "مبتدئ", status: "published" },
      { title_en: "Laravel Backend Pro", title_ar: "لارافل باكند برو", slug: "laravel-backend-pro", learning_product_type: "standard_course", delivery_mode: "self_paced", level_en: "Intermediate", level_ar: "متوسط", status: "published" },
    ];

    const courseIds: Record<string, string> = {};
    for (const c of courses) {
      const { data: existing } = await supabase.from("training_courses").select("id").eq("slug", c.slug).maybeSingle();
      if (existing) {
        courseIds[c.slug] = existing.id;
      } else {
        const { data: created, error } = await supabase.from("training_courses").insert({
          ...c, instructor_id: instructorId, icon: "BookOpen", emoji: "📚", sort_order: Object.keys(courseIds).length + 1,
          duration_en: "12 weeks", duration_ar: "12 أسبوع", price_usd: 299,
        }).select("id").single();
        if (error) throw new Error(`course ${c.slug}: ${error.message}`);
        courseIds[c.slug] = created.id;
      }
    }

    // 3. Create students
    const students: (UserSeed & { meta: any })[] = [
      { email: "student3@devwady.com", full_name: "Yasmin Al-Farsi", account_type: "student", meta: { course: "full-stack-bootcamp", progress: 0.85, talent: { visibility_state: "opportunity_ready", allow_nomination: true }, nomination: { status: "submitted", scope: "general_opportunity" } } },
      { email: "student4@devwady.com", full_name: "Ahmed Zaki", account_type: "student", meta: { course: "full-stack-bootcamp", progress: 0.50, talent: { visibility_state: "academy_only", allow_nomination: true }, nomination: null } },
      { email: "student5@devwady.com", full_name: "Fatima Bouaziz", account_type: "student", meta: { course: "live-sdet-masterclass", progress: 0.90, talent: { visibility_state: "opportunity_ready", allow_nomination: true }, nomination: { status: "accepted", scope: "role_specific" } } },
      { email: "student6@devwady.com", full_name: "Khalid Nasser", account_type: "student", meta: { course: "full-stack-bootcamp", progress: 0.20, talent: { visibility_state: "private", allow_nomination: false }, nomination: null } },
      { email: "student7@devwady.com", full_name: "Mariam Haddad", account_type: "student", meta: { course: "ai-ml-foundations", progress: 1.0, talent: { visibility_state: "opportunity_ready", allow_nomination: true }, nomination: { status: "submitted", scope: "company_specific", target_company: "TechCorp" } } },
      { email: "student8@devwady.com", full_name: "Omar Saleh", account_type: "student", meta: { course: "full-stack-bootcamp", progress: 0.05, talent: { visibility_state: "private", allow_nomination: false }, nomination: null } },
      { email: "student9@devwady.com", full_name: "Rania Khoury", account_type: "student", meta: { course: "laravel-backend-pro", progress: 1.0, talent: { visibility_state: "academy_only", allow_nomination: true }, nomination: { status: "withdrawn", scope: "general_opportunity" } } },
      { email: "student10@devwady.com", full_name: "Tarek Mansouri", account_type: "student", meta: { course: "live-sdet-masterclass", progress: 0.55, talent: { visibility_state: "academy_only", allow_nomination: false }, nomination: null } },
      { email: "student11@devwady.com", full_name: "Dina Othman", account_type: "student", meta: { course: "ai-ml-foundations", progress: 0.70, talent: { visibility_state: "opportunity_ready", allow_nomination: true }, nomination: { status: "declined", scope: "role_specific" }, extra_courses: ["full-stack-bootcamp"] } },
      { email: "student12@devwady.com", full_name: "Youssef Ramadan", account_type: "student", meta: { course: "laravel-backend-pro", progress: 0.03, talent: { visibility_state: "private", allow_nomination: false }, nomination: null } },
    ];

    for (const s of students) {
      const userId = await ensureUser(s);
      results.push({ email: s.email, user_id: userId });

      // Enrollment
      const courseId = courseIds[s.meta.course];
      const enrollStatus = s.meta.progress >= 1.0 ? "completed" : "active";
      const { data: existingEnroll } = await supabase.from("course_enrollments").select("id").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
      let enrollId: string;
      if (existingEnroll) {
        enrollId = existingEnroll.id;
        await supabase.from("course_enrollments").update({ status: enrollStatus, completed_at: enrollStatus === "completed" ? new Date().toISOString() : null }).eq("id", enrollId);
      } else {
        const { data: newEnroll, error } = await supabase.from("course_enrollments").insert({
          user_id: userId, course_id: courseId, status: enrollStatus, completed_at: enrollStatus === "completed" ? new Date().toISOString() : null,
        }).select("id").single();
        if (error) throw new Error(`enroll ${s.email}: ${error.message}`);
        enrollId = newEnroll.id;
      }

      // Extra courses for multi-track
      if (s.meta.extra_courses) {
        for (const slug of s.meta.extra_courses) {
          const cid = courseIds[slug];
          const { data: ex } = await supabase.from("course_enrollments").select("id").eq("user_id", userId).eq("course_id", cid).maybeSingle();
          if (!ex) {
            await supabase.from("course_enrollments").insert({ user_id: userId, course_id: cid, status: "active" });
          }
        }
      }

      // Talent profile
      if (s.meta.talent) {
        const { data: existingTP } = await supabase.from("academy_talent_profiles").select("id").eq("user_id", userId).maybeSingle();
        const tpData = {
          user_id: userId,
          visibility_state: s.meta.talent.visibility_state,
          allow_nomination: s.meta.talent.allow_nomination,
          allow_opportunity_matching: s.meta.talent.visibility_state === "opportunity_ready",
          headline: `${s.full_name} — Academy Student`,
          primary_track: s.meta.course.includes("sdet") ? "SDET" : s.meta.course.includes("ai") ? "AI/ML" : s.meta.course.includes("laravel") ? "Backend" : "Full-Stack",
        };
        if (existingTP) {
          await supabase.from("academy_talent_profiles").update(tpData).eq("id", existingTP.id);
        } else {
          await supabase.from("academy_talent_profiles").insert(tpData);
        }
      }

      // Nomination
      if (s.meta.nomination) {
        const { data: existingNom } = await supabase.from("academy_nominations").select("id").eq("student_user_id", userId).eq("nominated_by", instructorId).maybeSingle();
        const nomData = {
          student_user_id: userId,
          nominated_by: instructorId,
          course_id: courseId,
          status: s.meta.nomination.status,
          nomination_scope: s.meta.nomination.scope,
          nomination_reason: `Nominated by Dr. Hassan for ${s.meta.nomination.scope.replace(/_/g, " ")}`,
          evidence_summary: `Strong performance in ${s.meta.course.replace(/-/g, " ")}`,
          target_company_name: s.meta.nomination.target_company || null,
          submitted_at: s.meta.nomination.status !== "draft" ? new Date().toISOString() : null,
          responded_at: ["accepted", "declined", "withdrawn"].includes(s.meta.nomination.status) ? new Date().toISOString() : null,
        };
        if (existingNom) {
          await supabase.from("academy_nominations").update(nomData).eq("id", existingNom.id);
        } else {
          await supabase.from("academy_nominations").insert(nomData);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
