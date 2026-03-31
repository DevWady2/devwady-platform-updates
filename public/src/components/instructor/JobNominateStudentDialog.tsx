/**
 * JobNominateStudentDialog — Real backend-driven dialog for nominating
 * a single student for a specific job opportunity from the Instructor Jobs page.
 *
 * Two-phase UI: student selection → nomination form.
 * Uses Talent Bridge signals, opportunity matching, and real nomination persistence.
 */
import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserCheck, Send, Search, BookOpen, ShieldAlert, Star, CheckCircle2,
  AlertTriangle, Lock, Info, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useInstructorCourses } from "@/portals/academy/hooks/useInstructorCourses";
import {
  useStudentTalentSignals,
  TALENT_SIGNAL_LABELS, TALENT_SIGNAL_COLORS,
} from "@/portals/academy/hooks/useStudentTalentSignals";
import {
  matchStudentToOpportunity,
  type OpportunityRecord,
  type StudentMatchProfile,
} from "@/features/academy/talentBridge/opportunityMatching";
import {
  useCreateNomination,
  NOMINATION_SCOPE_LABELS,
  NOMINATION_SCOPE_DESCRIPTIONS,
  NOMINATION_SCOPES,
  type NominationScope,
} from "@/features/academy/talentBridge";
import { isNominationEligible } from "@/features/academy/talentBridge/visibility";
import type { TalentVisibility } from "@/features/academy/talentBridge/visibility";

// ── Types ────────────────────────────────────────────────────

interface JobRecord {
  id: string;
  /** job_postings uses `title`; accepts `title_en` as fallback for legacy callers */
  title: string;
  title_en?: string;
  title_ar?: string | null;
  type?: string;
  type_en?: string;
  type_ar?: string | null;
  location?: string | null;
  location_en?: string | null;
  location_ar?: string | null;
  tags?: string[] | null;
  is_urgent?: boolean;
}

interface JobNominateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobRecord | null;
}

type StudentState = "already_nominated" | "best_match" | "eligible" | "not_ready" | "blocked";

interface EnrichedStudent {
  userId: string;
  name: string;
  courseIds: string[];
  state: StudentState;
  blockReason?: string;
  alignmentScore: number;
  meetsMinimumReadiness: boolean;
  matchReasons: string[];
  signal: string | null;
  allowOpportunityMatching: boolean;
}

const STATE_ORDER: Record<StudentState, number> = {
  best_match: 0, eligible: 1, not_ready: 2, blocked: 3, already_nominated: 4,
};

const FILTER_TABS: { value: string; labelEn: string; labelAr: string }[] = [
  { value: "all", labelEn: "All", labelAr: "الكل" },
  { value: "best_match", labelEn: "Best Match", labelAr: "الأفضل" },
  { value: "eligible", labelEn: "Eligible", labelAr: "مؤهل" },
  { value: "not_ready", labelEn: "Not Ready", labelAr: "غير جاهز" },
  { value: "blocked", labelEn: "Blocked", labelAr: "محظور" },
];

// ── Component ────────────────────────────────────────────────

