/**
 * ContactIntakeForm — Reusable contact/request intake form.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContactIntake } from "@/core/hooks/useContactIntake";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import type { IntakeFormData } from "@/core/types";

interface Props {
  /** Pre-fill fields */
  defaults?: Partial<IntakeFormData>;
  /** Title override */
  title_en?: string;
  title_ar?: string;
  /** Submit button text */
  submitLabel_en?: string;
  submitLabel_ar?: string;
  /** Callback on success */
  onSuccess?: () => void;
  compact?: boolean;
}

export default function ContactIntakeForm({
  defaults = {},
  title_en = "Get in Touch",
  title_ar = "تواصل معنا",
  submitLabel_en = "Send Message",
  submitLabel_ar = "إرسال الرسالة",
  onSuccess,
  compact = false,
}: Props) {
  const { lang } = useLanguage();
  const { submitContact } = useContactIntake();
  const isAr = lang === "ar";

  const [form, setForm] = useState<IntakeFormData>({
    name: defaults.name ?? "",
    email: defaults.email ?? "",
    phone: defaults.phone ?? "",
    subject: defaults.subject ?? "",
    message: defaults.message ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate(form, {
      onSuccess: () => {
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        onSuccess?.();
      },
    });
  };

  const fields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{isAr ? "الاسم" : "Name"} *</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{isAr ? "الهاتف" : "Phone"}</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{isAr ? "الموضوع" : "Subject"}</Label>
          <Input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{isAr ? "الرسالة" : "Message"} *</Label>
        <Textarea
          required
          rows={compact ? 3 : 5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={submitContact.isPending} className="w-full sm:w-auto">
        {submitContact.isPending ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 me-2" />
        )}
        {isAr ? submitLabel_ar : submitLabel_en}
      </Button>
    </form>
  );

  if (compact) return fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? title_ar : title_en}</CardTitle>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
