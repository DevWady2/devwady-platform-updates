/**
 * Enterprise — Workspace Settings page.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Shield, User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function EnterpriseSettings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const sections = [
    { icon: Building2, title_en: "Company Profile", title_ar: "ملف الشركة", desc_en: "Update your company information and branding", desc_ar: "حدّث معلومات شركتك والعلامة التجارية", link: "/enterprise/portal/company-profile" },
    { icon: User, title_en: "Profile Settings", title_ar: "إعدادات الملف", desc_en: "Update your personal information", desc_ar: "حدّث معلوماتك الشخصية", link: "/profile/edit" },
    { icon: Bell, title_en: "Notifications", title_ar: "الإشعارات", desc_en: "Manage notification preferences", desc_ar: "إدارة تفضيلات الإشعارات", link: "/notifications" },
    { icon: Shield, title_en: "Account & Security", title_ar: "الحساب والأمان", desc_en: "Password, sessions, and security", desc_ar: "كلمة المرور والجلسات والأمان", link: "/settings" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Workspace Settings"
        title_ar="إعدادات مساحة العمل"
        description_en="Manage your Enterprise workspace and company preferences"
        description_ar="إدارة مساحة العمل وتفضيلات الشركة"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.link} to={s.link}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{isAr ? s.title_ar : s.title_en}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? s.desc_ar : s.desc_en}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
