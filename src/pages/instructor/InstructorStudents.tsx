/**
 * InstructorStudents — course-specific student management page.
 * Enhanced with Talent Bridge indicators, recommendation/nomination actions.
 * Route: /instructor/workspace/courses/:id/students
 */
import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft, Users, CheckCircle2, BarChart3, Clock, Award, AlertCircle, Star, MoreVertical, ShieldOff, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import ExportCSVButton from "@/components/admin/ExportCSVButton";
import SEO from "@/components/SEO";
import SampleDataBadge from "@/components/SampleDataBadge";
import { isSampleMode, MOCK_STUDENT_ENROLLMENTS, MOCK_STUDENT_PROFILES, MOCK_STUDENT_PROGRESS, MOCK_STUDENT_COURSE } from "@/data/mockData";

// Talent Bridge reuse
import StudentTalentBadges from "@/components/academy/StudentTalentBadges";
import StudentOpportunityFitBadge from "@/components/academy/StudentOpportunityFitBadge";
import RecommendationDialog from "@/components/academy/RecommendationDialog";
import NominationDialog from "@/components/academy/NominationDialog";
import { useStudentTalentSignals, TALENT_SIGNAL_LABELS, TALENT_SIGNAL_COLORS } from "@/portals/academy/hooks/useStudentTalentSignals";
import { useInstructorRecommendations, useInstructorNominations } from "@/features/academy/talentBridge/hooks";
import { NOMINATION_STATUS_LABELS } from "@/features/academy/talentBridge/nominations";


interface DialogTarget {
  userId: string;
  name: string;
  allowsNomination: boolean;
}

