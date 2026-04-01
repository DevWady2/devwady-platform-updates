/**
 * Shared hook — fetches the consulting_experts row for the current user.
 * Reused across Expert Dashboard, Bookings, Availability, Earnings, ProfileEdit.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const EXPERT_RECORD_KEY = "consulting-expert-record";

export function useExpertRecord() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [EXPERT_RECORD_KEY, user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min — profile data rarely changes mid-session
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_experts")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
