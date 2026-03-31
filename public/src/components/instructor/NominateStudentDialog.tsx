/**
 * NominateStudentDialog — Lightweight dialog for instructor to nominate
 * one or more students for a job opportunity with a short recommendation note.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { MOCK_INSTRUCTOR_ELIGIBLE_STUDENTS } from "@/data/mockData";

interface NominateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  jobTags?: string[]; // reserved for future tag-based student filtering
  isSampleContext?: boolean;
}

export default function NominateStudentDialog({
  open,
  onOpenChange,
  jobTitle,
  jobTags: _jobTags = [],
  isSampleContext = false,
}: NominateStudentDialogProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const students = isSampleContext ? MOCK_INSTRUCTOR_ELIGIBLE_STUDENTS : [];

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const handleSubmit = () => {
    if (selected.length === 0) return;
    toast.success(
      isAr
        ? `تم ترشيح ${selected.length} طالب بنجاح`
        : `${selected.length} student${selected.length > 1 ? "s" : ""} nominated successfully`
    );
    setSelected([]);
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            {isAr ? "ترشيح طالب" : "Nominate Student"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? `ترشيح لفرصة: ${jobTitle}` : `Nominating for: ${jobTitle}`}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-56 overflow-y-auto">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isAr ? "لا طلاب مؤهلون حالياً" : "No eligible students found"}
            </p>
          ) : (
            students.map((s) => (
              <label
                key={s.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selected.includes(s.id)}
                  onCheckedChange={() => toggle(s.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.course}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {s.skills.slice(0, 3).map((sk) => (
                      <Badge key={sk} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {s.progress_pct}%
                </span>
              </label>
            ))
          )}
        </div>

        <Textarea
          placeholder={
            isAr
              ? "ملاحظة / توصية مختصرة (اختياري)..."
              : "Short recommendation note (optional)..."
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[60px] text-sm"
        />

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button size="sm" disabled={selected.length === 0} onClick={handleSubmit}>
            <Send className="h-3.5 w-3.5" />
            {isAr
              ? `ترشيح (${selected.length})`
              : `Nominate (${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
