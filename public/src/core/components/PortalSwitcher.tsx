/**
 * PortalSwitcher — Quick portal launcher for the portals this account can access.
 * It does not switch identity; it only jumps between accessible portal surfaces.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PORTAL_LIST, canAccessPortal, type PortalConfig } from "@/core/portals/registry";
import { ChevronDown, ArrowRightLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PortalSwitcherProps {
  currentPortal: PortalConfig;
}

export default function PortalSwitcher({ currentPortal }: PortalSwitcherProps) {
  const { accountType, capabilities, role } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = lang === "ar";

  // Filter portals canonically: accountType first, capability hints second, legacy role only as fallback
  const availablePortals = PORTAL_LIST.filter(
    (p) =>
      p.requiresAuth &&
      p.id !== currentPortal.id &&
      canAccessPortal(p, { accountType, capabilities, role })
  );

  // Don't render if user only has access to the current portal
  if (availablePortals.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg px-2 text-xs font-medium"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span className="hidden md:inline">
            {isAr ? "البوابات" : "Portals"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {isAr ? "البوابات المتاحة" : "Available Portals"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availablePortals.map((portal) => {
          const Icon = portal.icon;
          const isActive = location.pathname.startsWith(portal.basePath);
          return (
            <DropdownMenuItem
              key={portal.id}
              onClick={() => navigate(portal.basePath)}
              className="gap-3 cursor-pointer"
              disabled={isActive}
            >
              <div
                className={`h-8 w-8 rounded-md bg-gradient-to-br ${portal.accentGradient} flex items-center justify-center shrink-0`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {isAr ? portal.label_ar : portal.label_en}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {isAr ? portal.description_ar : portal.description_en}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
