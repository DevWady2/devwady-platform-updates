/**
 * Academy — Course Delivery Hooks
 *
 * Read hooks for cohorts, memberships, sessions, attendance, and roster generation.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Cohorts ─────────────────────────────────────────────────

export function useCourseCohorts(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-cohorts", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_cohorts")
        .select("*")
        .eq("course_id", courseId!)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ── Cohort Membership Counts (aggregated) ───────────────────

export function useCohortMembershipCounts(cohortIds: string[]) {
  return useQuery({
    queryKey: ["cohort-membership-counts", cohortIds],
    enabled: cohortIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("cohort_id, membership_status")
        .in("cohort_id", cohortIds);
      if (error) throw error;
      const counts: Record<string, { total: number; active: number }> = {};
      for (const m of data ?? []) {
        if (!counts[m.cohort_id]) counts[m.cohort_id] = { total: 0, active: 0 };
        counts[m.cohort_id].total++;
        if (m.membership_status === "active") counts[m.cohort_id].active++;
      }
      return counts;
    },
  });
}

// ── Cohort Memberships ──────────────────────────────────────

export function useCohortMemberships(cohortId: string | undefined) {
  return useQuery({
    queryKey: ["cohort-memberships", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_memberships")
        .select("*")
        .eq("cohort_id", cohortId!)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ── Sessions ────────────────────────────────────────────────

export function useCourseSessions(courseId: string | undefined, cohortId?: string) {
  return useQuery({
    queryKey: ["course-sessions", courseId, cohortId],
    enabled: !!courseId,
    queryFn: async () => {
      let q = supabase
        .from("course_sessions")
        .select("*")
        .eq("course_id", courseId!)
        .order("start_at", { ascending: true });
      if (cohortId) q = q.eq("cohort_id", cohortId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ── Attendance ──────────────────────────────────────────────

export function useSessionAttendance(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session-attendance", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_attendance")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return data;
    },
  });
}

// ── Attendance Roster ───────────────────────────────────────
// Builds a full roster from cohort memberships or course enrollments,
// merging existing attendance rows. Returns a unified list even when
// no session_attendance rows exist yet.

export interface RosterEntry {
  user_id: string;
  full_name: string | null;
  email: string | null;
  attendance_status: string;
  has_record: boolean; // true if session_attendance row exists
}

export function useAttendanceRoster(
  sessionId: string | undefined,
  courseId: string | undefined,
  cohortId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["attendance-roster", sessionId, courseId, cohortId],
    enabled: !!sessionId && !!courseId,
    queryFn: async (): Promise<RosterEntry[]> => {
      // 1. Get existing attendance
      const { data: existingAttendance } = await supabase
        .from("session_attendance")
        .select("user_id, attendance_status")
        .eq("session_id", sessionId!);
      const attendanceMap = new Map<string, string>();
      for (const a of existingAttendance ?? []) {
        attendanceMap.set(a.user_id, a.attendance_status);
      }

      // 2. Get roster user IDs
      let rosterUserIds: string[] = [];

      if (cohortId) {
        // Cohort-scoped: use cohort memberships
        const { data: members } = await supabase
          .from("cohort_memberships")
          .select("user_id")
          .eq("cohort_id", cohortId)
          .eq("membership_status", "active");
        rosterUserIds = (members ?? []).map((m) => m.user_id);
      } else {
        // Course-wide: use active enrollments
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("user_id")
          .eq("course_id", courseId!)
          .eq("status", "active");
        rosterUserIds = (enrollments ?? []).map((e) => e.user_id);
      }

      // Also include any users with existing attendance not in roster
      for (const uid of attendanceMap.keys()) {
        if (!rosterUserIds.includes(uid)) rosterUserIds.push(uid);
      }

      if (rosterUserIds.length === 0) return [];

      // 3. Fetch profiles for identity (via relationship-scoped RPC)
      const { data: profiles } = await supabase.rpc("get_course_student_profiles", {
        p_course_ids: [courseId!],
      });
      const profileMap = new Map<string, string | null>();
      for (const p of (profiles ?? []) as { user_id: string; full_name: string | null }[]) {
        profileMap.set(p.user_id, p.full_name);
      }

      // 4. Build roster
      return rosterUserIds.map((uid) => ({
        user_id: uid,
        full_name: profileMap.get(uid) ?? null,
        email: null, // profiles table doesn't have email; name is sufficient
        attendance_status: attendanceMap.get(uid) ?? "pending",
        has_record: attendanceMap.has(uid),
      }));
    },
  });
}
