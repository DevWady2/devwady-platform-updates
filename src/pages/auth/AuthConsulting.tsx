import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import ModuleAuthEntry from "./ModuleAuthEntry";
import ExpertSignupForm from "@/components/auth/ExpertSignupForm";
import { MessageSquareMore, Calendar, Shield } from "lucide-react";

export default function AuthConsulting() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");
  const redirect = searchParams.get("redirect") || "";

  if (role === "expert") {
    return (
      <>
        <SEO title={lang === "ar" ? "طلب الانضمام كخبير" : "Expert Application"} />
        <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
          <ExpertSignupForm onBack={() => navigate("/auth/consulting")} redirect={redirect} />
        </section>
      </>
    );
  }

  if (role) {
    return <Navigate to="/auth/consulting" replace />;
  }

  return (
    <ModuleAuthEntry
      icon={MessageSquareMore}
      gradient="from-[#7D33FF] to-[#3333FF]"
      module_en="DevWady Consulting"
      module_ar="استشارات ديف وادي"
      seoTitle_en="Consulting Access — DevWady"
      seoTitle_ar="دخول الاستشارات — ديف وادي"
      title_en="Consulting Access"
      title_ar="الوصول إلى الاستشارات"
      subtitle_en="Book expert consulting sessions or access your expert dashboard."
      subtitle_ar="احجز جلسات استشارية مع الخبراء أو ادخل لوحة الخبراء."
      signInLabel_en="Sign in to your account"
      signInLabel_ar="تسجيل الدخول لحسابك"
      signInPath="/login?redirect=/consulting/portal"
      highlights_en={["Expert Advisory", "Flexible Scheduling", "Transparent Pricing"]}
      highlights_ar={["استشارات خبراء", "حجز مرن", "أسعار شفافة"]}
      options={[
        {
          icon: Calendar,
          title_en: "Book a Consulting Session",
          title_ar: "احجز جلسة استشارية",
          desc_en: "Browse experts by specialization and book a one-on-one video session.",
          desc_ar: "تصفح الخبراء حسب التخصص واحجز جلسة فيديو فردية.",
          path: "/consulting",
          variant: "primary",
        },
        {
          icon: Shield,
          title_en: "Expert Access",
          title_ar: "دخول الخبراء",
          desc_en: "Apply as a consulting expert or sign in to your expert dashboard.",
          desc_ar: "قدّم طلب الانضمام كخبير أو سجل دخول للوحة الخبراء.",
          path: "/auth/consulting?role=expert",
          badge_en: "Experts",
          badge_ar: "خبراء",
        },
      ]}
    />
  );
}
