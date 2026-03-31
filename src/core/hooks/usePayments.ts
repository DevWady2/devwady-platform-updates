/**
 * usePayments — Shared hook for payment history and billing.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Payment } from "@/core/types";

interface UsePaymentsOptions {
  type?: string;
  status?: string;
  limit?: number;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { user } = useAuth();
  const { type, status, limit = 50 } = options;

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["core-payments", user?.id, type, status],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (type) query = query.eq("type", type);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_usd || 0), 0);

  return { payments, isLoading, totalPaid };
}
