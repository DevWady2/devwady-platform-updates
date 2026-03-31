/**
 * Backoffice — Settings & Configuration.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Shield, Users, Bell, CreditCard, Globe, Database,
  Building2, Mail,
} from "lucide-react";

export default function BackofficeSettings() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const sections = [
    { icon: Users, title_en: "User Management", title_ar: "إدارة المستخدمين", desc_en: "Manage users and accounts", desc_ar: "إدارة المستخدمين والحسابات", link: "/admin/users" },
    { icon: Shield, title_en: "Roles & Permissions", title_ar: "الأدوار والصلاحيات", desc_en: "Configure access control", desc_ar: "ضبط التحكم في الوصول", link: "/admin/roles" },
    { icon: Building2, title_en: "Organizations", title_ar: "المؤسسات", desc_en: "Company account settings", desc_ar: "إعدادات حسابات الشركات", link: "/admin/organizations" },
    { icon: Bell, title_en: "Notifications", title_ar: "الإشعارات", desc_en: "Notification templates and rules", desc_ar: "قوالب وقواعد الإشعارات", link: "/admin/notifications" },
    { icon: CreditCard, title_en: "Payments", title_ar: "المدفوعات", desc_en: "Payment settings and gateways", desc_ar: "إعدادات وبوابات الدفع", link: "/admin/payments" },
    { icon: Mail, title_en: "Contact Forms", title_ar: "نماذج الاتصال", desc_en: "Manage contact submissions", desc_ar: "إدارة نماذج الاتصال", link: "/admin/contacts" },
    { icon: Globe, title_en: "Content", title_ar: "المحتوى", desc_en: "Blog, portfolio, and media", desc_ar: "المدونة والمعرض والوسائط", link: "/admin/blog" },
    { icon: Database, title_en: "System Info", title_ar: "معلومات النظام", desc_en: "Platform configuration", desc_ar: "ضبط المنصة", link: "/admin" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Settings"
        title_ar="الإعدادات"
        description_en="Platform configuration across Enterprise, Talent, Consulting, and Academy"
        description_ar="ضبط المنصة عبر إنتربرايز وتالنت والاستشارات والأكاديمية"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.link + s.title_en} to={s.link}>
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
