import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Handshake, Clock, CheckCircle2, Play, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import PaginationControls from "@/components/PaginationControls";
import SEO from "@/components/SEO";

const PAGE_SIZE = 15;

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  accepted: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  completed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  rejected: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/20",
  expired: "bg-muted text-muted-foreground border-border",
};

export default function AdminEngagements() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [hirePage, setHirePage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ id: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: hires = [], isLoading: hiresLoading } = useQuery({
    queryKey: ["admin-hires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hire_requests")
        .select("*, profiles!hire_requests_freelancer_profile_id_fkey(full_name, avatar_url, user_id, slug), company_profiles!hire_requests_company_id_fkey(company_name, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: freelancerReviews = [], isLoading: frLoading } = useQuery({
    queryKey: ["admin-freelancer-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freelancer_reviews")
        .select("*, profiles:freelancer_user_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: companyReviews = [], isLoading: crLoading } = useQuery({
    queryKey: ["admin-company-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_reviews")
        .select("*, company_profiles:company_user_id(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // Stats
  const stats = useMemo(() => {
    const total = hires.length;
    const active = hires.filter(h => ["accepted", "in_progress"].includes(h.status)).length;
    const completed = hires.filter(h => h.status === "completed").length;
    const pending = hires.filter(h => h.status === "pending").length;
    const allRatings = [...freelancerReviews.map(r => r.rating), ...companyReviews.map(r => r.rating)];
    const avgRating = allRatings.length ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : "—";
    return { total, active, completed, pending, avgRating };
  }, [hires, freelancerReviews, companyReviews]);

  // Filter hires
  const filteredHires = useMemo(() => {
    let list = hires;
    if (tab === "pending") list = list.filter(h => h.status === "pending");
    else if (tab === "active") list = list.filter(h => ["accepted", "in_progress"].includes(h.status));
    else if (tab === "completed") list = list.filter(h => h.status === "completed");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        (h.profiles as any)?.full_name?.toLowerCase().includes(q) ||
        (h.company_profiles as any)?.company_name?.toLowerCase().includes(q) ||
        h.title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [hires, tab, search]);

  const hireTotalPages = Math.ceil(filteredHires.length / PAGE_SIZE);
  const paginatedHires = filteredHires.slice((hirePage - 1) * PAGE_SIZE, hirePage * PAGE_SIZE);

  // All reviews combined
  const allReviews = useMemo(() => {
    const fr = freelancerReviews.map(r => ({
      ...r, reviewType: "freelancer" as const,
      targetName: (r as any).profiles?.full_name || "—",
      reviewerLabel: lang === "ar" ? "شركة → مستقل" : "Company → Freelancer",
    }));
    const cr = companyReviews.map(r => ({
      ...r, reviewType: "company" as const,
      targetName: (r as any).company_profiles?.company_name || "—",
      reviewerLabel: lang === "ar" ? "مستقل → شركة" : "Freelancer → Company",
    }));
    return [...fr, ...cr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [freelancerReviews, companyReviews, lang]);

  const reviewTotalPages = Math.ceil(allReviews.length / PAGE_SIZE);
  const paginatedReviews = allReviews.slice((reviewPage - 1) * PAGE_SIZE, reviewPage * PAGE_SIZE);

  const handleStatusChange = async () => {
    if (!statusChangeDialog || !newStatus) return;
    try {
      const { error } = await supabase.from("hire_requests").update({ status: newStatus }).eq("id", statusChangeDialog.id);
      if (error) throw error;
      toast.success(lang === "ar" ? "تم تحديث الحالة" : "Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-hires"] });
      setStatusChangeDialog(null);
      setNewStatus("");
    } catch { toast.error("Failed"); }
  };

  const toggleReviewApproval = async (id: string, type: "freelancer" | "company", current: boolean) => {
    try {
      const table = type === "freelancer" ? "freelancer_reviews" : "company_reviews";
      const { error } = await supabase.from(table).update({ is_approved: !current }).eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: [type === "freelancer" ? "admin-freelancer-reviews" : "admin-company-reviews"] });
      toast.success(lang === "ar" ? "تم التحديث" : "Updated");
    } catch { toast.error("Failed"); }
  };

  const getInitials = (name: string | null) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";

  const metricCards = [
    { label: lang === "ar" ? "إجمالي الطلبات" : "Total Hires", value: stats.total, icon: Handshake, color: "text-primary" },
    { label: lang === "ar" ? "نشط" : "Active", value: stats.active, icon: Play, color: "text-blue-600" },
    { label: lang === "ar" ? "مكتمل" : "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600" },
    { label: lang === "ar" ? "بانتظار الرد" : "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
    { label: lang === "ar" ? "متوسط التقييم" : "Avg Rating", value: stats.avgRating, icon: Star, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <SEO title={lang === "ar" ? "إدارة التعاقدات" : "Engagements"} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{lang === "ar" ? "إدارة التعاقدات" : "Engagements"}</h1>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "نظرة شاملة على التوظيف والتعاقدات" : "Overview of hiring and engagements"}</p>
        </div>
        <ExportCSVButton
          data={filteredHires.map(h => ({
            company: (h.company_profiles as any)?.company_name,
            freelancer: (h.profiles as any)?.full_name,
            title: h.title,
            status: h.status,
            budget: h.budget_range,
            created: h.created_at,
          }))}
          filename="engagements"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metricCards.map(m => (
          <div key={m.label} className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
            </div>
            <span className="text-xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setHirePage(1); }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">{lang === "ar" ? "الكل" : "All Hires"}</TabsTrigger>
            <TabsTrigger value="pending">
              {lang === "ar" ? "بانتظار" : "Pending"}
              {stats.pending > 0 && <Badge className="ms-1.5 h-5 px-1.5 text-[10px]">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="active">{lang === "ar" ? "نشط" : "Active"}</TabsTrigger>
            <TabsTrigger value="completed">{lang === "ar" ? "مكتمل" : "Completed"}</TabsTrigger>
            <TabsTrigger value="reviews">{lang === "ar" ? "التقييمات" : "Reviews"}</TabsTrigger>
          </TabsList>
          {tab !== "reviews" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={lang === "ar" ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
            </div>
          )}
        </div>

        {/* Hires tabs */}
        {["all", "pending", "active", "completed"].map(tabVal => (
          <TabsContent key={tabVal} value={tabVal} className="mt-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الشركة" : "Company"}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{lang === "ar" ? "المستقل" : "Freelancer"}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{lang === "ar" ? "العنوان" : "Title"}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">{lang === "ar" ? "الميزانية" : "Budget"}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">{lang === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="text-end p-3 text-xs font-medium text-muted-foreground">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {hiresLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border"><td colSpan={7} className="p-3"><div className="h-8 bg-muted rounded animate-pulse" /></td></tr>
                    ))
                  ) : paginatedHires.length === 0 ? (
                    <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <Handshake className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>{lang === "ar" ? "لا توجد طلبات" : "No hire requests found"}</p>
                    </td></tr>
                  ) : paginatedHires.map(hire => {
                    const company = hire.company_profiles as any;
                    const freelancer = hire.profiles as any;
                    return (
                      <tr key={hire.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={company?.logo_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">{getInitials(company?.company_name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate max-w-[120px]">{company?.company_name || "—"}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={freelancer?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-emerald-500/10 text-emerald-600">{getInitials(freelancer?.full_name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">{freelancer?.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell"><span className="text-sm truncate max-w-[150px] block">{hire.title || "—"}</span></td>
                        <td className="p-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground">{hire.budget_range || "—"}</span></td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${statusColors[hire.status] || ""}`}>{hire.status}</Badge>
                        </td>
                        <td className="p-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground">{new Date(hire.created_at).toLocaleDateString()}</span></td>
                        <td className="p-3 text-end">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setStatusChangeDialog({ id: hire.id, current: hire.status }); setNewStatus(hire.status); }}>
                            {lang === "ar" ? "تغيير" : "Change"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hireTotalPages > 1 && (
                <div className="p-3 border-t border-border">
                  <PaginationControls page={hirePage} totalPages={hireTotalPages} onPageChange={setHirePage} />
                </div>
              )}
            </div>
          </TabsContent>
        ))}

        {/* Reviews tab */}
        <TabsContent value="reviews" className="mt-4 space-y-3">
          {(frLoading || crLoading) ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : allReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>{lang === "ar" ? "لا توجد تقييمات" : "No reviews yet"}</p>
            </div>
          ) : (
            <>
              {paginatedReviews.map(review => (
                <div key={review.id} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{review.reviewerLabel}</Badge>
                        <span className="text-sm font-medium">{review.targetName}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ms-2">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      {review.title && <p className="text-sm font-medium mt-2">{review.title}</p>}
                      {review.review && <p className="text-sm text-muted-foreground mt-1">{review.review}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{review.is_approved ? (lang === "ar" ? "معتمد" : "Approved") : (lang === "ar" ? "مخفي" : "Hidden")}</span>
                      <Switch
                        checked={review.is_approved ?? true}
                        onCheckedChange={() => toggleReviewApproval(review.id, review.reviewType, review.is_approved ?? true)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {reviewTotalPages > 1 && (
                <PaginationControls page={reviewPage} totalPages={reviewTotalPages} onPageChange={setReviewPage} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Status change dialog */}
      <Dialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>{lang === "ar" ? "تغيير الحالة" : "Change Status"}</DialogTitle></DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pending", "accepted", "in_progress", "completed", "rejected", "cancelled"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleStatusChange} disabled={newStatus === statusChangeDialog?.current}>{lang === "ar" ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
