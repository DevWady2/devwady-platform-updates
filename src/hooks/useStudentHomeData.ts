/**
 * useStudentHomeData — Single data-adapter hook for the Student Home feed.
 *
 * Aggregates real Supabase data into a normalized shape consumable by
 * the upcoming Student Home UI components.
 *
 * Data sources:
 *  - course_enrollments + training_courses → enrollment list, course metadata
 *  - lesson_progress                       → last_accessed_at, completion per enrollment
 *  - course_sessions                       → upcoming sessions for enrolled courses
 *  - project_submissions                   → pending/revision-requested submissions
 *  - project_reviews                       → recent feedback
 *  - assessment_attempts                   → recent outcomes
 *  - academy_talent_profiles               → talent profile existence + visibility
 *  - academy_recommendations               → count only
 *  - academy_nominations                   → count only
 *  - cohort_memberships + course_cohorts   → community / batch context
 *
 * Export reconciliation marker: Phase A/B1 student home data adapter.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StudentHomeState = "empty" | "low_signal" | "active";

export interface StudentFeedItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  actionPath: string;
  accent: "attention" | "neutral" | "success";
}

export interface StudentSummaryStats {
  activeCourses: number;
  avgProgress: number;
  upcomingSessions: number;
  pendingSubmissions: number;
}

export interface StudentCommunityItem {
  cohortName: string;
  courseName: string;
  learnerCount: number;
  nextSessionTitle: string | null;
  nextSessionAt: string | null;
  actionPath: string;
}

export interface StudentOpportunityItem {
  type: "talent_profile" | "recommendations" | "nominations";
  label: string;
  value: string | number;
}

export interface StudentUpcomingSession {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  startAt: string;
  endAt: string;
}

export interface StudentLearningSnapshot {
  activeCourses: number;
  completedCourses: number;
  talentProfileComplete: boolean;
  readinessLabel: string | null;
  visibilityState: string | null;
  allowNomination: boolean;
}

export interface StudentHomeData {
  homeState: StudentHomeState;
  isLoading: boolean;
  summaryStats: StudentSummaryStats;
  continueItems: StudentFeedItem[];
  learningActivityItems: StudentFeedItem[];
  communityItems: StudentCommunityItem[];
  opportunityItems: StudentOpportunityItem[];
  upcomingSessions: StudentUpcomingSession[];
  learningSnapshot: StudentLearningSnapshot;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function iso(d: Date): string {
  return d.toISOString();
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useStudentHomeData(): StudentHomeData {
  const { user } = useAuth();

  const now = useMemo(() => new Date(), []);
  const twentyFourHoursLater = useMemo(() => new Date(now.getTime() + 24 * 60 * 60 * 1000), [now]);
  const sevenDaysAgo = useMemo(() => new Date(now.getTime() - SEVEN_DAYS_MS), [now]);

  // ── Enrollments + course metadata ──
  const { data: enrollments, isLoading: enrollLoading } = useQuery({
    queryKey: ["student-home-enrollments", user?.id],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("id, course_id, status, enrolled_at, completed_at, training_courses(id, title_en, title_ar, slug, total_lessons)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const enrolledCourseIds = useMemo(
    () => (enrollments ?? []).map((e) => e.course_id),
    [enrollments],
  );
  const hasEnrollments = enrolledCourseIds.length > 0;

  // Build courseId → name map
  const courseNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of enrollments ?? []) {
      const tc = e.training_courses as any;
      if (tc) m[e.course_id] = tc.title_en ?? tc.title_ar ?? "Course";
    }
    return m;
  }, [enrollments]);

  // Build courseId → total_lessons map
  const totalLessonsMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of enrollments ?? []) {
      const tc = e.training_courses as any;
      if (tc) m[e.course_id] = tc.total_lessons ?? 0;
    }
    return m;
  }, [enrollments]);

  // Build courseId → slug map
  const courseSlugMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of enrollments ?? []) {
      const tc = e.training_courses as any;
      if (tc?.slug) m[e.course_id] = tc.slug;
    }
    return m;
  }, [enrollments]);

  // ── Lesson progress ──
  const { data: lessonProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["student-home-lesson-progress", user?.id],
    enabled: !!user && hasEnrollments,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("enrollment_id, lesson_id, is_completed, last_accessed_at")
        .eq("user_id", user!.id)
        .order("last_accessed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Upcoming sessions for enrolled courses ──
  const { data: rawSessions, isLoading: sessLoading } = useQuery({
    queryKey: ["student-home-sessions", enrolledCourseIds],
    enabled: hasEnrollments,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select("id, title, course_id, cohort_id, start_at, end_at")
        .in("course_id", enrolledCourseIds)
        .gte("start_at", iso(now))
        .eq("is_published", true)
        .order("start_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Project submissions (user's own) ──
  const { data: projectSubmissions } = useQuery({
    queryKey: ["student-home-submissions", user?.id],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("id, project_id, submission_status, submitted_at, last_updated_at, course_projects!inner(course_id, title_en)")
        .eq("user_id", user!.id)
        .order("last_updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Assessment attempts (user's own, recent) ──
  const { data: assessmentAttempts } = useQuery({
    queryKey: ["student-home-assessments", user?.id],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id, assessment_id, status, score, submitted_at, reviewed_at, feedback, course_assessments!inner(course_id, title_en)")
        .eq("user_id", user!.id)
        .gte("created_at", iso(sevenDaysAgo))
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Talent profile ──
  const { data: talentProfile } = useQuery({
    queryKey: ["student-home-talent-profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_talent_profiles")
        .select("id, visibility_state, headline, summary, primary_track, allow_nomination")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // ── Recommendation count ──
  const { data: recCount } = useQuery({
    queryKey: ["student-home-rec-count", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("academy_recommendations")
        .select("id", { count: "exact", head: true })
        .eq("student_user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // ── Nomination count ──
  const { data: nomCount } = useQuery({
    queryKey: ["student-home-nom-count", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("academy_nominations")
        .select("id", { count: "exact", head: true })
        .eq("student_user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // ── Cohort memberships (for community) ──
  const { data: cohortMemberships } = useQuery({
    queryKey: ["student-home-cohort-memberships", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("cohort_id, membership_status, course_cohorts!inner(id, title, course_id, status)")
        .eq("user_id", user!.id)
        .eq("membership_status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Count peers per cohort
  const cohortIds = useMemo(
    () => (cohortMemberships ?? []).map((cm) => (cm.course_cohorts as any)?.id).filter(Boolean) as string[],
    [cohortMemberships],
  );

  const { data: peerCounts } = useQuery({
    queryKey: ["student-home-peer-counts", cohortIds],
    enabled: cohortIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("cohort_id")
        .in("cohort_id", cohortIds)
        .eq("membership_status", "active");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.cohort_id] = (counts[row.cohort_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  // ─── Derived data ─────────────────────────────────────────────────────────

  const isLoading = enrollLoading || progressLoading || sessLoading;

  return useMemo(() => {
    const activeEnrollments = (enrollments ?? []).filter((e) => e.status === "active");
    const completedEnrollments = (enrollments ?? []).filter((e) => e.status === "completed");

    // ── Per-enrollment completion ratios ──
    const completionByEnrollment: Record<string, { completed: number; total: number }> = {};
    for (const lp of lessonProgress ?? []) {
      if (!completionByEnrollment[lp.enrollment_id]) {
        // Find enrollment to get course_id → total_lessons
        const enr = (enrollments ?? []).find((e) => e.id === lp.enrollment_id);
        const total = enr ? totalLessonsMap[enr.course_id] ?? 0 : 0;
        completionByEnrollment[lp.enrollment_id] = { completed: 0, total };
      }
      if (lp.is_completed) completionByEnrollment[lp.enrollment_id].completed++;
    }
    // Enrollments with no progress at all
    for (const e of activeEnrollments) {
      if (!completionByEnrollment[e.id]) {
        completionByEnrollment[e.id] = { completed: 0, total: totalLessonsMap[e.course_id] ?? 0 };
      }
    }

    // avgProgress — simple average of active enrollment completion ratios
    let avgProgress = 0;
    const ratios = activeEnrollments
      .map((e) => {
        const comp = completionByEnrollment[e.id];
        if (!comp || comp.total === 0) return 0;
        return comp.completed / comp.total;
      });
    if (ratios.length > 0) {
      avgProgress = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
    }

    // ── Continue Items (priority chain) ──
    const continueItems: StudentFeedItem[] = [];

    // 1. Most recently accessed incomplete lesson
    const incompleteEnrollmentIds = new Set(activeEnrollments.map((e) => e.id));
    const recentAccessedLesson = (lessonProgress ?? []).find(
      (lp) => incompleteEnrollmentIds.has(lp.enrollment_id) && !lp.is_completed && lp.last_accessed_at,
    );
    if (recentAccessedLesson) {
      const enr = activeEnrollments.find((e) => e.id === recentAccessedLesson.enrollment_id);
      const courseId = enr?.course_id ?? "";
      const slug = courseSlugMap[courseId];
      const comp = enr ? completionByEnrollment[enr.id] : undefined;
      const lessonSuffix = comp && comp.total > 0 ? ` · ${comp.completed}/${comp.total} lessons` : "";
      continueItems.push({
        id: `continue-lesson-${recentAccessedLesson.lesson_id}`,
        type: "resume_lesson",
        title: "Resume lesson",
        subtitle: (courseNameMap[courseId] ?? "Course") + lessonSuffix,
        timestamp: recentAccessedLesson.last_accessed_at ?? "",
        actionPath: slug ? `/learn/${slug}` : "/my/learning",
        accent: "attention",
      });
    }

    // 2. Upcoming session within 24h
    const sessionsWithin24h = (rawSessions ?? []).filter(
      (s) => new Date(s.start_at) <= twentyFourHoursLater,
    );
    for (const s of sessionsWithin24h) {
      if (continueItems.length >= 4) break;
      continueItems.push({
        id: `session-${s.id}`,
        type: "join_session",
        title: "Join session",
        subtitle: `${s.title} · ${courseNameMap[s.course_id] ?? "Course"}`,
        timestamp: s.start_at,
        actionPath: `/my/learning`,
        accent: "attention",
      });
    }

    // 3. Submission with revision_requested
    const revisionRequested = (projectSubmissions ?? []).filter(
      (ps) => ps.submission_status === "revision_requested",
    );
    for (const ps of revisionRequested) {
      if (continueItems.length >= 4) break;
      const courseId = (ps.course_projects as any)?.course_id ?? "";
      const projectTitle = (ps.course_projects as any)?.title_en ?? "Project";
      continueItems.push({
        id: `revision-${ps.id}`,
        type: "review_feedback",
        title: "Review feedback",
        subtitle: `${projectTitle} · ${courseNameMap[courseId] ?? "Course"}`,
        timestamp: ps.last_updated_at ?? ps.submitted_at ?? "",
        actionPath: `/my/learning`,
        accent: "attention",
      });
    }

    // 4. Next incomplete enrollment fallback
    if (continueItems.length === 0 && activeEnrollments.length > 0) {
      const enr = activeEnrollments[0];
      const slug = courseSlugMap[enr.course_id];
      const comp = completionByEnrollment[enr.id];
      const lessonSuffix = comp && comp.total > 0 ? ` · ${comp.completed}/${comp.total} lessons` : "";
      continueItems.push({
        id: `continue-course-${enr.id}`,
        type: "continue_course",
        title: "Continue course",
        subtitle: (courseNameMap[enr.course_id] ?? "Course") + lessonSuffix,
        timestamp: enr.enrolled_at,
        actionPath: slug ? `/learn/${slug}` : "/my/learning",
        accent: "neutral",
      });
    }

    // ── Learning Activity Items (time-sorted, limit 8) ──
    const rawActivity: StudentFeedItem[] = [];

    // Recent assessment outcomes
    for (const aa of assessmentAttempts ?? []) {
      const courseId = (aa.course_assessments as any)?.course_id ?? "";
      const assessTitle = (aa.course_assessments as any)?.title_en ?? "Assessment";
      const passed = aa.status === "passed";
      rawActivity.push({
        id: `assess-${aa.id}`,
        type: passed ? "assessment_passed" : aa.status === "failed" ? "assessment_failed" : "assessment_result",
        title: passed
          ? `Passed: ${assessTitle}${aa.score != null ? ` (${aa.score}%)` : ""}`
          : aa.status === "failed"
            ? `Did not pass: ${assessTitle}${aa.score != null ? ` (${aa.score}%)` : ""}`
            : `${assessTitle} — ${aa.status}`,
        subtitle: courseNameMap[courseId] ?? "Course",
        timestamp: aa.reviewed_at ?? aa.submitted_at ?? "",
        actionPath: `/my/learning`,
        accent: passed ? "success" : "neutral",
      });
    }

    // Recent project submission activity (submitted/reviewed in last 7 days, excluding revision_requested already in continue)
    for (const ps of (projectSubmissions ?? []).filter(
      (p) =>
        p.last_updated_at &&
        new Date(p.last_updated_at).getTime() > sevenDaysAgo.getTime() &&
        p.submission_status !== "draft",
    )) {
      const courseId = (ps.course_projects as any)?.course_id ?? "";
      const projectTitle = (ps.course_projects as any)?.title_en ?? "Project";
      const isReviewed = ps.submission_status === "reviewed" || ps.submission_status === "approved";
      rawActivity.push({
        id: `proj-${ps.id}`,
        type: isReviewed ? "project_reviewed" : "project_submitted",
        title: isReviewed
          ? `Received review on ${projectTitle}`
          : `Submitted ${projectTitle}`,
        subtitle: courseNameMap[courseId] ?? "Course",
        timestamp: ps.last_updated_at ?? ps.submitted_at ?? "",
        actionPath: `/my/learning`,
        accent: isReviewed ? "success" : "neutral",
      });
    }

    // Sort by timestamp desc, limit 8
    rawActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const learningActivityItems = rawActivity.slice(0, 8);

    // ── Community Items ──
    const communityItems: StudentCommunityItem[] = [];
    for (const cm of cohortMemberships ?? []) {
      const cohort = cm.course_cohorts as any;
      if (!cohort) continue;
      const courseId = cohort.course_id ?? "";
      // Find next session for this cohort
      const nextSess = (rawSessions ?? []).find((s) => s.cohort_id === cohort.id);
      communityItems.push({
        cohortName: cohort.title ?? "Cohort",
        courseName: courseNameMap[courseId] ?? "Course",
        learnerCount: (peerCounts ?? {})[cohort.id] ?? 0,
        nextSessionTitle: nextSess?.title ?? null,
        nextSessionAt: nextSess?.start_at ?? null,
        actionPath: `/my/learning`,
      });
    }

    // ── Opportunity Items ──
    const opportunityItems: StudentOpportunityItem[] = [];
    if (talentProfile) {
      const vis = talentProfile.visibility_state;
      opportunityItems.push({
        type: "talent_profile",
        label: "Talent Profile",
        value: vis === "opportunity_ready" ? "Open to Opportunities" : vis === "academy_only" ? "Academy Only" : "Private",
      });
    }
    if ((recCount ?? 0) > 0) {
      opportunityItems.push({
        type: "recommendations",
        label: "Recommendations",
        value: recCount ?? 0,
      });
    }
    if ((nomCount ?? 0) > 0) {
      opportunityItems.push({
        type: "nominations",
        label: "Nominations",
        value: nomCount ?? 0,
      });
    }

    // ── Upcoming Sessions ──
    const upcomingSessions: StudentUpcomingSession[] = (rawSessions ?? []).slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      courseId: s.course_id,
      courseName: courseNameMap[s.course_id] ?? "Course",
      startAt: s.start_at,
      endAt: s.end_at,
    }));

    // ── Summary Stats ──
    const pendingSubmissions = (projectSubmissions ?? []).filter(
      (ps) => ps.submission_status === "draft" || ps.submission_status === "revision_requested",
    ).length;

    const summaryStats: StudentSummaryStats = {
      activeCourses: activeEnrollments.length,
      avgProgress,
      upcomingSessions: (rawSessions ?? []).length,
      pendingSubmissions,
    };

    // ── Learning Snapshot ──
    const talentProfileComplete = !!(
      talentProfile?.headline &&
      talentProfile?.summary &&
      talentProfile?.primary_track
    );

    const readinessLabel = talentProfile
      ? talentProfileComplete
        ? "Profile complete"
        : "Profile incomplete"
      : null;

    const learningSnapshot: StudentLearningSnapshot = {
      activeCourses: activeEnrollments.length,
      completedCourses: completedEnrollments.length,
      talentProfileComplete,
      readinessLabel,
      visibilityState: talentProfile?.visibility_state ?? null,
      allowNomination: !!(talentProfile as any)?.allow_nomination,
    };

    // ── Home State ──
    const totalFeedItems = continueItems.length + learningActivityItems.length + communityItems.length;

    let homeState: StudentHomeState;
    if ((enrollments ?? []).length === 0) {
      homeState = "empty";
    } else if (totalFeedItems < 3) {
      homeState = "low_signal";
    } else {
      homeState = "active";
    }

    return {
      homeState,
      isLoading,
      summaryStats,
      continueItems,
      learningActivityItems,
      communityItems,
      opportunityItems,
      upcomingSessions,
      learningSnapshot,
    };
  }, [
    enrollments, lessonProgress, rawSessions, projectSubmissions,
    assessmentAttempts, talentProfile, recCount, nomCount,
    cohortMemberships, peerCounts, courseNameMap, totalLessonsMap,
    courseSlugMap, isLoading, now, twentyFourHoursLater, sevenDaysAgo,
  ]);
}
