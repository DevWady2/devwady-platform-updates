/**
 * Re-export from core — single source of truth for notifications hook.
 * Legacy consumers import from "@/hooks/useNotifications".
 */
import { useCoreNotifications } from "@/core/hooks/useNotifications";

export function useNotifications() {
  return useCoreNotifications();
}