export default function InstructorStudents() {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, loading: authLoading, accountType } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Only use mock data when the route itself points to a mock course
  const isSampleCourse = !!(courseId && courseId.startsWith("mock-")) && isSampleMode();

  // Dialog state
  const [recTarget, setRecTarget] = useState<DialogTarget | null>(null);
  const [nomTarget, setNomTarget] = useState<DialogTarget | null>(null);

  // Verify course ownership
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["instructor-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, title_en, title_ar, instructor_id")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user && !isSampleCourse,
  });
  const resolvedCourse = course ?? (isSampleCourse ? MOCK_STUDENT_COURSE : null);

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollLoading, isError: enrollError, refetch: refetchEnroll } = useQuery({
    queryKey: ["instructor-students", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("course_id", courseId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!resolvedCourse && !isSampleCourse,
  });
  const resolvedEnrollments = enrollments.length > 0 ? enrollments : (isSampleCourse ? MOCK_STUDENT_ENROLLMENTS : []);

  // Fetch profiles
  const userIds = resolvedEnrollments.map((e) => e.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["student-profiles", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase.rpc("get_course_student_profiles" as any, { p_course_ids: [courseId] });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!courseId && !isSampleCourse,
  });
  const resolvedProfiles = profiles.length > 0 ? profiles : (isSampleCourse ? MOCK_STUDENT_PROFILES : []);

  // Fetch total lessons for progress
  const { data: totalLessons = 0 } = useQuery({
    queryKey: ["course-lesson-count", courseId],
    queryFn: async () => {
      const { count } = await supabase
        .from("course_lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId!);
      return count || 0;
    },
    enabled: !!courseId && !isSampleCourse,
  });
  const resolvedTotalLessons = totalLessons > 0 ? totalLessons : (isSampleCourse ? 24 : 0);

  // Fetch lesson progress
  const enrollmentIds = resolvedEnrollments.map((e) => e.id);
  const { data: progressData = [] } = useQuery({
    queryKey: ["student-progress", enrollmentIds],
    queryFn: async () => {
      if (!enrollmentIds.length) return [];
      const { data } = await supabase
        .from("lesson_progress")
        .select("enrollment_id, is_completed, last_accessed_at")
        .in("enrollment_id", enrollmentIds)
        .eq("is_completed", true);
      return data || [];
    },
    enabled: enrollmentIds.length > 0 && !isSampleCourse,
  });

  // Talent Bridge hooks
  const talentMap = useStudentTalentSignals(isSampleCourse ? [] : userIds);
  const { data: recommendations = [] } = useInstructorRecommendations(user?.id);
  const { data: nominations = [] } = useInstructorNominations(user?.id);

  /** Course-scoped: only show recs for this course or intentionally general (null-course) */
  const getStudentRecs = (userId: string) =>
    recommendations.filter(r => r.student_user_id === userId && (r.course_id === courseId || r.course_id === null));
  /** Course-scoped: only show noms for this course or intentionally general (null-course) */
  const getStudentNoms = (userId: string) =>
    nominations.filter(n => n.student_user_id === userId && (n.course_id === courseId || n.course_id === null));

  // Auth guards
  if (authLoading || (courseLoading && !isSampleCourse)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || (accountType !== "instructor" && accountType !== "admin")) return <Navigate to="/" replace />;
  if (!isSampleCourse && resolvedCourse && resolvedCourse.instructor_id !== user.id && accountType !== "admin") return <Navigate to="/instructor/workspace/courses" replace />;

  if (enrollError && !isSampleCourse) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive/60" />
        <p className="text-muted-foreground">{isAr ? "فشل تحميل قائمة الطلاب" : "Failed to load student list"}</p>
        <Button variant="outline" onClick={() => refetchEnroll()}>{isAr ? "إعادة المحاولة" : "Retry"}</Button>
      </div>
    );
  }

  const profileMap = new Map(resolvedProfiles.map((p) => [p.user_id, p]));

  // Compute progress per enrollment
  const progressMap = new Map<string, { completed: number; lastAccessed: string | null }>();
  if (isSampleCourse) {
    Object.entries(MOCK_STUDENT_PROGRESS).forEach(([k, v]) => progressMap.set(k, v));
  } else {
    for (const p of progressData) {
      const existing = progressMap.get(p.enrollment_id) || { completed: 0, lastAccessed: null };
      existing.completed += 1;
      if (!existing.lastAccessed || (p.last_accessed_at && p.last_accessed_at > existing.lastAccessed)) {
        existing.lastAccessed = p.last_accessed_at;
      }
      progressMap.set(p.enrollment_id, existing);
    }
  }

  const activeCount = resolvedEnrollments.filter((e) => e.status === "active").length;
  const completedCount = resolvedEnrollments.filter((e) => e.status === "completed").length;
  const avgProgress = resolvedTotalLessons > 0 && resolvedEnrollments.length > 0
    ? Math.round(
        resolvedEnrollments.reduce((sum, e) => {
          const p = progressMap.get(e.id);
          return sum + ((p?.completed || 0) / resolvedTotalLessons) * 100;
        }, 0) / resolvedEnrollments.length
      )
    : 0;

  const csvData = resolvedEnrollments.map((e) => {
    const profile = profileMap.get(e.user_id);
    const prog = progressMap.get(e.id);
    const pct = resolvedTotalLessons > 0 ? Math.round(((prog?.completed || 0) / resolvedTotalLessons) * 100) : 0;
    return {
      name: profile?.full_name || "—",
      enrolled_at: format(new Date(e.enrolled_at), "yyyy-MM-dd"),
      progress_pct: pct,
      status: e.status,
      completed_at: e.completed_at ? format(new Date(e.completed_at), "yyyy-MM-dd") : "",
    };
  });

  const stats = [
    { label: isAr ? "إجمالي الطلاب" : "Total Students", value: resolvedEnrollments.length, icon: Users, color: "text-primary" },
    { label: isAr ? "نشط" : "Active", value: activeCount, icon: BarChart3, color: "text-primary" },
    { label: isAr ? "مكتمل" : "Completed", value: completedCount, icon: CheckCircle2, color: "text-green-600" },
    { label: isAr ? "متوسط التقدم" : "Avg Progress", value: `${avgProgress}%`, icon: Clock, color: "text-amber-600" },
  ];

  const coursesForDialog = resolvedCourse
    ? [{ id: resolvedCourse.id, title_en: resolvedCourse.title_en, title_ar: resolvedCourse.title_ar }]
    : [];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <SEO title={isAr ? "إدارة الطلاب" : "Student Management"} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/instructor/workspace/courses"><ArrowLeft className="icon-flip-rtl h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{isAr ? "الطلاب" : "Students"}</h1>
              <SampleDataBadge isSample={isSampleCourse} />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? (resolvedCourse?.title_ar || resolvedCourse?.title_en) : resolvedCourse?.title_en}
            </p>
          </div>
        </div>
        <ExportCSVButton data={csvData} filename="students" label={isAr ? "تصدير CSV" : "Export CSV"} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {enrollLoading && !isSampleCourse ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : resolvedEnrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا يوجد طلاب بعد" : "No students yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الطالب" : "Student"}</TableHead>
                  <TableHead>{isAr ? "تاريخ التسجيل" : "Enrolled"}</TableHead>
                  <TableHead>{isAr ? "التقدم" : "Progress"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "آخر نشاط" : "Last Activity"}</TableHead>
                  <TableHead>{isAr ? "الشهادة" : "Certificate"}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedEnrollments.map((enrollment) => {
                  const profile = profileMap.get(enrollment.user_id);
                  const prog = progressMap.get(enrollment.id);
                  const pct = resolvedTotalLessons > 0 ? Math.round(((prog?.completed || 0) / resolvedTotalLessons) * 100) : 0;
                  const talent = talentMap.get(enrollment.user_id);
                  const studentName = profile?.full_name || "—";
                  const studentRecs = getStudentRecs(enrollment.user_id);
                  const studentNoms = getStudentNoms(enrollment.user_id);

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {studentName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">{studentName}</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              <StudentTalentBadges data={talent} compact />
                              <StudentOpportunityFitBadge talentData={talent} />
                              {talent?.signal && talent.signal !== "not_ready_yet" && talent.visibility !== "private" && (
                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${TALENT_SIGNAL_COLORS[talent.signal]}`}>
                                  {isAr ? TALENT_SIGNAL_LABELS[talent.signal].ar : TALENT_SIGNAL_LABELS[talent.signal].en}
                                </Badge>
                              )}
                              {studentRecs.length > 0 && !talent?.hasProfile && studentRecs.map(r => (
                                <Badge key={r.id} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  {r.course_id === null && <Globe className="h-2 w-2 mr-0.5 opacity-60" />}
                                  {r.status === "draft" ? (isAr ? "مسودة" : "Draft") : (isAr ? "نشط" : "Active")}
                                </Badge>
                              ))}
                              {studentNoms.length > 0 && !talent?.hasProfile && studentNoms.map(n => (
                                <Badge
                                  key={n.id}
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-4"
                                >
                                  <Award className="h-2.5 w-2.5 mr-0.5" />
                                  {n.course_id === null && <Globe className="h-2 w-2 mr-0.5 opacity-60" />}
                                  {isAr
                                    ? NOMINATION_STATUS_LABELS[n.status as keyof typeof NOMINATION_STATUS_LABELS]?.ar ?? n.status
                                    : NOMINATION_STATUS_LABELS[n.status as keyof typeof NOMINATION_STATUS_LABELS]?.en ?? n.status}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-10 text-end">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={enrollment.status === "completed" ? "default" : "secondary"}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {prog?.lastAccessed
                          ? formatDistanceToNow(new Date(prog.lastAccessed), { addSuffix: true })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {enrollment.status === "completed" ? (
                          <Link to={`/certificate/${enrollment.id}`} className="text-primary hover:underline text-xs flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {isAr ? "عرض" : "View"}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setRecTarget({ userId: enrollment.user_id, name: studentName, allowsNomination: talent?.allowNomination ?? false })}
                              className="text-xs gap-2"
                            >
                              <Star className="h-3.5 w-3.5" />
                              {isAr ? "إضافة توصية" : "Recommend"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setNomTarget({ userId: enrollment.user_id, name: studentName, allowsNomination: talent?.allowNomination ?? false })}
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Dialog — passes readiness snapshot + talent signal */}
      {recTarget && (
        <RecommendationDialog
          open={!!recTarget}
          onOpenChange={(open) => { if (!open) setRecTarget(null); }}
          studentUserId={recTarget.userId}
          studentName={recTarget.name}
          courses={coursesForDialog}
          readinessSnapshot={talentMap.get(recTarget.userId)?.readinessSnapshot ?? null}
          talentSignal={talentMap.get(recTarget.userId)?.signal ?? null}
        />
      )}

      {/* Nomination Dialog — respects privacy gating */}
      {nomTarget && (
        <NominationDialog
          open={!!nomTarget}
          onOpenChange={(open) => { if (!open) setNomTarget(null); }}
          studentUserId={nomTarget.userId}
          studentName={nomTarget.name}
          allowsNomination={nomTarget.allowsNomination}
          visibilityState={talentMap.get(nomTarget.userId)?.visibility ?? null}
          hasProfile={talentMap.get(nomTarget.userId)?.hasProfile ?? false}
          courses={coursesForDialog}
        />
      )}
    </div>
  );
}
