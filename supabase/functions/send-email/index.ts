const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://devwady.com";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:#1B2A4A;padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">DevWady</h1>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8f9fa;padding:24px 32px;text-align:center;border-top:1px solid #e9ecef;">
<p style="margin:0 0 4px;color:#6c757d;font-size:13px;">DevWady — Technology &amp; Software Company</p>
<p style="margin:0;color:#adb5bd;font-size:12px;">Cairo, Egypt | <a href="https://devwady.com" style="color:#0CBCCC;text-decoration:none;">devwady.com</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

const ctaStyle =
  "background:#0CBCCC;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;font-size:15px;";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tipItem(num: number, text: string): string {
  return `<tr><td style="padding:6px 0;vertical-align:top;width:28px;color:#0CBCCC;font-weight:bold;font-size:15px;">${num}.</td><td style="padding:6px 0;color:#4a4a4a;font-size:14px;line-height:1.5;">${text}</td></tr>`;
}

function renderTemplate(template: string, data: Record<string, any>): { subject: string; html: string } {
  const isAr = data.lang === "ar";

  switch (template) {
    /* ─── ROLE-SPECIFIC WELCOME EMAILS ─── */

    case "welcome_freelancer": {
      const name = esc(data.name) || "there";
      return {
        subject: isAr ? "مرحباً بك في DevWady!" : "Welcome to DevWady!",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `مرحباً ${name}!` : `Welcome, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${isAr ? "حساب المستقل الخاص بك جاهز. إليك كيف تبدأ:" : "Your freelancer account is ready. Here's how to get started:"}
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            ${tipItem(1, isAr ? "أكمل ملفك الشخصي لجذب الشركات" : "Complete your profile to attract companies")}
            ${tipItem(2, isAr ? "أضف مشاريعك إلى معرض أعمالك" : "Add projects to your portfolio")}
            ${tipItem(3, isAr ? "تصفح الوظائف المتاحة وابدأ بالتقديم" : "Browse available jobs and start applying")}
          </table>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/onboarding/freelancer" style="${ctaStyle}">${isAr ? "أكمل ملفك" : "Complete Your Profile"}</a>
          </p>
        `),
      };
    }

    case "welcome_company": {
      const name = esc(data.name) || "there";
      const cn = esc(data.company_name) || "";
      return {
        subject: isAr ? "تم استلام طلب حساب شركتكم" : "Company Account Submitted for Review",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `مرحباً ${name}!` : `Welcome, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px;">
            ${isAr
              ? `حساب شركة "${cn}" قيد المراجعة. فريقنا يراجع حسابات الشركات الجديدة خلال 24-48 ساعة. سنرسل لك بريداً إلكترونياً عند تفعيل حسابك.`
              : `Your company account for "${cn}" is under review. Our team reviews new company accounts within 24-48 hours. We'll email you once your account is activated.`}
          </p>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 8px;">
            ${isAr ? "في هذه الأثناء، استكشف ما يقدمه DevWady:" : "In the meantime, explore what DevWady offers:"}
          </p>
          <ul style="color:#4a4a4a;font-size:14px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
            <li><a href="${SITE_URL}/hiring" style="color:#0CBCCC;text-decoration:none;">${isAr ? "توظيف مستقلين" : "Hire freelancers"}</a></li>
            <li><a href="${SITE_URL}/services" style="color:#0CBCCC;text-decoration:none;">${isAr ? "خدماتنا" : "Our services"}</a></li>
            <li><a href="${SITE_URL}/academy/courses" style="color:#0CBCCC;text-decoration:none;">${isAr ? "أكاديمية ديف وادي" : "DevWady Academy"}</a></li>
          </ul>
        `),
      };
    }

    case "company_approved": {
      const name = esc(data.name) || "there";
      const cn = esc(data.company_name) || "";
      return {
        subject: isAr ? "تمت الموافقة على حساب شركتكم!" : "Your Company Account Has Been Approved!",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `أخبار رائعة، ${name}!` : `Great news, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px;">
            ${isAr
              ? `تمت الموافقة على حساب شركة "${cn}". لديك الآن وصول كامل إلى:`
              : `Your company account for "${cn}" has been approved. You now have full access to:`}
          </p>
          <ul style="color:#4a4a4a;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
            <li>${isAr ? "نشر وظائف وتصفح المواهب" : "Post jobs and browse talent"}</li>
            <li>${isAr ? "إرسال عروض توظيف للمستقلين" : "Send hire requests to freelancers"}</li>
            <li>${isAr ? "طلب خدمات تطوير" : "Request development services"}</li>
            <li>${isAr ? "دعوة أعضاء الفريق" : "Invite team members"}</li>
          </ul>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/company" style="${ctaStyle}">${isAr ? "الذهاب للوحة التحكم" : "Go to Dashboard"}</a>
          </p>
        `),
      };
    }

    case "welcome_student": {
      const name = esc(data.name) || "there";
      return {
        subject: isAr ? "مرحباً بك في أكاديمية DevWady!" : "Welcome to DevWady Academy!",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `مرحباً ${name}!` : `Welcome, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${isAr ? "حساب الطالب الخاص بك جاهز. ابدأ التعلم الآن!" : "Your student account is ready. Start learning now!"}
          </p>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 8px;">
            ${isAr ? "اكتشف دوراتنا في:" : "Explore our courses in:"}
          </p>
          <ul style="color:#4a4a4a;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
            <li>${isAr ? "تطوير الويب والموبايل" : "Web & Mobile Development"}</li>
            <li>${isAr ? "تصميم UI/UX" : "UI/UX Design"}</li>
            <li>${isAr ? "علم البيانات والذكاء الاصطناعي" : "Data Science & AI"}</li>
          </ul>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/training" style="${ctaStyle}">${isAr ? "تصفح الدورات" : "Browse Courses"}</a>
          </p>
        `),
      };
    }

    case "welcome_expert": {
      const name = esc(data.name) || "there";
      return {
        subject: isAr ? "مرحباً بك كخبير استشاري في DevWady!" : "Welcome to DevWady as a Consulting Expert!",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `مرحباً ${name}!` : `Welcome, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${isAr ? "تمت إضافتك كخبير استشاري. أكمل ملفك وأوقات توفرك لبدء استقبال الحجوزات." : "You've been added as a consulting expert. Set up your profile and availability to start receiving bookings."}
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/onboarding/expert" style="${ctaStyle}">${isAr ? "أكمل ملفك" : "Set Up Your Profile"}</a>
          </p>
        `),
      };
    }

    case "welcome_instructor": {
      const name = esc(data.name) || "there";
      return {
        subject: isAr ? "تهانينا! تمت الموافقة على طلبك كمدرب" : "Congratulations! Your Instructor Application is Approved",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `تهانينا ${name}!` : `Congratulations, ${name}!`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${isAr ? "تمت الموافقة على طلبك كمدرب. يمكنك الآن إنشاء الدورات والبدء في الربح." : "Your instructor application has been approved. You can now create courses and start earning."}
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/onboarding/instructor" style="${ctaStyle}">${isAr ? "أنشئ أول دورة" : "Create Your First Course"}</a>
          </p>
        `),
      };
    }

    case "verification_reminder": {
      const name = esc(data.name) || "there";
      return {
        subject: isAr ? "تذكير: تحقق من بريدك الإلكتروني" : "Reminder: Verify Your Email",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${isAr ? `مرحباً ${name}` : `Hi ${name}`}</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${isAr ? "لم تقم بالتحقق من بريدك الإلكتروني بعد. يرجى النقر على الرابط أدناه لتفعيل حسابك." : "You haven't verified your email yet. Please click the link below to activate your account."}
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/login" style="${ctaStyle}">${isAr ? "تسجيل الدخول والتحقق" : "Sign In to Verify"}</a>
          </p>
        `),
      };
    }

    /* ─── EXISTING TEMPLATES ─── */

    case "welcome": {
      const name = esc(data.name) || "there";
      return {
        subject: "Welcome to DevWady!",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">Welcome, ${name}!</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your account has been created successfully. Complete your profile to get started and unlock all features.
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/profile/edit?onboarding=true" style="${ctaStyle}">Complete Profile</a>
          </p>
        `),
      };
    }

    case "booking_confirmation": {
      const gn = esc(data.guest_name) || "there";
      return {
        subject: "Your Consultation Session is Confirmed",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">Booking Confirmed</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi ${gn}, your consultation session is confirmed. Here are the details:
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            <tr><td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:14px;width:120px;">Expert</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#1B2A4A;font-size:14px;font-weight:600;">${esc(data.expert_name) || "—"}</td></tr>
            <tr><td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:14px;">Date</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#1B2A4A;font-size:14px;font-weight:600;">${esc(data.booking_date) || "—"}</td></tr>
            <tr><td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:14px;">Time</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#1B2A4A;font-size:14px;font-weight:600;">${esc(data.start_time) || "—"}${data.end_time ? " – " + esc(data.end_time) : ""}</td></tr>
            ${data.amount ? `<tr><td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:14px;">Amount</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#1B2A4A;font-size:14px;font-weight:600;">$${esc(String(data.amount))}</td></tr>` : ""}
          </table>
          <p style="color:#6c757d;font-size:13px;line-height:1.5;">
            If you need to reschedule, please <a href="${SITE_URL}/contact" style="color:#0CBCCC;text-decoration:none;">contact us</a>.
          </p>
        `),
      };
    }

    case "contact_receipt": {
      const name = esc(data.name) || "there";
      return {
        subject: "We've Received Your Message",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">Thank You, ${name}!</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px;">
            We've received your message and our team will get back to you within 24 hours.
          </p>
          <p style="color:#6c757d;font-size:14px;line-height:1.5;">
            In the meantime, feel free to explore our <a href="${SITE_URL}/services" style="color:#0CBCCC;text-decoration:none;">services</a> or check out our <a href="${SITE_URL}/portfolio" style="color:#0CBCCC;text-decoration:none;">portfolio</a>.
          </p>
        `),
      };
    }

    case "application_update": {
      const an = esc(data.applicant_name) || "there";
      const jt = esc(data.job_title) || "the position";
      const status = data.status || "updated";
      let statusMsg = "";
      switch (status) {
        case "shortlisted":
          statusMsg = "Great news! The company is interested in your profile and has shortlisted you.";
          break;
        case "rejected":
          statusMsg = "Unfortunately, they've decided to go with other candidates at this time. Don't be discouraged — keep applying!";
          break;
        case "reviewed":
          statusMsg = "Your application is being reviewed by the hiring team. We'll keep you updated.";
          break;
        default:
          statusMsg = `Your application status has been updated to: ${esc(status)}.`;
      }
      return {
        subject: `Application Update: ${data.job_title || "Your Application"}`,
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">Application Update</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Hi ${an}, your application for <strong>${jt}</strong> has been <strong>${esc(status)}</strong>.
          </p>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 24px;">${statusMsg}</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/profile/applications" style="${ctaStyle}">View Applications</a>
          </p>
        `),
      };
    }

    case "hire_request": {
      const fn = esc(data.freelancer_name) || "there";
      const cn = esc(data.company_name) || "A company";
      return {
        subject: `${data.company_name || "A Company"} Wants to Hire You!`,
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">You Have a Hire Offer!</h2>
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Hi ${fn}, <strong>${cn}</strong> wants to hire you!
          </p>
          ${data.message ? `<div style="background:#f8f9fa;border-left:3px solid #0CBCCC;padding:16px;border-radius:4px;margin:0 0 24px;">
            <p style="margin:0;color:#4a4a4a;font-size:14px;line-height:1.5;font-style:italic;">"${esc(data.message)}"</p>
          </div>` : ""}
          <p style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/profile" style="${ctaStyle}">View Details</a>
          </p>
        `),
      };
    }

    case "generic":
    default: {
      const name = esc(data.name);
      const title = esc(data.title) || "Notification";
      const body = esc(data.body) || "";
      let cta = "";
      if (data.cta_text && data.cta_url) {
        cta = `<p style="text-align:center;margin:24px 0;"><a href="${esc(data.cta_url)}" style="${ctaStyle}">${esc(data.cta_text)}</a></p>`;
      }
      return {
        subject: data.title || "DevWady Notification",
        html: emailWrapper(`
          <h2 style="margin:0 0 16px;color:#1B2A4A;font-size:20px;">${title}</h2>
          ${name ? `<p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${name},</p>` : ""}
          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 24px;">${body}</p>
          ${cta}
        `),
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject: subjectOverride, template, data } = await req.json();

    if (!to || !template) {
      return new Response(
        JSON.stringify({ sent: false, reason: "Missing 'to' or 'template'" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[send-email] RESEND_API_KEY not configured — skipping send");
      return new Response(
        JSON.stringify({ sent: false, reason: "Email service not configured yet" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rendered = renderTemplate(template, data || {});
    const emailSubject = subjectOverride || rendered.subject;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DevWady <noreply@devwady.com>",
        to: [to],
        subject: emailSubject,
        html: rendered.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[send-email] Resend error:", res.status, err);
      return new Response(
        JSON.stringify({ sent: false, reason: `Resend error: ${res.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await res.json();
    return new Response(
      JSON.stringify({ sent: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-email] Error:", err);
    return new Response(
      JSON.stringify({ sent: false, reason: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
