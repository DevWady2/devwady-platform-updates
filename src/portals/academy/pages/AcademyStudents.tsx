/**
 * Academy — Instructor Students list (across all courses).
 * Enhanced with talent indicators, recommendation/nomination actions,
 * readiness snapshot capture, and derived talent signals.
 *
 * LP-10A: Row status chips and dialog course options are course-scoped.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, BookOpen, MoreVertical, Star, Award, ShieldOff, Globe } from "lucide-react";
import { ENROLLMENT_STATUS_COLORS, formatStatus } from "../constants";
import { useInstructorCourses } from "../hooks/useInstructorCourses";
import { useStudentTalentSignals, TALENT_SIGNAL_LABELS, TALENT_SIGNAL_COLORS } from "../hooks/useStudentTalentSignals";
import StudentTalentBadges from "@/components/academy/StudentTalentBadges";
import StudentOpportunityFitBadge from "@/components/academy/StudentOpportunityFitBadge";
import RecommendationDialog from "@/components/academy/RecommendationDialog";
import NominationDialog from "@/components/academy/NominationDialog";
import {
  useInstructorRecommendations,
  useInstructorNominations,
} from "@/features/academy/talentBridge/hooks";
import {
  NOMINATION_STATUS_LABELS,
  NOMINATION_STATUS_COLORS,
} from "@/features/academy/talentBridge/nominations";

type TabValue = "all" | "active" | "completed" | "talent_opted_in" | "nominatable";

interface DialogTarget {
  userId: string;
  name: string;
  allowsNomination: boolean;
  /** Courses shared between the instructor and this student */
  sharedCourses: { id: string; title_en: string; title_ar?: string | null }[];
}

