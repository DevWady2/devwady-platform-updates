/**
 * DashboardSection — Consistent card section pattern for all portal dashboards.
 * Provides a titled card with optional "View All" link and content area.
 */
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  title_en: string;
  title_ar: string;
  icon?: LucideIcon;
  viewAllTo?: string;
  viewAllLabel_en?: string;
  viewAllLabel_ar?: string;
  children: ReactNode;
  className?: string;
}

export default function DashboardSection({
  title_en,
  title_ar,
  icon: Icon,
  viewAllTo,
  viewAllLabel_en = "View All",
  viewAllLabel_ar = "عرض الكل",
  children,
  className,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Card className={className}>
      <CardHeader className="dashboard-section-header">
        <h3 className="dashboard-section-title">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {isAr ? title_ar : title_en}
        </h3>
        {viewAllTo && (
          <Link to={viewAllTo} className="dashboard-section-link">
            {isAr ? viewAllLabel_ar : viewAllLabel_en}
            <ArrowRight className="h-3.5 w-3.5 icon-flip-rtl" />
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
