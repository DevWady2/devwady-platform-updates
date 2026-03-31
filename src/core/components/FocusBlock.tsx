/**
 * FocusBlock — Dominant first-screen work block for portal dashboards.
 * Shows the single most important item + action for the current role.
 */
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface FocusBlockProps {
  icon: React.ElementType;
  label_en: string;
  label_ar: string;
  title_en: string;
  title_ar: string;
  subtitle_en?: string;
  subtitle_ar?: string;
  action_en: string;
  action_ar: string;
  actionHref: string;
  children?: ReactNode;
  accent?: "primary" | "success" | "warning";
}

const accentMap = {
  primary: "from-primary/8 to-primary/4 border-primary/15",
  success: "from-success/8 to-success/4 border-success/15",
  warning: "from-warning/8 to-warning/4 border-warning/15",
};

const iconAccentMap = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
};

export default function FocusBlock({
  icon: Icon,
  label_en,
  label_ar,
  title_en,
  title_ar,
  subtitle_en,
  subtitle_ar,
  action_en,
  action_ar,
  actionHref,
  children,
  accent = "primary",
}: FocusBlockProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Card className={`bg-gradient-to-br ${accentMap[accent]} border overflow-hidden`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconAccentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              {isAr ? label_ar : label_en}
            </p>
            <h2 className="text-base font-semibold text-foreground truncate">
              {isAr ? title_ar : title_en}
            </h2>
            {(subtitle_en || subtitle_ar) && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {isAr ? (subtitle_ar ?? subtitle_en) : subtitle_en}
              </p>
            )}
          </div>
          <Link to={actionHref} className="flex-shrink-0">
            <Button size="sm" className="rounded-full group shadow-sm">
              {isAr ? action_ar : action_en}
              <ArrowRight className="h-3.5 w-3.5 ms-1.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 icon-flip-rtl" />
            </Button>
          </Link>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