export default function AcademyStudents() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabValue>("all");

  // Dialog state
  const [recTarget, setRecTarget] = useState<DialogTarget | null>(null);
  const [nomTarget, setNomTarget] = useState<DialogTarget | null>(null);

  const { data: courses = [] } = useInstructorCourses();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["academy-instructor-students", courses.map(c => c.id)],
    enabled: courses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("id, course_id, status, enrolled_at, user_id")
        .in("course_id", courses.map(c => c.id))
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const studentIds = [...new Set(enrollments.map(e => e.user_id))];

  const courseIds = courses.map((c: any) => c.id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["academy-student-profiles", courseIds],
    enabled: courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_course_student_profiles" as any, { p_course_ids: courseIds });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  // Talent bridge data (now includes derived signals + readiness snapshots)
  const talentMap = useStudentTalentSignals(studentIds);

  // Instructor's existing recs/noms for status display
  const { data: myRecs = [] } = useInstructorRecommendations(user?.id);
  const { data: myNoms = [] } = useInstructorNominations(user?.id);

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  /** Get recs scoped to a specific course, plus general (null-course) recs */
  const getRowRecs = (userId: string, courseId: string) =>
    myRecs.filter(r => r.student_user_id === userId && (r.course_id === courseId || r.course_id === null));

  /** Get noms scoped to a specific course, plus general (null-course) noms */
  const getRowNoms = (userId: string, courseId: string) =>
    myNoms.filter(n => n.student_user_id === userId && (n.course_id === courseId || n.course_id === null));

  /** Build shared-course list for a given student */
  const studentCourseMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of enrollments) {
      if (!map.has(e.user_id)) map.set(e.user_id, new Set());
      map.get(e.user_id)!.add(e.course_id);
    }
    return map;
  }, [enrollments]);

  const getSharedCourses = (userId: string) => {
    const ids = studentCourseMap.get(userId);
    if (!ids) return [];
    return courses
      .filter(c => ids.has(c.id))
      .map(c => ({ id: c.id, title_en: c.title_en, title_ar: c.title_ar }));
  };

  const talentOptedInCount = studentIds.filter(id => talentMap.get(id)?.hasProfile).length;
  const nominatableCount = studentIds.filter(id => talentMap.get(id)?.allowNomination).length;

  const filtered = enrollments
    .filter(e => {
      if (tab === "all") return true;
      if (tab === "active") return e.status === "active";
      if (tab === "completed") return e.status === "completed";
      if (tab === "talent_opted_in") return talentMap.get(e.user_id)?.hasProfile;
      if (tab === "nominatable") return talentMap.get(e.user_id)?.allowNomination;
      return true;
    })
    .filter(e => {
      if (!search.params.query) return true;
      const q = search.params.query.toLowerCase();
      const name = getProfile(e.user_id)?.full_name ?? "";
      return name.toLowerCase().includes(q);
    });

  const getCourseTitle = (courseId: string) => {
    const c = courses.find(c => c.id === courseId);
    return isAr ? c?.title_ar : c?.title_en ?? "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Students"
        title_ar="طلابي"
        description_en="Students enrolled in your courses"
        description_ar="الطلاب المسجلون في دوراتك"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="active">{isAr ? "نشط" : "Active"}</TabsTrigger>
          <TabsTrigger value="completed">{isAr ? "مكتمل" : "Completed"}</TabsTrigger>
          {talentOptedInCount > 0 && (
            <TabsTrigger value="talent_opted_in">
              {isAr ? "ملف مهني" : "Talent Profile"} ({talentOptedInCount})
            </TabsTrigger>
          )}
          {nominatableCount > 0 && (
            <TabsTrigger value="nominatable">
              {isAr ? "قابل للترشيح" : "Nominatable"} ({nominatableCount})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search students..."
        placeholder_ar="بحث عن طلاب..."
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title_en="No students found"
          title_ar="لا يوجد طلاب"
          description_en="Students will appear here when they enroll in your courses"
          description_ar="سيظهر الطلاب عند تسجيلهم في دوراتك"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const profile = getProfile(e.user_id);
            const talent = talentMap.get(e.user_id);
            const rowRecs = getRowRecs(e.user_id, e.course_id);
            const rowNoms = getRowNoms(e.user_id, e.course_id);
            const studentName = profile?.full_name ?? "Student";

            return (
              <Card key={e.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {studentName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{studentName}</p>
                      <StudentTalentBadges data={talent} compact />
                      <StudentOpportunityFitBadge talentData={talent} />
                      {/* Derived talent signal badge — suppressed for private students */}
                      {talent?.signal && talent.signal !== "not_ready_yet" && talent.visibility !== "private" && (
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${TALENT_SIGNAL_COLORS[talent.signal]}`}>
                          {isAr ? TALENT_SIGNAL_LABELS[talent.signal].ar : TALENT_SIGNAL_LABELS[talent.signal].en}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />{getCourseTitle(e.course_id)}
                    </p>
                    {/* Row-scoped rec/nom status chips */}
                    {(rowRecs.length > 0 || rowNoms.length > 0) && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {rowRecs.map(r => (
                          <Badge key={r.id} variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            {r.course_id === null && <Globe className="h-2 w-2 mr-0.5 opacity-60" />}
                            {r.status === "draft" ? (isAr ? "مسودة" : "Draft") : (isAr ? "نشط" : "Active")}
                          </Badge>
                        ))}
                        {rowNoms.map(n => (
                          <Badge
                            key={n.id}
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 h-4 ${NOMINATION_STATUS_COLORS[n.status as keyof typeof NOMINATION_STATUS_COLORS] ?? ""}`}
                          >
                            <Award className="h-2.5 w-2.5 mr-0.5" />
                            {n.course_id === null && <Globe className="h-2 w-2 mr-0.5 opacity-60" />}
                            {isAr
                              ? NOMINATION_STATUS_LABELS[n.status as keyof typeof NOMINATION_STATUS_LABELS]?.ar ?? n.status
                              : NOMINATION_STATUS_LABELS[n.status as keyof typeof NOMINATION_STATUS_LABELS]?.en ?? n.status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className={`text-[10px] ${ENROLLMENT_STATUS_COLORS[e.status] ?? ""}`}>
                        {formatStatus(e.status)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setRecTarget({
                            userId: e.user_id,
                            name: studentName,
                            allowsNomination: talent?.allowNomination ?? false,
                            sharedCourses: getSharedCourses(e.user_id),
                          })}
                          className="text-xs gap-2"
                        >
                          <Star className="h-3.5 w-3.5" />
                          {isAr ? "إضافة توصية" : "Recommend"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setNomTarget({
                            userId: e.user_id,
                            name: studentName,
                            allowsNomination: talent?.allowNomination ?? false,
                            sharedCourses: getSharedCourses(e.user_id),
                          })}
                          className="text-xs gap-2"
                          disabled={talent?.hasProfile === true && !talent.allowNomination}
                        >
                          {talent?.hasProfile && !talent.allowNomination ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{isAr ? "الترشيح مغلق" : "Nomination Blocked"}</span>
                            </>
                          ) : (
                            <>
                              <Award className="h-3.5 w-3.5" />
                              {isAr ? "ترشيح" : "Nominate"}
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recommendation Dialog — course options scoped to shared courses */}
      {recTarget && (
        <RecommendationDialog
          open={!!recTarget}
          onOpenChange={(open) => { if (!open) setRecTarget(null); }}
          studentUserId={recTarget.userId}
          studentName={recTarget.name}
          courses={recTarget.sharedCourses}
          readinessSnapshot={talentMap.get(recTarget.userId)?.readinessSnapshot ?? null}
          talentSignal={talentMap.get(recTarget.userId)?.signal ?? null}
        />
      )}

      {/* Nomination Dialog — course options scoped to shared courses */}
      {nomTarget && (
        <NominationDialog
          open={!!nomTarget}
          onOpenChange={(open) => { if (!open) setNomTarget(null); }}
          studentUserId={nomTarget.userId}
          studentName={nomTarget.name}
          allowsNomination={nomTarget.allowsNomination}
          visibilityState={talentMap.get(nomTarget.userId)?.visibility ?? null}
          hasProfile={talentMap.get(nomTarget.userId)?.hasProfile ?? false}
          courses={nomTarget.sharedCourses}
        />
      )}
    </div>
  );
}
