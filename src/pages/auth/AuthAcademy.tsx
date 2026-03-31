import { AnimatePresence, motion } from "framer-motion";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentSignupForm from "@/components/auth/StudentSignupForm";
import InstructorSignupForm from "@/components/auth/InstructorSignupForm";
import ModuleAuthEntry from "./ModuleAuthEntry";
import { GraduationCap, BookOpen, Award } from "lucide-react";

export default function AuthAcademy() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");
  const redirect = searchParams.get("redirect") || "";

  if (role === "student") {
    return (
      <>
        <SEO title={lang === "ar" ? "الوصول إلى الأكاديمية" : "Academy Access"} />
        <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mx-auto"
            >
              <StudentSignupForm onBack={() => navigate("/auth/academy")} redirect={redirect} />
            </motion.div>
          </AnimatePresence>
        </section>
      </>
    );
  }

  if (role === "instructor") {
    return (
      <>
        <SEO title={lang === "ar" ? "تقديم طلب مدرب" : "Instructor Application"} />
        <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="instructor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg mx-auto"
            >
              <InstructorSignupForm onBack={() => navigate("/auth/academy")} redirect={redirect} />
            </motion.div>
          </AnimatePresence>
        </section>
      </>
    );
  }

  if (role) {
    return <Navigate to="/auth/academy" replace />;
  }

  return (
    <ModuleAuthEntry
      icon={GraduationCap}
      gradient="from-[#0F6E56] to-[#1D9E75]"
      module_en="DevWady Academy"
      module_ar="أكاديمية ديف وادي"
      seoTitle_en="Academy Access — DevWady"
      seoTitle_ar="دخول الأكاديمية — ديف وادي"
      title_en="Academy Access"
      title_ar="الوصول إلى الأكاديمية"
      subtitle_en="Enroll in courses, track your progress, or manage your teaching content."
      subtitle_ar="سجل في الدورات وتابع تقدمك أو أدر محتوى التدريس."
      signInLabel_en="Sign in to your account"
      signInLabel_ar="تسجيل الدخول لحسابك"
      signInPath="/login?redirect=/academy/portal"
      highlights_en={["Expert Instructors", "Industry Certificates", "Project-Based Learning"]}
      highlights_ar={["مدربون خبراء", "شهادات صناعية", "تعلم قائم على المشاريع"]}
      options={[
        {
          icon: BookOpen,
          title_en: "I'm a Student",
          title_ar: "أنا طالب",
          desc_en: "Enroll in courses, learn from experts, and earn certificates.",
          desc_ar: "سجل في الدورات وتعلم من الخبراء واحصل على شهادات.",
          path: "/auth/academy?role=student",
          variant: "primary",
        },
        {
          icon: Award,
          title_en: "I'm an Instructor",
          title_ar: "أنا مدرب",
          desc_en: "Apply to teach on DevWady Academy or sign in to your teaching dashboard.",
          desc_ar: "قدم للتدريس على أكاديمية ديف وادي أو سجل دخولك.",
          path: "/auth/academy?role=instructor",
          badge_en: "Application required",
          badge_ar: "يتطلب تقديم طلب",
        },
      ]}
    />
  );
}
