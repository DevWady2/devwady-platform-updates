/**
 * useActivity — Shared hook for building activity feeds from notifications.
 * Maps notification records into generic ActivityEntry items for timeline display.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ActivityEntry } from "@/core/types";

interface UseActivityOptions {
  limit?: number;
  entityType?: string;
  entityId?: string;
}

export function useActivity(options: UseActivityOptions = {}) {
  const { user } = useAuth();
  const { limit = 20, entityType, entityId } = options;

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["core-activity", user?.id, entityType, entityId, limit],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((n): ActivityEntry => {
        const meta = (n.metadata ?? {}) as Record<string, unknown>;
        const typePrefix = n.type.split("_")[0];

        return {
          id: n.id,
          type: n.type,
          title_en: n.title_en,
          title_ar: n.title_ar ?? undefined,
          description_en: n.body_en ?? undefined,
          description_ar: n.body_ar ?? undefined,
          // actor comes from metadata when available; falls back to notification recipient
          actor_id: (meta.actor_id as string) ?? undefined,
          actor_name: (meta.actor_name as string) ?? undefined,
          entity_type: typePrefix,
          entity_id: (meta[`${typePrefix}_id`] as string) ?? undefined,
          metadata: meta,
          created_at: n.created_at,
        };
      });
    },
  });

  return { activities, isLoading };
}
