import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell, Send, Search, Loader2, MessageSquare, Eye, EyeOff,
  Calendar, Briefcase, Mail, Star, Sparkles, CheckCircle2, FileText,
} from "lucide-react";

const STALE_TIME = 60_000;

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  booking_new: { icon: Calendar, color: "bg-primary/10 text-primary", label: "Booking" },
  booking_confirmed: { icon: CheckCircle2, color: "bg-green-500/10 text-green-600", label: "Confirmed" },
  booking_cancelled: { icon: Calendar, color: "bg-destructive/10 text-destructive", label: "Cancelled" },
  contact_new: { icon: Mail, color: "bg-amber-500/10 text-amber-600", label: "Contact" },
  job_application: { icon: Briefcase, color: "bg-emerald-500/10 text-emerald-600", label: "Application" },
  hire_request: { icon: Send, color: "bg-violet-500/10 text-violet-600", label: "Hire" },
  shortlisted: { icon: Star, color: "bg-pink-500/10 text-pink-600", label: "Shortlist" },
  application_status: { icon: FileText, color: "bg-blue-500/10 text-blue-600", label: "Status" },
  recommendation_received: { icon: Star, color: "bg-amber-500/10 text-amber-600", label: "Recommendation" },
  nomination_received: { icon: Send, color: "bg-violet-500/10 text-violet-600", label: "Nomination" },
  system: { icon: Bell, color: "bg-muted text-muted-foreground", label: "System" },
  welcome: { icon: Sparkles, color: "bg-primary/10 text-primary", label: "Welcome" },
};

