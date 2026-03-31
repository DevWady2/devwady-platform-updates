import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export const signupFormSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  company_name: z.string().trim().min(2, "Company name must be at least 2 characters").max(100).optional(),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bookingFormSchema = z.object({
  expert_id: z.string().uuid("Invalid expert"),
  booking_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Time is required"),
  guest_name: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  guest_email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  guest_phone: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;

/** Extract field errors from a ZodError into a Record<string, string> */
export function extractErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString();
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
