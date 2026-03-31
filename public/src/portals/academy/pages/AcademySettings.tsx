/**
 * Academy — Settings page. Links stay within portal where possible.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Shield, User, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function AcademySettings() {
  const { lang } = useLanguage();
  const { role } = useAuth();
  const isAr = lang === "ar";
  const isInstructor = role === "instructor";

  const sections = [
    ...(isInstructor ? [
      { icon: User, title_en: "Instructor Profile", title_ar: "ملف المعلم", desc_en: "Update your public instructor profile", desc_ar: "تحديث ملف المعلم العام", link: "/profile/edit" },
      { icon: BookOpen, title_en: "Course Management", title_ar: "إدارة الدورات", desc_en: "View and manage your courses", desc_ar: "عرض وإدارة دوراتك", link: "/academy/portal/courses" },
    ] : []),
    { icon: Sparkles, title_en: "Talent Profile", title_ar: "ملف المواهب", desc_en: "Manage your talent bridge visibility and career profile", desc_ar: "إدارة ملف المواهب وإعدادات الظهور المهني", link: "/academy/portal/talent-profile" },
    { icon: Bell, title_en: "Notifications", title_ar: "الإشعارات", desc_en: "Manage notification preferences", desc_ar: "إدارة تفضيلات الإشعارات", link: "/notifications" },
    { icon: Shield, title_en: "Account & Security", title_ar: "الحساب والأمان", desc_en: "Password and security settings", desc_ar: "كلمة المرور وإعدادات الأمان", link: "/settings" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Workspace Settings"
        title_ar="إعدادات مساحة العمل"
        description_en="Manage your Academy workspace preferences"
        description_ar="إدارة تفضيلات مساحة عمل الأكاديمية"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
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
