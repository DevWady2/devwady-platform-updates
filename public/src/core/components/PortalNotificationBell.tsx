/**
 * PortalNotificationBell — Real-time notification bell with dropdown.
 * Shows unread count badge and the 5 most recent notifications.
 */
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCoreNotifications } from "@/core/hooks/useNotifications";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/core/types";

export default function PortalNotificationBell() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCoreNotifications({ limit: 10 });

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg relative"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 h-4 w-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">
              {isAr ? "الإشعارات" : "Notifications"}
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => { markAllAsRead(); }}
              >
                {isAr ? "قراءة الكل" : "Mark all read"}
              </Button>
            )}
          </div>

          {/* List */}
          {recent.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {isAr ? "لا توجد إشعارات" : "No notifications yet"}
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="divide-y">
                {recent.map((n) => (
                  <NotifItem key={n.id} notification={n} lang={lang} onMarkRead={markAsRead} onClose={() => setOpen(false)} />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <Link
              to="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {isAr ? "عرض كل الإشعارات" : "View all notifications"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({
  notification: n, lang, onMarkRead, onClose,
}: {
  notification: Notification;
  lang: string;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const isAr = lang === "ar";
  return (
    <div className={`flex items-start gap-3 px-4 py-3 text-start ${n.is_read ? "opacity-60" : "bg-primary/5"}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.is_read ? "text-muted-foreground" : "font-medium"}`}>
          {isAr ? (n.title_ar ?? n.title_en) : n.title_en}
        </p>
        {(isAr ? n.body_ar : n.body_en) && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {isAr ? n.body_ar : n.body_en}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {n.link && (
          <Link to={n.link} onClick={onClose}>
            <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button>
          </Link>
        )}
        {!n.is_read && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMarkRead(n.id)}>
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
