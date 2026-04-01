/**
 * useOrganization — Shared hook for company profile CRUD.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CompanyProfile, CompanyProfileUpdate } from "@/core/types";

export function useOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["core-organization", user?.id];

  const { data: organization, isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as CompanyProfile | null;
    },
  });

  const updateOrganization = useMutation({
    mutationFn: async (updates: CompanyProfileUpdate) => {
      const { error } = await supabase
        .from("company_profiles")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Company profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { organization, isLoading, updateOrganization };
}
