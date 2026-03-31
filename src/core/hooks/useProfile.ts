/**
 * useProfile — Shared hook for fetching and updating the current user's profile.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Profile, ProfileUpdate } from "@/core/types";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["core-profile", user?.id];

  const { data: profile, isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { profile, isLoading, updateProfile };
}
