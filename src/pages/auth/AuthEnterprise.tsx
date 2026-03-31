import ModuleAuthEntry from "./ModuleAuthEntry";
import { Rocket, FileText, Phone, LogIn } from "lucide-react";

export default function AuthEnterprise() {
  return (
    <ModuleAuthEntry
      icon={Rocket}
      gradient="from-[#7D33FF] to-[#956EFA]"
      module_en="DevWady Enterprise"
      module_ar="ديف وادي إنتربرايز"
      seoTitle_en="Enterprise Access — DevWady"
      seoTitle_ar="دخول إنتربرايز — ديف وادي"
      title_en="Enterprise Access"
      title_ar="الوصول إلى إنتربرايز"
      subtitle_en="Custom software, digital platforms, and enterprise systems — built and delivered by DevWady."
      subtitle_ar="برمجيات مخصصة ومنصات رقمية وأنظمة مؤسسية — يبنيها ويسلمها ديف وادي."
      signInLabel_en="Sign in as existing client"
      signInLabel_ar="تسجيل الدخول كعميل حالي"
      signInPath="/login?redirect=/enterprise/portal"
      highlights_en={["Agile Delivery", "Transparent Pricing", "Post-Launch Support"]}
      highlights_ar={["تسليم أجايل", "تسعير شفاف", "دعم بعد الإطلاق"]}
      options={[
        {
          icon: FileText,
          title_en: "Start a Project",
          title_ar: "ابدأ مشروعاً",
          desc_en: "Tell us about your project idea and we'll scope it with you — free discovery.",
          desc_ar: "أخبرنا عن فكرة مشروعك وسنحدد نطاقه معك — استكشاف مجاني.",
          path: "/start-project",
          variant: "primary",
        },
        {
          icon: Phone,
          title_en: "Request a Discovery Call",
          title_ar: "اطلب مكالمة استكشافية",
          desc_en: "Schedule a free consultation to discuss scope, timeline, and budget.",
          desc_ar: "حدد موعد استشارة مجانية لمناقشة النطاق والجدول والميزانية.",
          path: "/contact?subject=Enterprise%20Discovery",
        },
        {
          icon: LogIn,
          title_en: "Continue as Existing Client",
          title_ar: "تابع كعميل حالي",
          desc_en: "Access your project dashboard, quotes, and documents.",
          desc_ar: "ادخل للوحة مشاريعك وعروض الأسعار والمستندات.",
          path: "/login?redirect=/enterprise/portal",
        },
      ]}
    />
  );
}
