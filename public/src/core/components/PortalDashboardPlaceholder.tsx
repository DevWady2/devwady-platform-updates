/**
 * Reusable placeholder for portal dashboards during development.
 */
import type { PortalConfig } from "@/core/portals/registry";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  portal: PortalConfig;
  pageName?: string;
}

export default function PortalDashboardPlaceholder({ portal, pageName }: Props) {
  const { lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {lang === "ar" ? portal.label_ar : portal.label_en}
          {pageName && ` — ${pageName}`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === "ar" ? portal.description_ar : portal.description_en}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${portal.accentGradient} flex items-center justify-center opacity-30`}>
                <portal.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "بطاقة قادمة" : `Card ${i}`}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <Construction className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {lang === "ar" ? "قيد الإنشاء" : "Under Construction"}
          </h3>
          <p className="text-sm text-muted-foreground/60 max-w-md">
            {lang === "ar"
              ? "هذا البورتال قيد التطوير. سيتم إضافة المحتوى والوظائف قريبًا."
              : "This portal is being built. Content and features will be added soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
