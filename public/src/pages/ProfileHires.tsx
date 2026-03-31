import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Send, CheckCircle2, XCircle, Clock, Briefcase, Play,
  Flag, MapPin, Globe, DollarSign, Timer,
  Loader2, Star,
} from "lucide-react";
import ReviewDialog from "@/components/ReviewDialog";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  pending: { label: "Pending", labelAr: "قيد الانتظار", color: "bg-amber-500/15 text-amber-600" },
  accepted: { label: "Accepted", labelAr: "مقبول", color: "bg-green-500/15 text-green-600" },
  in_progress: { label: "In Progress", labelAr: "قيد التنفيذ", color: "bg-primary/15 text-primary" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "bg-emerald-500/15 text-emerald-600" },
  rejected: { label: "Declined", labelAr: "مرفوض", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", color: "bg-destructive/15 text-destructive" },
  expired: { label: "Expired", labelAr: "منتهي", color: "bg-muted text-muted-foreground" },
};

export default function ProfileHires() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [actionDialog, setActionDialog] = useState<{ type: "accept" | "decline" | "start" | "complete"; hireId: string } | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ hireId: string; companyUserId: string; companyName: string } | null>(null);

  // Get user's profile ID
  const { data: profile } = useQuery({
    queryKey: ["my-profile-id", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  // Fetch hire requests
  const { data: hires = [], isLoading } = useQuery({
    queryKey: ["profile-hires", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hire_requests")
        .select("*, company_profiles!hire_requests_company_id_fkey(company_name, logo_url, industry, location, website, slug)")
        .eq("freelancer_profile_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription
  useQuery({
    queryKey: ["hire-requests-realtime", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => {
      const channel = supabase
        .channel("hire-requests-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "hire_requests" }, () => {
          qc.invalidateQueries({ queryKey: ["profile-hires"] });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ hireId, updates }: { hireId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("hire_requests").update(updates).eq("id", hireId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-hires"] });
      setActionDialog(null);
      setResponseMsg("");
      toast.success(isAr ? "تم التحديث بنجاح" : "Updated successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAction = () => {
    if (!actionDialog) return;
    const { type, hireId } = actionDialog;
    const now = new Date().toISOString();
    switch (type) {
      case "accept":
        updateMutation.mutate({ hireId, updates: { status: "accepted", freelancer_response: responseMsg || null, responded_at: now } });
        break;
      case "decline":
        updateMutation.mutate({ hireId, updates: { status: "rejected", freelancer_response: responseMsg || null, responded_at: now } });
        break;
      case "start":
        updateMutation.mutate({ hireId, updates: { status: "in_progress", started_at: now } });
        break;
      case "complete":
        updateMutation.mutate({ hireId, updates: { status: "completed", completed_at: now } });
        break;
    }
  };

  const pendingCount = hires.filter((h: any) => h.status === "pending").length;
  const activeCount = hires.filter((h: any) => ["accepted", "in_progress"].includes(h.status)).length;
  const completedCount = hires.filter((h: any) => h.status === "completed").length;

  const filterHires = (tab: string) => {
    switch (tab) {
      case "pending": return hires.filter((h: any) => h.status === "pending");
      case "active": return hires.filter((h: any) => ["accepted", "in_progress"].includes(h.status));
      case "completed": return hires.filter((h: any) => h.status === "completed");
      case "declined": return hires.filter((h: any) => ["rejected", "cancelled", "expired"].includes(h.status));
      default: return hires;
    }
  };

  const renderCard = (hire: any) => {
    const company = hire.company_profiles;
    const sc = STATUS_CONFIG[hire.status] || STATUS_CONFIG.pending;
    const companyName = company?.company_name || (isAr ? "شركة" : "Company");
    const initials = companyName.slice(0, 2).toUpperCase();

    return (
      <Card key={hire.id} className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {company?.logo_url ? (
            <img loading="lazy" src={company.logo_url} alt={companyName} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{hire.title || (isAr ? `عرض توظيف من ${companyName}` : `Hire offer from ${companyName}`)}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {company?.slug ? (
                <a href={`/companies/${company.slug}`} className="text-sm text-primary hover:underline">{companyName}</a>
              ) : (
                <span className="text-sm text-muted-foreground">{companyName}</span>
              )}
              {company?.industry && <Badge variant="secondary" className="text-xs">{company.industry}</Badge>}
              {company?.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}</span>
              )}
            </div>
          </div>
          <Badge className={`${sc.color} border-0 shrink-0`}>{isAr ? sc.labelAr : sc.label}</Badge>
        </div>

        {/* Message */}
        {hire.message && <p className="text-sm text-muted-foreground leading-relaxed">{hire.message}</p>}

        {/* Details badges */}
        <div className="flex flex-wrap gap-2">
          {hire.budget_range && (
            <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />{hire.budget_range}</Badge>
          )}
          {hire.duration && (
            <Badge variant="outline" className="gap-1"><Timer className="h-3 w-3" />{hire.duration}</Badge>
          )}
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />{formatDistanceToNow(new Date(hire.created_at), { addSuffix: true })}
          </Badge>
        </div>

        {/* Requirements */}
        {hire.requirements && (
          <div className="text-sm">
            <span className="font-medium">{isAr ? "المتطلبات:" : "Requirements:"}</span>
            <p className="text-muted-foreground mt-1">{hire.requirements}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {hire.status === "pending" && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setActionDialog({ type: "accept", hireId: hire.id })}>
                <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "قبول" : "Accept"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "decline", hireId: hire.id })}>
                <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Decline"}
              </Button>
            </>
          )}
          {hire.status === "accepted" && (
            <>
              <Button size="sm" onClick={() => setActionDialog({ type: "start", hireId: hire.id })}>
                <Play className="h-3.5 w-3.5 me-1" />{isAr ? "بدء العمل" : "Mark as Started"}
              </Button>
              {company?.website && (
                <Button size="sm" variant="outline" asChild>
                  <a href={company.website} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5 me-1" />{isAr ? "موقع الشركة" : "Company Website"}</a>
                </Button>
              )}
            </>
          )}
          {hire.status === "in_progress" && (
            <Button size="sm" onClick={() => setActionDialog({ type: "complete", hireId: hire.id })}>
              <Flag className="h-3.5 w-3.5 me-1" />{isAr ? "إتمام العمل" : "Mark as Complete"}
            </Button>
          )}
          {hire.status === "completed" && !hire.is_reviewed_by_freelancer && (
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              onClick={() => setReviewTarget({ hireId: hire.id, companyUserId: company?.id ? (hire as any).company_id : "", companyName: companyName })}>
              <Star className="h-3.5 w-3.5 me-1" />{isAr ? "تقييم الشركة" : "Review Company"}
            </Button>
          )}
          {hire.status === "completed" && hire.is_reviewed_by_freelancer && (
            <Badge variant="outline" className="text-emerald-600"><CheckCircle2 className="h-3 w-3 me-1" />{isAr ? "تم التقييم" : "Reviewed"}</Badge>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <SEO title={isAr ? "عروض التوظيف" : "Hire Offers"} description={isAr ? "إدارة عروض التوظيف الواردة" : "Manage incoming hire offers"} />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />{isAr ? "عروض التوظيف" : "Hire Offers"}
        </h1>
        <p className="text-muted-foreground mt-1">{isAr ? "إدارة عروض التوظيف الواردة من الشركات" : "Manage incoming hire offers from companies"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isAr ? "قيد الانتظار" : "Pending", count: pendingCount, icon: Clock, color: "text-amber-600" },
          { label: isAr ? "نشط" : "Active", count: activeCount, icon: Briefcase, color: "text-primary" },
          { label: isAr ? "مكتمل" : "Completed", count: completedCount, icon: CheckCircle2, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
            <p className="text-2xl font-bold mt-1">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({hires.length})</TabsTrigger>
          <TabsTrigger value="pending">{isAr ? "قيد الانتظار" : "Pending"} ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">{isAr ? "نشط" : "Active"} ({activeCount})</TabsTrigger>
          <TabsTrigger value="completed">{isAr ? "مكتمل" : "Completed"} ({completedCount})</TabsTrigger>
          <TabsTrigger value="declined">{isAr ? "مرفوض" : "Declined"}</TabsTrigger>
        </TabsList>

        {["all", "pending", "active", "completed", "declined"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : filterHires(tab).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{isAr ? "لا توجد عروض توظيف" : "No hire offers yet"}</p>
              </div>
            ) : (
              filterHires(tab).map(renderCard)
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) { setActionDialog(null); setResponseMsg(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "accept" && (isAr ? "قبول العرض" : "Accept Offer")}
              {actionDialog?.type === "decline" && (isAr ? "رفض العرض" : "Decline Offer")}
              {actionDialog?.type === "start" && (isAr ? "بدء العمل" : "Start Work")}
              {actionDialog?.type === "complete" && (isAr ? "إتمام العمل" : "Complete Work")}
            </DialogTitle>
          </DialogHeader>

          {(actionDialog?.type === "accept" || actionDialog?.type === "decline") && (
            <Textarea
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              placeholder={
                actionDialog.type === "accept"
                  ? (isAr ? "أخبر الشركة أنك مهتم..." : "Let the company know you're interested...")
                  : (isAr ? "شارك السبب اختياريًا..." : "Optionally share why...")
              }
              rows={3}
            />
          )}

          {actionDialog?.type === "start" && (
            <p className="text-sm text-muted-foreground">{isAr ? "هل أنت متأكد من بدء العمل على هذا المشروع؟" : "Are you sure you want to mark this as started?"}</p>
          )}
          {actionDialog?.type === "complete" && (
            <p className="text-sm text-muted-foreground">{isAr ? "هل أنت متأكد من إتمام هذا المشروع؟" : "Are you sure you want to mark this as complete?"}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setResponseMsg(""); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateMutation.isPending}
              className={actionDialog?.type === "decline" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? "تأكيد" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <ReviewDialog
        open={!!reviewTarget}
        onOpenChange={(o) => { if (!o) setReviewTarget(null); }}
        type="company"
        targetName={reviewTarget?.companyName || ""}
        hireRequestId={reviewTarget?.hireId || ""}
        targetUserId={reviewTarget?.companyUserId || ""}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ["profile-hires"] }); setReviewTarget(null); }}
      />
    </div>
  );
}