export default function AdminNotifications() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    target: "all",
    title_en: "",
    title_ar: "",
    body_en: "",
    body_ar: "",
    link: "",
  });

  // Fetch admin notifications data
  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications-data"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("admin-notifications");
      if (error) throw error;
      return result as {
        stats: { total: number; unread: number; today: number; mostActiveType: string };
        notifications: any[];
      };
    },
  });

  const stats = data?.stats || { total: 0, unread: 0, today: 0, mostActiveType: "none" };
  const notifications = data?.notifications || [];

  // Filter
  const filtered = useMemo(() => {
    let list = notifications;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (n: any) =>
          (n.title_en || "").toLowerCase().includes(q) ||
          (n.title_ar || "").toLowerCase().includes(q) ||
          (n.user_name || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      list = list.filter((n: any) => n.type === typeFilter);
    }
    return list;
  }, [notifications, search, typeFilter]);

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (payload: typeof broadcastData) => {
      const { data: result, error } = await supabase.functions.invoke("broadcast-notification", {
        body: payload,
      });
      if (error) throw error;
      return result as { count: number };
    },
    onSuccess: (result) => {
      toast.success(
        isAr
          ? `تم إرسال ${result.count} إشعار`
          : `${result.count} notifications sent`
      );
      setBroadcastOpen(false);
      setBroadcastData({ target: "all", title_en: "", title_ar: "", body_en: "", body_ar: "", link: "" });
      qc.invalidateQueries({ queryKey: ["admin-notifications-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statCards = [
    { label: t("admin.totalNotifications"), value: stats.total, icon: Bell, color: "text-primary" },
    { label: t("admin.unreadNotifications"), value: stats.unread, icon: EyeOff, color: "text-amber-500" },
    { label: t("admin.notificationsToday"), value: stats.today, icon: Calendar, color: "text-emerald-500" },
    { label: t("admin.mostActiveType"), value: typeConfig[stats.mostActiveType]?.label || stats.mostActiveType, icon: MessageSquare, color: "text-violet-500" },
  ];

  const notificationTypes = Object.keys(typeConfig);

  return (
    <>
      <SEO title={t("admin.notificationCenter")} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              {t("admin.notificationCenter")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "إدارة ومراقبة الإشعارات" : "Manage and monitor notifications"}
            </p>
          </div>
          <Button onClick={() => setBroadcastOpen(true)} className="gradient-brand text-primary-foreground rounded-full gap-2">
            <Send className="h-4 w-4" />
            {t("admin.sendBroadcast")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">{isAr ? "الإشعارات الأخيرة" : "Recent Notifications"}</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث..." : "Search..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ps-9 w-full sm:w-[200px] rounded-full"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] rounded-full">
                    <SelectValue placeholder={isAr ? "النوع" : "Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
                    {notificationTypes.map((t) => (
                      <SelectItem key={t} value={t}>{typeConfig[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">{isAr ? "لا توجد إشعارات" : "No notifications found"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isAr ? "الوقت" : "Time"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((n: any) => {
                      const tc = typeConfig[n.type] || typeConfig.system;
                      const TypeIcon = tc.icon;
                      return (
                        <TableRow key={n.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {n.user_avatar ? (
                                <img loading="lazy" src={n.user_avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                  {(n.user_name || "?")[0]}
                                </div>
                              )}
                              <span className="text-sm truncate max-w-[120px]">{n.user_name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`rounded-full gap-1 text-xs ${tc.color}`}>
                              <TypeIcon className="h-3 w-3" />
                              {tc.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm truncate block max-w-[200px]">
                              {isAr ? (n.title_ar || n.title_en) : n.title_en}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {n.is_read ? (
                              <Badge variant="secondary" className="rounded-full text-xs gap-1">
                                <Eye className="h-3 w-3" /> {isAr ? "مقروء" : "Read"}
                              </Badge>
                            ) : (
                              <Badge className="rounded-full text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                                <EyeOff className="h-3 w-3" /> {isAr ? "غير مقروء" : "Unread"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broadcast Dialog */}
        <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                {t("admin.sendBroadcast")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("admin.targetAudience")}</label>
                <Select value={broadcastData.target} onValueChange={(v) => setBroadcastData((d) => ({ ...d, target: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("admin.allUsers")}</SelectItem>
                    <SelectItem value="freelancers">{lang === "ar" ? "كل المستقلين" : "All freelancers"}</SelectItem>
                    <SelectItem value="companies">{t("admin.allCompanies")}</SelectItem>
                    <SelectItem value="experts">{lang === "ar" ? "كل الخبراء" : "All experts"}</SelectItem>
                    <SelectItem value="students">{lang === "ar" ? "كل الطلاب" : "All students"}</SelectItem>
                    <SelectItem value="instructors">{lang === "ar" ? "كل المدربين" : "All instructors"}</SelectItem>
                    <SelectItem value="admins">{t("admin.allAdmins")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "العنوان (إنجليزي) *" : "Title EN *"}</label>
                <Input
                  value={broadcastData.title_en}
                  onChange={(e) => setBroadcastData((d) => ({ ...d, title_en: e.target.value }))}
                  placeholder="Notification title..."
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "العنوان (عربي)" : "Title AR"}</label>
                <Input
                  value={broadcastData.title_ar}
                  onChange={(e) => setBroadcastData((d) => ({ ...d, title_ar: e.target.value }))}
                  placeholder="عنوان الإشعار..."
                  dir="rtl"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "المحتوى (إنجليزي)" : "Body EN"}</label>
                <Textarea
                  value={broadcastData.body_en}
                  onChange={(e) => setBroadcastData((d) => ({ ...d, body_en: e.target.value }))}
                  placeholder="Optional message body..."
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "المحتوى (عربي)" : "Body AR"}</label>
                <Textarea
                  value={broadcastData.body_ar}
                  onChange={(e) => setBroadcastData((d) => ({ ...d, body_ar: e.target.value }))}
                  placeholder="محتوى الرسالة..."
                  dir="rtl"
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isAr ? "الرابط (اختياري)" : "Link (optional)"}</label>
                <Input
                  value={broadcastData.link}
                  onChange={(e) => setBroadcastData((d) => ({ ...d, link: e.target.value }))}
                  placeholder="/pricing"
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBroadcastOpen(false)} className="rounded-full">
                {t("admin.cancel")}
              </Button>
              <Button
                onClick={() => broadcastMutation.mutate(broadcastData)}
                disabled={!broadcastData.title_en || broadcastMutation.isPending}
                className="gradient-brand text-primary-foreground rounded-full gap-2"
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t("admin.sendBroadcast")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
