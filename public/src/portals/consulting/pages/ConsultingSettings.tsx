/**
 * Consulting — Settings page.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Shield, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConsultingSettings() {
  const { lang } = useLanguage();
  const { role } = useAuth();
  const isAr = lang === "ar";
  const isExpert = role === "expert";

  const sections = [
    ...(isExpert ? [
      { icon: User, title_en: "Expert Profile", title_ar: "ملف الخبير", desc_en: "Update your consulting profile", desc_ar: "تحديث ملفك الاستشاري", link: "/consulting/portal/profile" },
      { icon: Calendar, title_en: "Availability", title_ar: "التوافر", desc_en: "Manage your schedule", desc_ar: "إدارة جدولك", link: "/consulting/portal/availability" },
    ] : []),
    { icon: Bell, title_en: "Notifications", title_ar: "الإشعارات", desc_en: "Manage notification preferences", desc_ar: "إدارة تفضيلات الإشعارات", link: "/notifications" },
    { icon: Shield, title_en: "Account & Security", title_ar: "الحساب والأمان", desc_en: "Password and security settings", desc_ar: "كلمة المرور وإعدادات الأمان", link: "/settings" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Workspace Settings"
        title_ar="إعدادات مساحة العمل"
        description_en="Manage your consulting portal settings"
        description_ar="إدارة إعدادات بوابة الاستشارات"
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