export default function JobNominateStudentDialog({
  open,
  onOpenChange,
  job,
}: JobNominateStudentDialogProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  // Phase state
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudent | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Nomination form state
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState<NominationScope>("role_specific");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const createNomination = useCreateNomination();

  // ── Data pipeline ────────────────────────────────────────

  // 1. Instructor courses
  const { data: courses = [], isLoading: coursesLoading } = useInstructorCourses();
  const courseIds = useMemo(() => courses.map(c => c.id), [courses]);
  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);

  // 2. Course enrollments (all statuses — includes graduated)
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["job-nominate-enrollments", courseIds],
    enabled: courseIds.length > 0 && open,
    staleTime: 3 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("user_id, course_id")
        .in("course_id", courseIds);
      return data ?? [];
    },
  });

  // Deduplicate students, track which courses each belongs to
  const studentCourseMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of enrollments) {
      if (e.user_id === user?.id) continue; // exclude self
      const existing = map.get(e.user_id) ?? [];
      if (!existing.includes(e.course_id)) existing.push(e.course_id);
      map.set(e.user_id, existing);
    }
    return map;
  }, [enrollments, user?.id]);

  const studentIds = useMemo(() => [...studentCourseMap.keys()], [studentCourseMap]);

  // 3. Profiles (via relationship-scoped RPC)
  const { data: profiles = [] } = useQuery({
    queryKey: ["job-nominate-profiles", courseIds],
    enabled: courseIds.length > 0 && open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_course_student_profiles", {
        p_course_ids: courseIds,
      });
      return (data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null }[];
    },
  });
  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, { ...p, track: null as string | null }])), [profiles]);

  // 4. Talent signals (includes talent profile data)
  const talentMap = useStudentTalentSignals(open ? studentIds : []);

  // 5. Already-nominated detection for this job
  const { data: existingNominations = [] } = useQuery({
    queryKey: ["job-nominate-existing", job?.id, user?.id],
    enabled: !!job?.id && !!user?.id && open,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_nominations")
        .select("student_user_id, status")
        .eq("linked_job_id", job!.id)
        .eq("nominated_by", user!.id);
      return data ?? [];
    },
  });

  const alreadyNominatedSet = useMemo(() => {
    const set = new Set<string>();
    for (const n of existingNominations) {
      if (n.status !== "withdrawn" && n.status !== "declined") {
        set.add(n.student_user_id);
      }
    }
    return set;
  }, [existingNominations]);

  // 6. Cohort memberships for selected student
  const { data: cohortMemberships = [] } = useQuery({
    queryKey: ["job-nominate-cohorts", selectedStudent?.userId, selectedCourseId],
    enabled: !!selectedStudent && !!selectedCourseId && open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Get cohorts for the selected course, then check membership
      const { data: cohorts } = await supabase
        .from("course_cohorts")
        .select("id")
        .eq("course_id", selectedCourseId);
      if (!cohorts || cohorts.length === 0) return [];

      const cohortIds = cohorts.map(c => c.id);
      const { data: memberships } = await supabase
        .from("cohort_memberships")
        .select("cohort_id")
        .eq("user_id", selectedStudent!.userId)
        .in("cohort_id", cohortIds);
      return memberships ?? [];
    },
  });

  // ── Build opportunity record ─────────────────────────────

  const opportunityRecord: OpportunityRecord | null = useMemo(() => {
    if (!job) return null;
    return {
      id: job.id,
      title: job.title ?? job.title_en ?? "",
      type: job.type ?? job.type_en ?? "",
      tags: job.tags ?? [],
      requirements: [],
      location: job.location ?? job.location_en ?? null,
    };
  }, [job]);

  // ── Enrich students ──────────────────────────────────────

  const enrichedStudents: EnrichedStudent[] = useMemo(() => {
    if (!opportunityRecord) return [];

    return studentIds.map(uid => {
      const profile = profileMap.get(uid);
      const talent = talentMap.get(uid);
      const studentCourses = studentCourseMap.get(uid) ?? [];
      const name = profile?.full_name ?? (isAr ? "طالب" : "Student");

      // Check already nominated
      if (alreadyNominatedSet.has(uid)) {
        return {
          userId: uid, name, courseIds: studentCourses,
          state: "already_nominated" as StudentState,
          blockReason: isAr ? "تم ترشيحه لهذه الفرصة بالفعل" : "Already nominated for this job",
          alignmentScore: 0, meetsMinimumReadiness: false, matchReasons: [],
          signal: talent?.signal ?? null, allowOpportunityMatching: false,
        };
      }

      // Check blocked reasons
      if (!talent?.hasProfile) {
        return {
          userId: uid, name, courseIds: studentCourses,
          state: "blocked" as StudentState,
          blockReason: isAr ? "لا يوجد ملف مواهب" : "No talent profile created",
          alignmentScore: 0, meetsMinimumReadiness: false, matchReasons: [],
          signal: null, allowOpportunityMatching: false,
        };
      }

      if (talent.visibility === "private" || !isNominationEligible((talent.visibility ?? "private") as TalentVisibility)) {
        return {
          userId: uid, name, courseIds: studentCourses,
          state: "blocked" as StudentState,
          blockReason: isAr ? "الملف خاص" : "Profile is private",
          alignmentScore: 0, meetsMinimumReadiness: false, matchReasons: [],
          signal: talent.signal, allowOpportunityMatching: false,
        };
      }

      if (!talent.allowNomination) {
        return {
          userId: uid, name, courseIds: studentCourses,
          state: "blocked" as StudentState,
          blockReason: isAr ? "الترشيح معطّل" : "Nominations disabled by student",
          alignmentScore: 0, meetsMinimumReadiness: false, matchReasons: [],
          signal: talent.signal, allowOpportunityMatching: false,
        };
      }

      // Compute match
      const studentMatch: StudentMatchProfile = {
        primaryTrack: profile?.track ?? null,
        specializationTags: [],
        talentSignal: talent.signal as any,
        hasRecommendation: talent.recommendationCount > 0,
        nominationCount: talent.nominationCount,
        availabilityStatus: null,
      };

      const match = matchStudentToOpportunity(studentMatch, opportunityRecord);

      // Classify
      let state: StudentState;
      if (!match.meetsMinimumReadiness) {
        state = "not_ready";
      } else if (match.alignmentScore >= 50) {
        state = "best_match";
      } else {
        state = "eligible";
      }

      return {
        userId: uid, name, courseIds: studentCourses,
        state, alignmentScore: match.alignmentScore,
        meetsMinimumReadiness: match.meetsMinimumReadiness,
        matchReasons: match.matchReasons,
        signal: talent.signal,
        allowOpportunityMatching: talent?.allowOpportunityMatching ?? true,
      };
    }).sort((a, b) => {
      const stateSort = STATE_ORDER[a.state] - STATE_ORDER[b.state];
      if (stateSort !== 0) return stateSort;
      return b.alignmentScore - a.alignmentScore;
    });
  }, [studentIds, profileMap, talentMap, studentCourseMap, alreadyNominatedSet, opportunityRecord, isAr]);

  // ── Filtering ────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = enrichedStudents;
    if (filter !== "all") {
      list = list.filter(s => s.state === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [enrichedStudents, filter, search]);

  // ── Course auto-selection ────────────────────────────────

  const autoSelectCourse = (student: EnrichedStudent) => {
    if (student.courseIds.length <= 1) {
      setSelectedCourseId(student.courseIds[0] ?? "");
      return;
    }

    // Deterministic fallback: first course alphabetically by title
    const sorted = [...student.courseIds]
      .map(id => ({ id, title: courseMap.get(id)?.title_en ?? "" }))
      .sort((a, b) => a.title.localeCompare(b.title));
    setSelectedCourseId(sorted[0]?.id ?? student.courseIds[0]);
  };

  // ── Handlers ─────────────────────────────────────────────

  const handleSelectStudent = (student: EnrichedStudent) => {
    if (student.state === "already_nominated" || student.state === "blocked") return;
    setSelectedStudent(student);
    setReason("");
    setScope("role_specific");
    autoSelectCourse(student);
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setReason("");
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setReason("");
    setSearch("");
    setFilter("all");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !user || !reason.trim()) return;
    setSubmitting(true);

    const derivedCohortId = cohortMemberships.length > 0
      ? cohortMemberships[0].cohort_id
      : undefined;

    try {
      await createNomination.mutateAsync({
        student_user_id: selectedStudent.userId,
        nominated_by: user.id,
        nomination_scope: scope,
        nomination_reason: reason.trim(),
        course_id: selectedCourseId || undefined,
        cohort_id: derivedCohortId,
        linked_job_id: job?.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

      toast.success(
        isAr
          ? `تم ترشيح ${selectedStudent.name} بنجاح`
          : `${selectedStudent.name} nominated successfully`
      );
      handleClose();
    } catch (err) {
      toast.error(isAr ? "حدث خطأ أثناء الترشيح" : "Failed to submit nomination");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty states ─────────────────────────────────────────

  const isLoading = coursesLoading || enrollmentsLoading;

  const getEmptyMessage = (): { icon: React.ReactNode; text: string } => {
    if (courses.length === 0) {
      return {
        icon: <BookOpen className="h-8 w-8 text-muted-foreground/30" />,
        text: isAr ? "ليس لديك دورات بعد. أنشئ دورة لبدء التدريس." : "You have no courses yet. Create a course to start teaching.",
      };
    }
    if (studentIds.length === 0) {
      return {
        icon: <UserCheck className="h-8 w-8 text-muted-foreground/30" />,
        text: isAr ? "لا يوجد طلاب مسجلون في دوراتك بعد." : "No students are enrolled in your courses yet.",
      };
    }
    if (enrichedStudents.length > 0 && enrichedStudents.every(s => s.state === "blocked" || s.state === "already_nominated")) {
      return {
        icon: <Lock className="h-8 w-8 text-muted-foreground/30" />,
        text: isAr ? "لم يفعّل أي من طلابك الترشيحات في ملفهم." : "None of your students have enabled nominations in their talent profile.",
      };
    }
    return {
      icon: <Search className="h-8 w-8 text-muted-foreground/30" />,
      text: isAr ? "لا يوجد طلاب يطابقون بحثك أو الفلتر الحالي." : "No students match your current filter or search.",
    };
  };

  // ── Render helpers ───────────────────────────────────────

  const stateIcon = (state: StudentState) => {
    switch (state) {
      case "best_match": return <Star className="h-3.5 w-3.5 text-amber-500" />;
      case "eligible": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "not_ready": return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
      case "blocked": return <Lock className="h-3.5 w-3.5 text-destructive/60" />;
      case "already_nominated": return <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const stateLabel = (state: StudentState) => {
    const labels: Record<StudentState, { en: string; ar: string }> = {
      best_match: { en: "Best Match", ar: "الأفضل" },
      eligible: { en: "Eligible", ar: "مؤهل" },
      not_ready: { en: "Not Ready", ar: "غير جاهز" },
      blocked: { en: "Blocked", ar: "محظور" },
      already_nominated: { en: "Already Nominated", ar: "مرشّح بالفعل" },
    };
    return isAr ? labels[state].ar : labels[state].en;
  };

  const jobTitle = job
    ? isAr ? (job.title_ar || job.title || job.title_en || "") : (job.title || job.title_en || "")
    : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            {isAr ? "ترشيح طالب" : "Nominate Student"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? `ترشيح لفرصة: ${jobTitle}` : `Nominating for: ${jobTitle}`}
          </p>
        </DialogHeader>

        {/* Phase 1: Student selection */}
        {!selectedStudent && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث بالاسم..." : "Search by name..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-8 text-sm"
              />
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="h-8 w-full">
                {FILTER_TABS.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs flex-1 h-6">
                    {isAr ? t.labelAr : t.labelEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 max-h-[40vh]">
              {isLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  {getEmptyMessage().icon}
                  <p className="text-sm text-muted-foreground">{getEmptyMessage().text}</p>
                </div>
              ) : (
                filtered.map(student => {
                  const isSelectable = student.state !== "blocked" && student.state !== "already_nominated";
                  const courseLabel = student.courseIds.length === 1
                    ? courseMap.get(student.courseIds[0])?.title_en ?? ""
                    : `${student.courseIds.length} ${isAr ? "دورات" : "courses"}`;

                  return (
                    <button
                      key={student.userId}
                      disabled={!isSelectable}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-start p-3 rounded-lg border transition-colors ${
                        isSelectable
                          ? "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
                          : "border-border/30 bg-muted/20 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                            <span className="flex items-center gap-1 text-[10px]">
                              {stateIcon(student.state)}
                              <span className="text-muted-foreground">{stateLabel(student.state)}</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{courseLabel}</p>
                          {student.blockReason && (
                            <p className="text-[10px] text-destructive/70 mt-0.5">{student.blockReason}</p>
                          )}
                          {!student.allowOpportunityMatching && student.state !== "blocked" && student.state !== "already_nominated" && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5">
                              <Info className="h-2.5 w-2.5" />
                              {isAr ? "مطابقة الفرص معطّلة" : "Opportunity matching disabled"}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {student.signal && (
                            <Badge className={`text-[9px] px-1.5 py-0 ${TALENT_SIGNAL_COLORS[student.signal as keyof typeof TALENT_SIGNAL_COLORS] ?? "bg-muted text-muted-foreground"}`}>
                              {isAr
                                ? TALENT_SIGNAL_LABELS[student.signal as keyof typeof TALENT_SIGNAL_LABELS]?.ar
                                : TALENT_SIGNAL_LABELS[student.signal as keyof typeof TALENT_SIGNAL_LABELS]?.en
                              }
                            </Badge>
                          )}
                          {student.meetsMinimumReadiness && (
                            <span className="text-[10px] text-muted-foreground">{student.alignmentScore}%</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Phase 2: Nomination form */}
        {selectedStudent && (
          <div className="space-y-4 flex-1">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              {isAr ? "رجوع" : "Back to list"}
            </button>

            {/* Selected student card */}
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{selectedStudent.name}</p>
                {selectedStudent.signal && (
                  <Badge className={`text-[9px] px-1.5 py-0 ${TALENT_SIGNAL_COLORS[selectedStudent.signal as keyof typeof TALENT_SIGNAL_COLORS] ?? ""}`}>
                    {isAr
                      ? TALENT_SIGNAL_LABELS[selectedStudent.signal as keyof typeof TALENT_SIGNAL_LABELS]?.ar
                      : TALENT_SIGNAL_LABELS[selectedStudent.signal as keyof typeof TALENT_SIGNAL_LABELS]?.en
                    }
                  </Badge>
                )}
                {selectedStudent.meetsMinimumReadiness && (
                  <span className="text-xs text-muted-foreground">{selectedStudent.alignmentScore}% {isAr ? "تطابق" : "fit"}</span>
                )}
              </div>
            </div>

            {/* Reason (required) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {isAr ? "سبب الترشيح *" : "Nomination reason *"}
              </label>
              <Textarea
                placeholder={isAr ? "لماذا ترشّح هذا الطالب لهذه الفرصة؟" : "Why are you nominating this student for this opportunity?"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[70px] text-sm"
              />
            </div>

            {/* Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {isAr ? "نطاق الترشيح" : "Nomination scope"}
              </label>
              <Select value={scope} onValueChange={(v) => setScope(v as NominationScope)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOMINATION_SCOPES.map(s => (
                    <SelectItem key={s} value={s} className="text-sm">
                      <span>{isAr ? NOMINATION_SCOPE_LABELS[s].ar : NOMINATION_SCOPE_LABELS[s].en}</span>
                      <span className="text-[10px] text-muted-foreground ms-1">
                        — {isAr ? NOMINATION_SCOPE_DESCRIPTIONS[s].ar : NOMINATION_SCOPE_DESCRIPTIONS[s].en}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course selector */}
            {selectedStudent.courseIds.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {isAr ? "الدورة المرتبطة" : "Related course"}
                </label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedStudent.courseIds.map(cid => (
                      <SelectItem key={cid} value={cid} className="text-sm">
                        {courseMap.get(cid)?.title_en ?? cid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          {selectedStudent && (
            <Button
              size="sm"
              disabled={!reason.trim() || submitting}
              onClick={handleSubmit}
            >
              <Send className="h-3.5 w-3.5" />
              {submitting
                ? (isAr ? "جارٍ الإرسال..." : "Submitting...")
                : (isAr ? "إرسال الترشيح" : "Submit Nomination")
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
