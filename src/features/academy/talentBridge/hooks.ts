/**
 * Academy Talent Bridge — Data Hooks
 *
 * CRUD hooks for academy_talent_profiles, academy_recommendations,
 * and academy_nominations. Uses canonical vocabulary from the
 * talentBridge module.
 *
 * Notifications for recommendations/nominations are created by
 * PostgreSQL triggers (server-side), NOT by these client hooks.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AcademyTalentProfile,
  AcademyTalentProfileInsert,
  
  AcademyRecommendation,
  AcademyRecommendationInsert,
  AcademyRecommendationUpdate,
  AcademyNomination,
  AcademyNominationInsert,
  AcademyNominationUpdate,
} from "@/types/database";

// ── Keys ─────────────────────────────────────────────────────

const TALENT_PROFILE_KEY = "academy-talent-profile";
const RECOMMENDATIONS_KEY = "academy-recommendations";
const NOMINATIONS_KEY = "academy-nominations";

// ── Talent Profile ───────────────────────────────────────────

/** Fetch the current user's own talent profile (or null). */
export function useMyTalentProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [TALENT_PROFILE_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<AcademyTalentProfile | null> => {
      const { data, error } = await supabase
        .from("academy_talent_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Upsert (create or update) the current user's talent profile. */
export function useUpsertTalentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: AcademyTalentProfileInsert & { id?: string }
    ) => {
      const { data, error } = await supabase
        .from("academy_talent_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data as AcademyTalentProfile;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [TALENT_PROFILE_KEY, data.user_id] });
    },
  });
}

// ── Recommendations ──────────────────────────────────────────

/** Fetch recommendations where current user is the student. */
export function useMyRecommendations(userId: string | undefined) {
  return useQuery({
    queryKey: [RECOMMENDATIONS_KEY, "student", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AcademyRecommendation[]> => {
      const { data, error } = await supabase
        .from("academy_recommendations")
        .select("*")
        .eq("student_user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch recommendations created by the current instructor. */
export function useInstructorRecommendations(instructorId: string | undefined) {
  return useQuery({
    queryKey: [RECOMMENDATIONS_KEY, "instructor", instructorId],
    enabled: !!instructorId,
    queryFn: async (): Promise<AcademyRecommendation[]> => {
      const { data, error } = await supabase
        .from("academy_recommendations")
        .select("*")
        .eq("recommended_by", instructorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Create a new recommendation. */
export function useCreateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AcademyRecommendationInsert) => {
      const { data, error } = await supabase
        .from("academy_recommendations")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as AcademyRecommendation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECOMMENDATIONS_KEY] });
    },
  });
}

/** Update a recommendation status or content. */
export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: AcademyRecommendationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("academy_recommendations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AcademyRecommendation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECOMMENDATIONS_KEY] });
    },
  });
}

// ── Nominations ──────────────────────────────────────────────

/** Fetch nominations where current user is the student. */
export function useMyNominations(userId: string | undefined) {
  return useQuery({
    queryKey: [NOMINATIONS_KEY, "student", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AcademyNomination[]> => {
      const { data, error } = await supabase
        .from("academy_nominations")
        .select("*")
        .eq("student_user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch nominations created by the current instructor. */
export function useInstructorNominations(instructorId: string | undefined) {
  return useQuery({
    queryKey: [NOMINATIONS_KEY, "instructor", instructorId],
    enabled: !!instructorId,
    queryFn: async (): Promise<AcademyNomination[]> => {
      const { data, error } = await supabase
        .from("academy_nominations")
        .select("*")
        .eq("nominated_by", instructorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Create a new nomination. */
export function useCreateNomination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AcademyNominationInsert) => {
      const { data, error } = await supabase
        .from("academy_nominations")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as AcademyNomination;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOMINATIONS_KEY] });
    },
  });
}

/** Update a nomination (status transitions, evidence, etc). */
export function useUpdateNomination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: AcademyNominationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("academy_nominations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AcademyNomination;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOMINATIONS_KEY] });
    },
  });
}
