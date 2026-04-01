/**
 * NotificationCenter — Full notification center UI (dropdown + page mode).
 * Uses useCoreNotifications for data and realtime updates.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCoreNotifications } from "@/core/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell, BellOff, Check, CheckCheck, ExternalLink,
  Calendar, Briefcase, User, BookOpen, MessageSquare, CreditCard,
  ShieldCheck, Star, Send, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import type { Notification } from "@/core/types";

const typeIcons: Record<string, React.ElementType> = {
  booking: Calendar,
  hire: Briefcase,
  account: User,
  enrollment: BookOpen,
  contact: MessageSquare,
  payment: CreditCard,
  admin: ShieldCheck,
  review: Star,
  application: Send,
  project: Clock,
  quote: CreditCard,
  welcome: Bell,
  service: Briefcase,
  shortlisted: Star,
  recommendation: Star,
  nomination: Briefcase,
};

function getTypeIcon(type: string) {
  const prefix = type.split("_")[0];
  return typeIcons[prefix] ?? Bell;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  lang: string;
}

function NotificationItem({ notification, onMarkRead, lang }: NotificationItemProps) {
  const Icon = getTypeIcon(notification.type);
  const isAr = lang === "ar";

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        notification.is_read ? "opacity-70" : "bg-primary/5"
      }`}
      role="listitem"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        notification.is_read ? "bg-muted" : "bg-primary/10"
      }`}>
        <Icon className={`h-4 w-4 ${notification.is_read ? "text-muted-foreground" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
          {isAr ? (notification.title_ar ?? notification.title_en) : notification.title_en}
        </p>
        {(isAr ? notification.body_ar : notification.body_en) && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {isAr ? notification.body_ar : notification.body_en}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {notification.link && (
          <Link to={notification.link}>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Open">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMarkRead(notification.id)}
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  /** Show as full page (true) or compact card (false) */
  fullPage?: boolean;
  typeFilter?: string;
}

export default function NotificationCenter({ fullPage = false, typeFilter }: NotificationCenterProps) {
  const { lang } = useLanguage();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useCoreNotifications({ typeFilter });
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const isAr = lang === "ar";

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const content = (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {isAr ? "الكل" : "All"}
            <Badge variant="secondary" className="ms-1.5 text-[10px]">{notifications.length}</Badge>
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            {isAr ? "غير مقروءة" : "Unread"}
            {unreadCount > 0 && <Badge variant="destructive" className="ms-1.5 text-[10px]">{unreadCount}</Badge>}
          </Button>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
            <CheckCheck className="h-3.5 w-3.5 me-1" />
            {isAr ? "قراءة الكل" : "Mark all read"}
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading notifications">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-3">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد إشعارات" : "No notifications"}
          </p>
        </div>
      ) : (
        <ScrollArea className={fullPage ? "h-[calc(100vh-300px)]" : "max-h-[400px]"}>
          <div className="space-y-1" role="list">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
                lang={lang}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (fullPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{isAr ? "مركز الإشعارات" : "Notification Center"}</h1>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {isAr ? "الإشعارات" : "Notifications"}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
