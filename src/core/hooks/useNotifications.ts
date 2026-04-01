/**
 * useCoreNotifications — Shared notification hook with realtime updates.
 * Supports optional type-prefix filtering for portal-scoped views.
 */
import { useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/core/types";

interface UseNotificationsOptions {
  /** Filter by notification type prefix (e.g., "booking_", "hire_") */
  typeFilter?: string;
  limit?: number;
}

export function useCoreNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { typeFilter, limit = 50 } = options;

  // Stable query key
  const queryKey = useMemo(
    () => ["core-notifications", user?.id, typeFilter ?? "all"],
    [user?.id, typeFilter]
  );

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (typeFilter) {
        query = query.ilike("type", `${typeFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Realtime subscription — use stable queryKey via ref-like useMemo
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`core-notif-${user.id}-${typeFilter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, typeFilter]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient, queryKey]);

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}
