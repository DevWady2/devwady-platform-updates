import { supabase } from "@/integrations/supabase/client";

export async function saveProfileByUserId(userId: string, payload: Record<string, unknown>) {
  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError };
  }

  if (existing?.id) {
    return await supabase.from("profiles").update(payload as never).eq("user_id", userId);
  }

  return await supabase.from("profiles").insert({ user_id: userId, ...(payload as Record<string, unknown>) } as never);
}
