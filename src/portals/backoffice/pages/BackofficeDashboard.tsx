/**
 * Backoffice — Global Dashboard with pending actions first.
 * First-screen: pending actions → operational stats → recent requests.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, StatCardGrid, ActivityFeed } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, FolderKanban, Calendar, GraduationCap,
  FileInput, ArrowRight, UserCheck,
  AlertCircle, ClipboardList, Mail,
} from "lucide-react";
import { formatStatus, REQUEST_STATUS_COLORS, formatCurrency } from "../constants";

const STALE = 30_000;

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  contact_name: string;
  created_at: string;
}

export default function BackofficeDashboard() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: userCount = 0, isLoading } = useQuery({
    queryKey: ["bo-stats", "users"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: requestCount = 0 } = useQuery({
    queryKey: ["bo-stats", "requests"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("service_requests").select("id", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: revenueTotal = 0 } = useQuery({
    queryKey: ["bo-stats", "revenue"], staleTime: STALE,
    queryFn: async () => { const { data } = await supabase.from("payments").select("amount_usd").eq("status", "paid"); return (data ?? []).reduce((s, p) => s + (Number(p.amount_usd) || 0), 0); },
  });

  const { data: recentRequests = [] } = useQuery<RecentRequest[]>({
    queryKey: ["bo-recent-requests"], staleTime: STALE,
    queryFn: async () => { const { data } = await supabase.from("service_requests").select("id, title, status, contact_name, created_at").order("created_at", { ascending: false }).limit(5); return (data ?? []) as RecentRequest[]; },
  });

  const { data: pendingAccounts = 0 } = useQuery({
    queryKey: ["bo-stats", "pending-companies"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "pending_approval"); return count ?? 0; },
  });

  const { data: newRequests = 0 } = useQuery({
    queryKey: ["bo-new-requests"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "new"); return count ?? 0; },
  });

  const { data: pendingBookings = 0 } = useQuery({
    queryKey: ["bo-pending-bookings"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("consulting_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"); return count ?? 0; },
  });

  const { data: pendingInstructorApps = 0 } = useQuery({
    queryKey: ["bo-pending-instructor-apps"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("instructor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"); return count ?? 0; },
  });

  const { data: unreadContacts = 0 } = useQuery({
    queryKey: ["bo-unread-contacts"], staleTime: STALE,
    queryFn: async () => { const { count } = await supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"); return count ?? 0; },
  });

  const totalPending = pendingAccounts + newRequests + pendingBookings + pendingInstructorApps + unreadContacts;

  const pendingItems = [
    { label_en: "Account Approvals", label_ar: "موافقات الحسابات", count: pendingAccounts, link: "/admin/users", icon: UserCheck, color: "text-amber-600" },
    { label_en: "New Requests", label_ar: "طلبات جديدة", count: newRequests, link: "/admin/service-requests", icon: FileInput, color: "text-blue-600" },
    { label_en: "Pending Bookings", label_ar: "حجوزات معلقة", count: pendingBookings, link: "/admin/bookings", icon: Calendar, color: "text-violet-600" },
    { label_en: "Instructor Apps", label_ar: "طلبات معلمين", count: pendingInstructorApps, link: "/admin/instructor-applications", icon: ClipboardList, color: "text-emerald-600" },
    { label_en: "Unread Messages", label_ar: "رسائل غير مقروءة", count: unreadContacts, link: "/admin/contacts", icon: Mail, color: "text-rose-600" },
  ].filter(item => item.count > 0);

  const stats = [
    { label_en: "Total Users", label_ar: "إجمالي المستخدمين", value: userCount, icon: "users" as const, color: "primary" as const },
    { label_en: "Service Requests", label_ar: "طلبات الخدمة", value: requestCount, icon: "projects" as const, color: "warning" as const },
    { label_en: "Total Revenue", label_ar: "إجمالي الإيرادات", value: formatCurrency(revenueTotal), icon: "revenue" as const, color: "success" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Backoffice"
        title_ar="الإدارة"
        description_en="DevWady operations overview"
        description_ar="نظرة عامة على عمليات ديف وادي"
      />

      {/* Pending Actions — dominant first block */}
      {totalPending > 0 && (
        <Card className="bg-gradient-to-br from-warning/8 to-warning/3 border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              {isAr ? `${totalPending} إجراء معلق` : `${totalPending} Pending Action${totalPending > 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {pendingItems.map(item => (
                <Link key={item.link} to={item.link}>
                  <div className="p-3 rounded-xl border bg-background/80 hover:bg-muted/50 transition-colors text-center">
                    <item.icon className={`h-5 w-5 mx-auto ${item.color}`} />
                    <p className="text-2xl font-bold mt-1">{item.count}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isAr ? item.label_ar : item.label_en}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <StatCardGrid stats={stats} loading={isLoading} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileInput className="h-4 w-4" />
                {isAr ? "طلبات إنتربرايز الأخيرة" : "Recent Enterprise Requests"}
              </CardTitle>
              <Link to="/admin/service-requests">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="h-3.5 w-3.5 ms-1 icon-flip-rtl" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد طلبات" : "No requests yet"}
                </p>
              ) : (
                recentRequests.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.contact_name} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${REQUEST_STATUS_COLORS[r.status] ?? ""}`}>
                      {formatStatus(r.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ActivityFeed limit={6} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isAr ? "المشاريع" : "Projects", icon: FolderKanban, to: "/admin/projects" },
          { label: isAr ? "الحجوزات" : "Bookings", icon: Calendar, to: "/admin/bookings" },
          { label: isAr ? "الدورات" : "Courses", icon: GraduationCap, to: "/admin/training" },
          { label: isAr ? "المستخدمون" : "Users", icon: Users, to: "/admin/users" },
        ].map((q) => (
          <Link key={q.to} to={q.to}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <q.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{q.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
