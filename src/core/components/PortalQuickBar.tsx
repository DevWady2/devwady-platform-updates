/**
 * PortalQuickBar — Role-first horizontal quick-link bar with primary CTA.
 * Rendered inside PortalShell, below the gradient header.
 */
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalHeaderConfig } from "@/core/config/portalHeaderConfig";

interface Props {
  config: PortalHeaderConfig;
}

export default function PortalQuickBar({ config }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const location = useLocation();

  const isActive = (path: string) => {
    const base = path.split("?")[0];
    return base === location.pathname
      || (base !== config.quickLinks[0]?.path && location.pathname.startsWith(base));
  };

  return (
    <div className="flex items-center gap-1.5 px-1 py-2.5 border-b border-border/30 mb-6 overflow-x-auto scrollbar-none">
      {config.quickLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
            isActive(link.path)
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          {isAr ? link.label_ar : link.label_en}
        </Link>
      ))}
      <div className="ms-auto flex-shrink-0 ps-2">
        <Button asChild size="sm" className="rounded-full h-7 text-xs gap-1.5 shadow-sm">
          <Link to={config.primaryCTA.path}>
            <config.primaryCTA.icon className="h-3 w-3" />
            {isAr ? config.primaryCTA.label_ar : config.primaryCTA.label_en}
          </Link>
        </Button>
      </div>
    </div>
  );
}
