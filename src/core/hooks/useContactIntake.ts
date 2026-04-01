/**
 * useContactIntake — Shared hook for submitting contact/request forms.
 */
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IntakeFormData } from "@/core/types";

export function useContactIntake() {
  const submitContact = useMutation({
    mutationFn: async (data: IntakeFormData) => {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          subject: data.subject ?? null,
          message: data.message,
        });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Message sent successfully!"),
    onError: (err: Error) => toast.error(err.message),
  });

  return { submitContact };
}
