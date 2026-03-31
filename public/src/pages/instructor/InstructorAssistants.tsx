/**
 * /instructor/assistants — Assistant Oversight page (website layer).
 * Real data from assistant_invitations, profiles, training_courses, course_questions.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, MessageSquare, Plus, Clock, CheckCircle2, XCircle,
  Send, BookOpen, Eye, EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import InviteAssistantDialog from "@/components/instructor/InviteAssistantDialog";

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label_en: string; label_ar: string }> = {
  pending: { icon: Clock, color: "text-amber-600 bg-amber-500/15", label_en: "Pending", label_ar: "معلقة" },
  accepted: { icon: CheckCircle2, color: "text-green-600 bg-green-500/15", label_en: "Accepted", label_ar: "مقبولة" },
  declined: { icon: XCircle, color: "text-red-600 bg-red-500/15", label_en: "Declined", label_ar: "مرفوضة" },
};

export default function InstructorAssistants() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [tab, setTab] = useState<"assistants" | "invitations">("assistants");
  const [inviteOpen, setInviteOpen] = useState(false);

  /* ── All invitations sent by this instructor ── */
  const { data: invitations = [], isLoading: loadingInv } = useQuery({
    queryKey: ["assistant-invitations", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistant_invitations")
        .select("id, freelancer_id, course_id, status, created_at, role, support_scope, duration, compensation_type, responded_at")
        .eq("instructor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  /* ── Accepted assistants = active assignments ── */
  const acceptedInvitations = invitations.filter((i) => i.status === "accepted");
  
  const freelancerIds = [...new Set(acceptedInvitations.map((i) => i.freelancer_id))];
  const courseIds = [...new Set(invitations.map((i) => i.course_id).filter(Boolean))] as string[];

  /* ── Profiles for all invited freelancers (not just accepted) ── */
  const { data: profiles = [] } = useQuery({
    queryKey: ["assistant-profiles", user?.id],
    enabled: !!user?.id,
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_instructor_assistant_profiles" as any);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  /* ── Course titles ── */
  const { data: courses = [] } = useQuery({
    queryKey: ["assistant-courses", courseIds],
    enabled: courseIds.length > 0,
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar")
        .in("id", courseIds);
      return data ?? [];
    },
  });

  /* ── Build a map of freelancerId → Set of assigned courseIds ── */
  const assistantCourseMap = new Map<string, Set<string>>();
  for (const inv of acceptedInvitations) {
    if (!inv.course_id) continue;
    const set = assistantCourseMap.get(inv.freelancer_id) ?? new Set();
    set.add(inv.course_id);
    assistantCourseMap.set(inv.freelancer_id, set);
  }

  /* ── Q&A activity signals per assistant (scoped to assigned courses only) ── */
  const { data: activityCounts = {} } = useQuery({
    queryKey: ["assistant-activity", user?.id, freelancerIds, courseIds],
    enabled: freelancerIds.length > 0 && courseIds.length > 0 && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      // Only fetch answers on courses this instructor's assistants are assigned to
      const { data } = await supabase
        .from("course_questions")
        .select("answered_by, id, updated_at, is_visible_to_class, course_id")
        .in("answered_by", freelancerIds)
        .in("course_id", courseIds)
        .not("answer_text", "is", null);
      if (!data) return {};
      const counts: Record<string, { total: number; visible: number; lastActive: string | null }> = {};
      for (const q of data) {
        if (!q.answered_by) continue;
        // Only count if this specific assistant is assigned to this course
        const assignedCourses = assistantCourseMap.get(q.answered_by);
        if (!assignedCourses || !assignedCourses.has(q.course_id)) continue;
        if (!counts[q.answered_by]) counts[q.answered_by] = { total: 0, visible: 0, lastActive: null };
        counts[q.answered_by].total++;
        if (q.is_visible_to_class) counts[q.answered_by].visible++;
        if (!counts[q.answered_by].lastActive || q.updated_at > counts[q.answered_by].lastActive!) {
          counts[q.answered_by].lastActive = q.updated_at;
        }
      }
      return counts;
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  /* ── Build assistant cards from accepted invitations grouped by freelancer ── */
  const assistantMap = new Map<string, typeof acceptedInvitations>();
  for (const inv of acceptedInvitations) {
    const list = assistantMap.get(inv.freelancer_id) ?? [];
    list.push(inv);
    assistantMap.set(inv.freelancer_id, list);
  }

  const tabs = [
    { key: "assistants" as const, label: isAr ? "المساعدون" : "Assistants", badge: assistantMap.size },
    { key: "invitations" as const, label: isAr ? "الدعوات" : "Invitations", badge: pendingCount || undefined },
  ];

  function formatRelative(dateStr: string | null) {
    if (!dateStr) return isAr ? "غير معروف" : "Unknown";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isAr ? `${mins} دقيقة` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isAr ? `${hrs} ساعة` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isAr ? `${days} يوم` : `${days}d ago`;
  }

  const isLoading = loadingInv;

  return (
    <div className="pt-24 pb-20">
      <SEO title={isAr ? "إشراف المساعدين | DevWady" : "Assistant Oversight | DevWady"} />
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {isAr ? "إشراف المساعدين" : "Assistant Oversight"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "تابع المساعدين التقنيين ودعواتك المرسلة"
                : "Track your technical assistants and sent invitations"}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "دعوة مساعد" : "Invite Assistant"}
          </Button>
        </div>

        {/* Summary strip */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
          {[
            { icon: Users, value: assistantMap.size, label: isAr ? "مساعدون نشطون" : "Active Assistants" },
            { icon: BookOpen, value: new Set(acceptedInvitations.map((i) => i.course_id).filter(Boolean)).size, label: isAr ? "دورات مغطاة" : "Courses Covered" },
            { icon: Send, value: invitations.length, label: isAr ? "إجمالي الدعوات" : "Total Invitations" },
            { icon: Clock, value: pendingCount, label: isAr ? "دعوات معلقة" : "Pending", highlight: pendingCount > 0 },
          ].map((stat, i) => (
            <div key={i} className={`p-3 rounded-xl border bg-card ${stat.highlight ? "border-amber-500/30" : "border-border/60"}`}>
              <stat.icon className={`h-3.5 w-3.5 mb-1 ${stat.highlight ? "text-amber-500" : "text-muted-foreground"}`} />
              <p className={`text-lg font-bold ${stat.highlight ? "text-amber-600" : "text-foreground"}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 mb-6">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs gap-1.5"
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.badge ? (
                <span className="min-w-[16px] h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {t.badge}
                </span>
              ) : null}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : tab === "assistants" ? (
          /* ── ASSISTANTS TAB ── */
          assistantMap.size === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isAr ? "لا يوجد مساعدون نشطون بعد" : "No active assistants yet"}
              </p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                {isAr
                  ? "أرسل دعوة لمستقل ليصبح مساعداً تقنياً في دوراتك"
                  : "Invite a freelancer to become a technical assistant for your courses"}
              </p>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {isAr ? "دعوة مساعد" : "Invite Assistant"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(assistantMap.entries()).map(([freelancerId, assignments]) => {
                const profile = profileMap[freelancerId];
                const name = profile?.full_name || (isAr ? "مساعد" : "Assistant");
                const initial = name[0]?.toUpperCase() ?? "?";
                const activity = (activityCounts as Record<string, { total: number; visible: number; lastActive: string | null }>)[freelancerId];

                return (
                  <div key={freelancerId} className="rounded-xl border border-border/60 bg-card p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {initial}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {isAr ? `${assignments.length} تكليف` : `${assignments.length} assignment${assignments.length > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px]">
                        {isAr ? "نشط" : "Active"}
                      </Badge>
                    </div>

                    {/* Assigned courses */}
                    <div className="mb-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                        {isAr ? "الدورات المسندة" : "Assigned Courses"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {assignments.map((a) => {
                          const course = a.course_id ? courseMap[a.course_id] : null;
                          const title = course ? (isAr ? course.title_ar || course.title_en : course.title_en) : (isAr ? "دورة" : "Course");
                          return (
                            <span key={a.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              <BookOpen className="h-2.5 w-2.5" />
                              {title}
                              {a.role !== "assistant" && (
                                <span className="text-foreground font-medium">({a.role})</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Activity signals */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{activity?.total ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "إجابات" : "Answers"}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {(activity?.visible ?? 0) > 0 ? (
                            <Eye className="h-3 w-3 text-green-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-foreground">{activity?.visible ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "مرئية للطلاب" : "Visible to Class"}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium text-foreground">
                          {activity?.lastActive ? formatRelative(activity.lastActive) : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "آخر نشاط" : "Last Active"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add CTA */}
              <button
                onClick={() => setInviteOpen(true)}
                className="w-full p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 hover:border-primary/20 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                {isAr ? "دعوة مساعد تقني جديد" : "Invite New Technical Assistant"}
              </button>
            </div>
          )
        ) : (
          /* ── INVITATIONS TAB ── */
          <div className="space-y-3">
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <Send className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {isAr ? "لم ترسل أي دعوات بعد" : "No invitations sent yet"}
                </p>
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isAr ? "دعوة مساعد" : "Invite Assistant"}
                </Button>
              </div>
            ) : (
              invitations.map((inv) => {
                const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = st.icon;
                const profile = profileMap[inv.freelancer_id];
                const name = profile?.full_name || (isAr ? "مستقل" : "Freelancer");
                const course = inv.course_id ? courseMap[inv.course_id] : null;
                const courseTitle = course ? (isAr ? course.title_ar || course.title_en : course.title_en) : "";

                return (
                  <div key={inv.id} className="p-4 rounded-xl border border-border/60 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {name[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {courseTitle && <>{courseTitle} · </>}
                            {new Date(inv.created_at).toLocaleDateString()}
                            {inv.support_scope && <> · {inv.support_scope}</>}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${st.color} border-0 text-[10px] gap-1`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {isAr ? st.label_ar : st.label_en}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <InviteAssistantDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
