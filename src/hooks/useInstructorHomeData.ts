/**
 * useInstructorHomeData — Single data adapter hook for the Instructor Home feed.
 *
 * Aggregates real Supabase data into a normalized shape consumable by
 * the upcoming feed-based Instructor Home UI.
 *
 * Data sources:
 *  - useInstructorCourses()        → owned course IDs (base)
 *  - course_enrollments            → student counts
 *  - project_submissions           → pending reviews + activity
 *  - assessment_attempts           → pending grading + activity
 *  - course_sessions               → upcoming sessions, attention
 *  - course_cohorts                → community / batch data
 *  - cohort_memberships            → learner counts per cohort
 *  - academy_nominations           → opportunity signals + activity
 *  - lesson_progress               → completion insights
 *  - consulting_experts            → suggested experts
 *  - profiles                      → student names, instructor track
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorCourses } from "@/portals/academy/hooks/useInstructorCourses";

// ─── Types ──────────────────────────────────────────────────────────────────

export type HomeState = "new" | "active" | "advanced";

export interface FeedItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  actionPath: string;
  accent: "attention" | "neutral" | "success";
}

export interface SummaryStats {
  ownedCourses: number;
  publishedCourses: number;
  activeStudents: number;
  completedStudents: number;
  pendingReviews: number;
  upcomingSessionsCount: number;
}

export interface CommunityItem {
  cohortName: string;
  courseName: string;
  courseId: string;
  learnerCount: number;
  nextSessionTitle: string | null;
  nextSessionAt: string | null;
  deliveryPath: string;
}

export interface InsightItem {
  id: string;
  type: "top_student" | "at_risk";
  studentName: string;
  courseName: string;
  courseId: string;
  completionRatio: number;
  enrolledAt: string;
}

export interface ExpertItem {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  slug: string;
  track: string;
  sessionRateUsd: number;
}

export interface UpcomingSession {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  startAt: string;
  endAt: string;
}

export interface OpportunitySummaryItem {
  metric: "pending" | "accepted" | "declined";
  count: number;
  label: string;
}

export interface InstructorHomeData {
  homeState: HomeState;
  isLoading: boolean;
  summaryStats: SummaryStats;
  attentionItems: FeedItem[];
  teachingActivityItems: FeedItem[];
  communityItems: CommunityItem[];
  opportunityItems: OpportunitySummaryItem[];
  insightItems: InsightItem[];
  upcomingSessions: UpcomingSession[];
  experts: ExpertItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function iso(date: Date): string {
  return date.toISOString();
}

/** Build a map of profile names keyed by user_id */
function buildNameMap(profiles: { user_id: string; full_name: string | null }[] | null): Record<string, string> {
  const m: Record<string, string> = {};
  for (const p of profiles ?? []) {
    m[p.user_id] = p.full_name ?? "Student";
  }
  return m;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useInstructorHomeData(): InstructorHomeData {
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useInstructorCourses();

  const courseIds = useMemo(() => (courses ?? []).map((c) => c.id), [courses]);
  const hasCourses = courseIds.length > 0;

  const now = useMemo(() => new Date(), []);
  const twentyFourHoursLater = useMemo(() => new Date(now.getTime() + 24 * 60 * 60 * 1000), [now]);
  const sevenDaysAgo = useMemo(() => new Date(now.getTime() - SEVEN_DAYS_MS), [now]);

  // Map courseId → course title for display
  const courseNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of courses ?? []) {
      m[c.id] = c.title_en ?? c.title_ar ?? "Course";
    }
    return m;
  }, [courses]);

  // ── Enrollments ──
  const { data: enrollments, isLoading: enrollLoading } = useQuery({
    queryKey: ["instructor-home-enrollments", courseIds],
    enabled: hasCourses,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("id, course_id, user_id, status, enrolled_at")
        .in("course_id", courseIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Pending project submissions ──
  const { data: pendingProjects, isLoading: projLoading } = useQuery({
    queryKey: ["instructor-home-pending-projects", courseIds],
    enabled: hasCourses,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("id, user_id, submission_status, submitted_at, project_id, course_projects!inner(course_id)")
        .in("course_projects.course_id", courseIds)
        .eq("submission_status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Recent project activity (submitted/reviewed in last 7 days) ──
  const { data: recentProjectActivity } = useQuery({
    queryKey: ["instructor-home-recent-projects", courseIds],
    enabled: hasCourses,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("id, user_id, submission_status, submitted_at, last_updated_at, project_id, course_projects!inner(course_id)")
        .in("course_projects.course_id", courseIds)
        .gte("last_updated_at", iso(sevenDaysAgo))
        .order("last_updated_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Pending assessment grading ──
  const { data: pendingAssessments, isLoading: assessLoading } = useQuery({
    queryKey: ["instructor-home-pending-assessments", courseIds],
    enabled: hasCourses,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id, user_id, status, submitted_at, assessment_id, course_assessments!inner(course_id)")
        .in("course_assessments.course_id", courseIds)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Recent assessment outcomes (last 7 days) ──
  const { data: recentAssessmentActivity } = useQuery({
    queryKey: ["instructor-home-recent-assessments", courseIds],
    enabled: hasCourses,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id, user_id, status, submitted_at, reviewed_at, score, assessment_id, course_assessments!inner(course_id)")
        .in("course_assessments.course_id", courseIds)
        .in("status", ["passed", "failed", "reviewed"])
        .gte("reviewed_at", iso(sevenDaysAgo))
        .order("reviewed_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Sessions (upcoming + within 24h) ──
  const { data: allUpcomingSessions, isLoading: sessLoading } = useQuery({
    queryKey: ["instructor-home-sessions", courseIds],
    enabled: hasCourses,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select("id, title, course_id, cohort_id, start_at, end_at")
        .in("course_id", courseIds)
        .gte("start_at", iso(now))
        .order("start_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Cohorts (active) ──
  const { data: cohorts } = useQuery({
    queryKey: ["instructor-home-cohorts", courseIds],
    enabled: hasCourses,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_cohorts")
        .select("id, title, course_id, status")
        .in("course_id", courseIds)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Cohort memberships ──
  const cohortIds = useMemo(() => (cohorts ?? []).map((c) => c.id), [cohorts]);
  const { data: cohortMemberships } = useQuery({
    queryKey: ["instructor-home-cohort-members", cohortIds],
    enabled: cohortIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("cohort_id, user_id")
        .in("cohort_id", cohortIds)
        .eq("membership_status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Nominations ──
  const { data: nominations } = useQuery({
    queryKey: ["instructor-home-nominations", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_nominations")
        .select("id, status, student_user_id, created_at, updated_at, nomination_scope, target_company_name")
        .eq("nominated_by", user!.id)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Lesson progress (for insights) ──
  const activeEnrollmentIds = useMemo(() => {
    return (enrollments ?? []).filter((e) => e.status === "active").map((e) => e.id);
  }, [enrollments]);

  const { data: lessonProgress } = useQuery({
    queryKey: ["instructor-home-lesson-progress", activeEnrollmentIds],
    enabled: activeEnrollmentIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Batch in chunks of 50 to avoid overly large IN clause
      const chunks: string[][] = [];
      for (let i = 0; i < activeEnrollmentIds.length; i += 50) {
        chunks.push(activeEnrollmentIds.slice(i, i + 50));
      }
      const allRows: { enrollment_id: string; lesson_id: string; is_completed: boolean | null }[] = [];
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from("lesson_progress")
          .select("enrollment_id, lesson_id, is_completed")
          .in("enrollment_id", chunk);
        if (error) throw error;
        if (data) allRows.push(...data);
      }
      return allRows;
    },
  });

  // ── Experts ──
  const { data: profileData } = useQuery({
    queryKey: ["instructor-home-profile-track", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("track")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const instructorTrack = profileData?.track ?? null;

  const { data: rawExperts } = useQuery({
    queryKey: ["instructor-home-experts", instructorTrack],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_experts");
      const all = (data ?? []) as any[];
      if (instructorTrack) {
        const matched = all
          .filter((e: any) => e.track?.toLowerCase().includes(instructorTrack.toLowerCase()))
          .slice(0, 3);
        if (matched.length > 0) return matched;
      }
      return all.slice(0, 3);
    },
  });

  // Student name resolution via relationship-scoped RPC

  const { data: studentProfiles } = useQuery({
    queryKey: ["instructor-home-student-names", courseIds],
    enabled: courseIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_course_student_profiles", {
        p_course_ids: courseIds,
      });
      if (error) throw error;
      return (data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null }[];
    },
  });

  const nameMap = useMemo(() => buildNameMap(studentProfiles ?? null), [studentProfiles]);
  const getName = (userId: string) => nameMap[userId] ?? "Student";

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const isLoading = coursesLoading || enrollLoading || projLoading || assessLoading || sessLoading;

  return useMemo(() => {
    const ownedCourses = (courses ?? []).length;
    const publishedCourses = (courses ?? []).filter((c) => c.status === "published").length;

    const activeEnrollments = (enrollments ?? []).filter((e) => e.status === "active");
    const completedEnrollments = (enrollments ?? []).filter((e) => e.status === "completed");

    // ── Attention Items ──
    const attentionItems: FeedItem[] = [];

    // A. Pending project reviews
    for (const ps of pendingProjects ?? []) {
      const courseId = (ps as any).course_projects?.course_id;
      attentionItems.push({
        id: ps.id,
        type: "pending_project_review",
        title: `Project submission from ${getName(ps.user_id)}`,
        subtitle: courseId ? courseNameMap[courseId] ?? "Course" : "Course",
        timestamp: ps.submitted_at ?? ps.id,
        actionPath: courseId
          ? `/instructor/workspace/courses/${courseId}/structure`
          : "/instructor/workspace",
        accent: "attention",
      });
    }

    // B. Pending assessment grading
    for (const aa of pendingAssessments ?? []) {
      const courseId = (aa as any).course_assessments?.course_id;
      attentionItems.push({
        id: aa.id,
        type: "pending_assessment_grading",
        title: `Assessment to grade from ${getName(aa.user_id)}`,
        subtitle: courseId ? courseNameMap[courseId] ?? "Course" : "Course",
        timestamp: aa.submitted_at ?? aa.id,
        actionPath: courseId
          ? `/instructor/workspace/courses/${courseId}/structure`
          : "/instructor/workspace",
        accent: "attention",
      });
    }

    // C. Sessions within 24h
    const sessionsWithin24h = (allUpcomingSessions ?? []).filter(
      (s) => new Date(s.start_at) <= twentyFourHoursLater,
    );
    for (const s of sessionsWithin24h) {
      attentionItems.push({
        id: s.id,
        type: "session_soon",
        title: s.title,
        subtitle: courseNameMap[s.course_id] ?? "Course",
        timestamp: s.start_at,
        actionPath: `/instructor/workspace/courses/${s.course_id}/delivery`,
        accent: "attention",
      });
    }

    // ── Teaching Activity Items ──
    const rawActivity: FeedItem[] = [];

    // Recent project submissions
    for (const ps of recentProjectActivity ?? []) {
      // Skip items already in attention (submitted status already caught above)
      if (ps.submission_status === "submitted" && (pendingProjects ?? []).some((p) => p.id === ps.id)) continue;
      const courseId = (ps as any).course_projects?.course_id;
      rawActivity.push({
        id: ps.id,
        type: ps.submission_status === "submitted" ? "project_submitted" : "project_reviewed",
        title: `${getName(ps.user_id)} ${ps.submission_status === "submitted" ? "submitted" : "received review on"} a project`,
        subtitle: courseId ? courseNameMap[courseId] ?? "Course" : "Course",
        timestamp: ps.last_updated_at ?? ps.submitted_at ?? "",
        actionPath: courseId
          ? `/instructor/workspace/courses/${courseId}/structure`
          : "/instructor/workspace",
        accent: ps.submission_status === "submitted" ? "neutral" : "success",
      });
    }

    // Recent assessment outcomes
    for (const aa of recentAssessmentActivity ?? []) {
      const courseId = (aa as any).course_assessments?.course_id;
      rawActivity.push({
        id: aa.id,
        type: aa.status === "passed" ? "assessment_passed" : "assessment_failed",
        title: `${getName(aa.user_id)} ${aa.status === "passed" ? "passed" : "did not pass"} an assessment${aa.score != null ? ` (${aa.score}%)` : ""}`,
        subtitle: courseId ? courseNameMap[courseId] ?? "Course" : "Course",
        timestamp: aa.reviewed_at ?? aa.submitted_at ?? "",
        actionPath: courseId
          ? `/instructor/workspace/courses/${courseId}/structure`
          : "/instructor/workspace",
        accent: aa.status === "passed" ? "success" : "neutral",
      });
    }

    // Recent nomination changes
    for (const n of (nominations ?? []).filter(
      (n) => new Date(n.updated_at).getTime() > sevenDaysAgo.getTime(),
    )) {
      rawActivity.push({
        id: n.id,
        type: `nomination_${n.status}`,
        title: `Nomination for ${getName(n.student_user_id)} is ${n.status}`,
        subtitle: n.target_company_name ?? n.nomination_scope ?? "General",
        timestamp: n.updated_at,
        actionPath: "/instructor/workspace/students",
        accent: n.status === "accepted" ? "success" : "neutral",
      });
    }

    // Sort by timestamp desc, limit 8
    rawActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const teachingActivityItems = rawActivity.slice(0, 8);

    // ── Community Items ──
    const cohortMemberCountMap: Record<string, number> = {};
    for (const cm of cohortMemberships ?? []) {
      cohortMemberCountMap[cm.cohort_id] = (cohortMemberCountMap[cm.cohort_id] ?? 0) + 1;
    }

    // Next session per cohort
    const nextSessionPerCohort: Record<string, { title: string; start_at: string }> = {};
    for (const s of allUpcomingSessions ?? []) {
      if (s.cohort_id && !nextSessionPerCohort[s.cohort_id]) {
        nextSessionPerCohort[s.cohort_id] = { title: s.title, start_at: s.start_at };
      }
    }

    const communityItems: CommunityItem[] = (cohorts ?? []).map((c) => {
      const nextSess = nextSessionPerCohort[c.id];
      return {
        cohortName: c.title,
        courseName: courseNameMap[c.course_id] ?? "Course",
        courseId: c.course_id,
        learnerCount: cohortMemberCountMap[c.id] ?? 0,
        nextSessionTitle: nextSess?.title ?? null,
        nextSessionAt: nextSess?.start_at ?? null,
        deliveryPath: `/instructor/workspace/courses/${c.course_id}/delivery`,
      };
    });

    // ── Opportunity Items ──
    const opportunityItems: OpportunitySummaryItem[] = [];
    if ((nominations ?? []).length > 0) {
      const noms = nominations!;
      const pending = noms.filter((n) => n.status === "pending" || n.status === "draft").length;
      const accepted = noms.filter((n) => n.status === "accepted").length;
      const declined = noms.filter((n) => n.status === "declined" || n.status === "rejected").length;

      if (pending > 0) opportunityItems.push({ metric: "pending", count: pending, label: "Pending nominations" });
      if (accepted > 0) opportunityItems.push({ metric: "accepted", count: accepted, label: "Accepted nominations" });
      if (declined > 0) opportunityItems.push({ metric: "declined", count: declined, label: "Declined nominations" });
    }

    // ── Insight Items ──
    const insightItems: InsightItem[] = [];

    // Build enrollment lookup
    const enrollmentMap: Record<string, { course_id: string; user_id: string; enrolled_at: string }> = {};
    for (const e of activeEnrollments) {
      enrollmentMap[e.id] = { course_id: e.course_id, user_id: e.user_id, enrolled_at: e.enrolled_at };
    }

    // Build total lessons per course
    const totalLessonsMap: Record<string, number> = {};
    for (const c of courses ?? []) {
      totalLessonsMap[c.id] = c.total_lessons ?? 0;
    }

    // Build completion per enrollment
    const completionByEnrollment: Record<string, { completed: number; total: number }> = {};
    for (const lp of lessonProgress ?? []) {
      if (!completionByEnrollment[lp.enrollment_id]) {
        const enr = enrollmentMap[lp.enrollment_id];
        const total = enr ? totalLessonsMap[enr.course_id] ?? 0 : 0;
        completionByEnrollment[lp.enrollment_id] = { completed: 0, total };
      }
      if (lp.is_completed === true) {
        completionByEnrollment[lp.enrollment_id].completed++;
      }
    }

    // Also add enrollments with no progress at all
    for (const e of activeEnrollments) {
      if (!completionByEnrollment[e.id]) {
        completionByEnrollment[e.id] = { completed: 0, total: totalLessonsMap[e.course_id] ?? 0 };
      }
    }

    // Derive insights
    const enrollmentInsights: {
      enrollmentId: string;
      userId: string;
      courseId: string;
      enrolledAt: string;
      ratio: number;
    }[] = [];

    for (const [eid, comp] of Object.entries(completionByEnrollment)) {
      const enr = enrollmentMap[eid];
      if (!enr || comp.total === 0) continue;
      enrollmentInsights.push({
        enrollmentId: eid,
        userId: enr.user_id,
        courseId: enr.course_id,
        enrolledAt: enr.enrolled_at,
        ratio: comp.completed / comp.total,
      });
    }

    // Top students (highest completion ratio, at least 50% done, limit 3)
    const topStudents = enrollmentInsights
      .filter((e) => e.ratio >= 0.5)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3);

    for (const ts of topStudents) {
      insightItems.push({
        id: ts.enrollmentId,
        type: "top_student",
        studentName: getName(ts.userId),
        courseName: courseNameMap[ts.courseId] ?? "Course",
        courseId: ts.courseId,
        completionRatio: Math.round(ts.ratio * 100),
        enrolledAt: ts.enrolledAt,
      });
    }

    // At-risk students
    const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS);
    const atRisk = enrollmentInsights
      .filter(
        (e) =>
          e.ratio < 0.2 &&
          new Date(e.enrolledAt).getTime() < fourteenDaysAgo.getTime(),
      )
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3);

    for (const ar of atRisk) {
      insightItems.push({
        id: ar.enrollmentId,
        type: "at_risk",
        studentName: getName(ar.userId),
        courseName: courseNameMap[ar.courseId] ?? "Course",
        courseId: ar.courseId,
        completionRatio: Math.round(ar.ratio * 100),
        enrolledAt: ar.enrolledAt,
      });
    }

    // ── Upcoming Sessions ──
    const upcomingSessions: UpcomingSession[] = (allUpcomingSessions ?? []).slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      courseId: s.course_id,
      courseName: courseNameMap[s.course_id] ?? "Course",
      startAt: s.start_at,
      endAt: s.end_at,
    }));

    // ── Experts ──
    const experts: ExpertItem[] = (rawExperts ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      nameAr: e.name_ar,
      role: e.role,
      roleAr: e.role_ar,
      slug: e.slug,
      track: e.track,
      sessionRateUsd: e.session_rate_usd,
    }));

    // ── Summary Stats ──
    const pendingReviews = (pendingProjects ?? []).length + (pendingAssessments ?? []).length;
    const summaryStats: SummaryStats = {
      ownedCourses,
      publishedCourses,
      activeStudents: activeEnrollments.length,
      completedStudents: completedEnrollments.length,
      pendingReviews,
      upcomingSessionsCount: (allUpcomingSessions ?? []).length,
    };

    // ── Home State — Maturity Model ──
    // new:      no courses, or courses but zero student activity
    // active:   has student activity
    // advanced: multiple published courses with meaningful student base or nomination activity
    let homeState: HomeState;
    const hasStudents = activeEnrollments.length > 0 || completedEnrollments.length > 0;
    if (!hasStudents) {
      homeState = "new";
    } else if (
      publishedCourses >= 3 &&
      activeEnrollments.length >= 10
    ) {
      homeState = "advanced";
    } else if ((nominations ?? []).length >= 5) {
      // Strong nomination activity also signals advanced maturity
      homeState = "advanced";
    } else {
      homeState = "active";
    }

    return {
      homeState,
      isLoading,
      summaryStats,
      attentionItems,
      teachingActivityItems,
      communityItems,
      opportunityItems,
      insightItems,
      upcomingSessions,
      experts,
    };
  }, [
    courses, enrollments, pendingProjects, pendingAssessments,
    allUpcomingSessions, recentProjectActivity, recentAssessmentActivity,
    nominations, cohorts, cohortMemberships, lessonProgress,
    rawExperts, courseNameMap, nameMap, isLoading,
    now, twentyFourHoursLater, sevenDaysAgo,
  ]);
}
// Phase E — reconciled