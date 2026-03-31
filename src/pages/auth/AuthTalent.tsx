import { AnimatePresence, motion } from "framer-motion";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import CompanySignupForm from "@/components/auth/CompanySignupForm";
import FreelancerSignupForm from "@/components/auth/FreelancerSignupForm";
import ModuleAuthEntry from "./ModuleAuthEntry";
import { Users, Building2, UserCheck } from "lucide-react";
import { normalizeAccountType } from "@/lib/accountType";

export default function AuthTalent() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedAccountType = normalizeAccountType(searchParams.get("accountType") || searchParams.get("role"));
  const redirect = searchParams.get("redirect") || "";

  if (requestedAccountType === "company" || requestedAccountType === "freelancer") {
    return (
      <>
        <SEO title={lang === "ar" ? "الوصول إلى تالنت" : "Talent Access"} />
        <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={requestedAccountType}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mx-auto"
            >
              {requestedAccountType === "company" ? (
                <CompanySignupForm onBack={() => navigate("/auth/talent")} redirect={redirect} />
              ) : (
                <FreelancerSignupForm onBack={() => navigate("/auth/talent")} redirect={redirect} />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </>
    );
  }

  if (searchParams.get("accountType") || searchParams.get("role")) {
    return <Navigate to="/auth/talent" replace />;
  }

  return (
    <ModuleAuthEntry
      icon={Users}
      gradient="from-[#185FA5] to-[#378ADD]"
      module_en="DevWady Talent"
      module_ar="ديف وادي تالنت"
      seoTitle_en="Talent Access — DevWady"
      seoTitle_ar="دخول تالنت — ديف وادي"
      title_en="Talent Access"
      title_ar="الوصول إلى تالنت"
      subtitle_en="Whether you're hiring or looking for your next opportunity — start here."
      subtitle_ar="سواء كنت تبحث عن مواهب أو فرص — ابدأ من هنا."
      signInLabel_en="Sign in to your account"
      signInLabel_ar="تسجيل الدخول لحسابك"
      signInPath="/login?redirect=/talent/portal"
      highlights_en={["Pre-Screened Talent", "Flexible Contracts", "Fast Matching"]}
      highlights_ar={["مواهب معتمدة", "عقود مرنة", "مطابقة سريعة"]}
      options={[
        {
          icon: Building2,
          title_en: "I Want to Hire Talent",
          title_ar: "أريد توظيف مواهب",
          desc_en: "Post jobs, browse vetted profiles, and manage your hiring pipeline.",
          desc_ar: "انشر وظائف وتصفح ملفات معتمدة وأدر خط التوظيف.",
          path: "/auth/talent?accountType=company",
          variant: "primary",
        },
        {
          icon: UserCheck,
          title_en: "I Am a Freelancer / Developer",
          title_ar: "أنا مستقل / مطور",
          desc_en: "Create your profile, apply to jobs, and get matched with top companies.",
          desc_ar: "أنشئ ملفك وقدم على الوظائف واحصل على مطابقة مع أفضل الشركات.",
          path: "/auth/talent?accountType=freelancer",
        },
      ]}
    />
  );
}
