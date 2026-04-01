import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Bell, Calendar, CheckCircle2, Mail, Briefcase, Send,
  Star, FileText, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

const typeIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  booking_new: { icon: Calendar, color: "text-primary" },
  booking_confirmed: { icon: CheckCircle2, color: "text-primary" },
  booking_cancelled: { icon: Calendar, color: "text-destructive" },
  contact_new: { icon: Mail, color: "text-amber-500" },
  job_application: { icon: Briefcase, color: "text-emerald-500" },
  hire_request: { icon: Send, color: "text-violet-500" },
  shortlisted: { icon: Star, color: "text-pink-500" },
  application_status: { icon: FileText, color: "text-emerald-500" },
  welcome: { icon: Sparkles, color: "text-primary" },
  recommendation_received: { icon: Star, color: "text-primary" },
  nomination_received: { icon: Briefcase, color: "text-violet-500" },
  system: { icon: Bell, color: "text-muted-foreground" },
};

export default function NotificationBell() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    const entry = typeIconMap[type] || typeIconMap.system;
    const Icon = entry.icon;
    return <Icon className={`h-4 w-4 shrink-0 ${entry.color}`} />;
  };

  const getTitle = (n: { title_en: string; title_ar: string | null }) =>
    lang === "ar" ? n.title_ar || n.title_en : n.title_en;

  const getBody = (n: { body_en: string | null; body_ar: string | null }) =>
    lang === "ar" ? n.body_ar || n.body_en : n.body_en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Items */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30 mb-2" />
            <span className="text-sm">{t("notifications.empty")}</span>
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
              onClick={() => {
                if (!n.is_read) markAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
            >
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getTitle(n)}</p>
                {getBody(n) && (
                  <p className="text-xs text-muted-foreground truncate">{getBody(n)}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </DropdownMenuItem>
          ))
        )}

        {/* Footer */}
        <DropdownMenuSeparator />
        <div className="py-1.5 text-center">
          <Link to="/notifications" className="text-xs text-primary hover:underline">
            {t("notifications.viewAll")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
