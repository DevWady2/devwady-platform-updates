/**
 * JobPostDialog — Form dialog for creating a new job posting.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { JOB_TYPES, EXPERIENCE_LEVELS } from "../constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

const INITIAL = {
  title: "",
  title_ar: "",
  type: "full-time",
  experience_level: "",
  location: "",
  salary_range: "",
  description: "",
  is_urgent: false,
  requirements: [] as string[],
  tags: [] as string[],
};

export default function JobPostDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...INITIAL });
  const [reqInput, setReqInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const set = <K extends keyof typeof INITIAL>(k: K, v: (typeof INITIAL)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addTag = (list: "requirements" | "tags", value: string) => {
    const v = value.trim();
    if (!v || form[list].includes(v)) return;
    set(list, [...form[list], v]);
  };

  const removeTag = (list: "requirements" | "tags", value: string) =>
    set(list, form[list].filter((t) => t !== value));

  const createJob = useMutation({
    mutationFn: async () => {
      if (!form.title.trim())
        throw new Error(isAr ? "العنوان مطلوب" : "Title is required");
      if (!form.type)
        throw new Error(isAr ? "النوع مطلوب" : "Type is required");
      const { error } = await supabase.from("job_postings").insert({
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        type: form.type,
        location: form.location.trim() || null,
        salary_range: form.salary_range.trim() || null,
        description: form.description.trim() || null,
        requirements: form.requirements.length ? form.requirements : null,
        tags: form.tags.length ? form.tags : null,
        is_active: true,
        is_urgent: form.is_urgent,
        company_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-company-jobs"] });
      toast.success(isAr ? "تم نشر الوظيفة" : "Job posted successfully");
      setForm({ ...INITIAL });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleClose = () => {
    if (!createJob.isPending) {
      setForm({ ...INITIAL });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAr ? "نشر وظيفة جديدة" : "Post a New Job"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>{isAr ? "عنوان الوظيفة" : "Job Title"} *</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={isAr ? "مطور React أول" : "Senior React Developer"}
            />
          </div>

          {/* Title AR */}
          <div className="space-y-1.5">
            <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
            <Input
              dir="rtl"
              value={form.title_ar}
              onChange={(e) => set("title_ar", e.target.value)}
              placeholder="مطور React أول"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>{isAr ? "نوع العمل" : "Employment Type"} *</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {isAr ? t.ar : t.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <Label>{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
            <Select value={form.experience_level} onValueChange={(v) => set("experience_level", v)}>
              <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {isAr ? l.ar : l.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>{isAr ? "الموقع" : "Location"}</Label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder={isAr ? "عن بعد، القاهرة، الرياض..." : "Remote, Cairo, Riyadh..."}
            />
          </div>

          {/* Salary */}
          <div className="space-y-1.5">
            <Label>{isAr ? "نطاق الراتب" : "Salary Range"}</Label>
            <Input
              value={form.salary_range}
              onChange={(e) => set("salary_range", e.target.value)}
              placeholder="$2,000 - $4,000/mo"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>{isAr ? "الوصف" : "Description"}</Label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={isAr ? "وصف الوظيفة والمسؤوليات..." : "Describe the role and responsibilities..."}
            />
          </div>

          {/* Requirements tag input */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>{isAr ? "المتطلبات" : "Requirements"}</Label>
            <Input
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("requirements", reqInput);
                  setReqInput("");
                }
              }}
              placeholder={isAr ? "اضغط Enter لإضافة متطلب" : "Press Enter to add requirement"}
            />
            {form.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.requirements.map((r) => (
                  <Badge key={r} variant="secondary" className="gap-1 pe-1">
                    {r}
                    <button type="button" onClick={() => removeTag("requirements", r)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags input */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>{isAr ? "المهارات والعلامات" : "Skills & Tags"}</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("tags", tagInput);
                  setTagInput("");
                }
              }}
              placeholder={isAr ? "اضغط Enter لإضافة مهارة" : "Press Enter to add skill"}
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.tags.map((t) => (
                  <Badge key={t} variant="outline" className="gap-1 pe-1">
                    {t}
                    <button type="button" onClick={() => removeTag("tags", t)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Urgent toggle */}
          <div className="sm:col-span-2 flex items-center gap-3">
            <Switch checked={form.is_urgent} onCheckedChange={(v) => set("is_urgent", v)} />
            <Label className="cursor-pointer">{isAr ? "وظيفة عاجلة" : "Mark as Urgent"}</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={createJob.isPending}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={() => createJob.mutate()} disabled={createJob.isPending}>
            {createJob.isPending && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
            {isAr ? "نشر الوظيفة" : "Post Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
