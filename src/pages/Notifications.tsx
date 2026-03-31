import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Bell, Calendar, CheckCircle2, Mail, Briefcase, Send,
  Star, FileText, Sparkles, Eye, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booking_new: { icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
  booking_confirmed: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  booking_cancelled: { icon: Calendar, color: "text-destructive", bg: "bg-destructive/10" },
  contact_new: { icon: Mail, color: "text-amber-500", bg: "bg-amber-500/10" },
  job_application: { icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  hire_request: { icon: Send, color: "text-violet-500", bg: "bg-violet-500/10" },
  shortlisted: { icon: Star, color: "text-pink-500", bg: "bg-pink-500/10" },
  application_status: { icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  welcome: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
  system: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" },
  /* ── Academy Talent Bridge — trigger-created notifications ──── */
  recommendation_received: { icon: Star, color: "text-primary", bg: "bg-primary/10" },
  nomination_received: { icon: Briefcase, color: "text-violet-500", bg: "bg-violet-500/10" },
};

const TAB_FILTERS: Record<string, (type: string) => boolean> = {
  all: () => true,
  unread: () => true, // filtered separately by is_read
  bookings: (t) => t.startsWith("booking"),
  jobs: (t) => ["job_application", "hire_request", "shortlisted", "application_status"].includes(t),
  system: (t) => ["welcome", "system", "contact_new", "recommendation_received", "nomination_received"].includes(t),
};

export default function Notifications() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);

  const filtered = useMemo(() => {
    let items = notifications;
    if (tab === "unread") {
      items = items.filter((n) => !n.is_read);
    }
    const filterFn = TAB_FILTERS[tab] || TAB_FILTERS.all;
    if (tab !== "unread") {
      items = items.filter((n) => filterFn(n.type));
    }
    return items;
  }, [notifications, tab]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const getTitle = (n: { title_en: string; title_ar: string | null }) =>
    lang === "ar" ? n.title_ar || n.title_en : n.title_en;

  const getBody = (n: { body_en: string | null; body_ar: string | null }) =>
    lang === "ar" ? n.body_ar || n.body_en : n.body_en;

  const getTypeConfig = (type: string) => typeConfig[type] || typeConfig.system;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <SEO title={t("notifications.title")} />
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => markAllAsRead()}
          >
            {t("notifications.markAllRead")}
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">{t("notifications.tabAll")}</TabsTrigger>
            <TabsTrigger value="unread">{t("notifications.tabUnread")}</TabsTrigger>
            <TabsTrigger value="bookings">{t("notifications.tabBookings")}</TabsTrigger>
            <TabsTrigger value="jobs">{t("notifications.tabJobs")}</TabsTrigger>
            <TabsTrigger value="system">{t("notifications.tabSystem")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-16 w-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">{t("notifications.noNotifications")}</p>
            <p className="text-sm">{t("notifications.allCaughtUp")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((n, i) => {
              const cfg = getTypeConfig(n.type);
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={`bg-card rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                    !n.is_read ? "border-s-2 border-s-primary bg-primary/[0.02]" : "border-border"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{getTitle(n)}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                      {!n.is_read ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => markAsRead(n.id)}
                          title={t("notifications.markRead")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {getBody(n) && (
                    <p className="text-sm text-muted-foreground mt-2 ltr:ms-11 rtl:me-11">
                      {getBody(n)}
                    </p>
                  )}

                  {/* Link */}
                  {n.link && (
                    <div className="mt-2 ltr:ms-11 rtl:me-11">
                      <button
                        className="text-xs text-primary hover:underline cursor-pointer"
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          navigate(n.link!);
                        }}
                      >
                        {t("notifications.viewDetails")}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((c) => c + 50)}
            >
              {t("notifications.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
