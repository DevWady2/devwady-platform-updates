import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Option { value: string; label_en: string; label_ar: string }

interface InvitationFormProps {
  courses: any[];
  courseId: string;
  onCourseChange: (v: string) => void;
  selectedCourse: any;
  supportScope: string;
  onSupportScopeChange: (v: string) => void;
  duration: string;
  onDurationChange: (v: string) => void;
  compensation: string;
  onCompensationChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  isAr: boolean;
  durationOptions: Option[];
  compensationOptions: Option[];
}

export default function InvitationForm({
  courses, courseId, onCourseChange, selectedCourse,
  supportScope, onSupportScopeChange,
  duration, onDurationChange,
  compensation, onCompensationChange,
  message, onMessageChange,
  isAr, durationOptions, compensationOptions,
}: InvitationFormProps) {
  return (
    <>
      {/* Course selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {isAr ? "الدورة *" : "Course *"}
        </Label>
        <Select value={courseId} onValueChange={onCourseChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={isAr ? "اختر دورة..." : "Select course..."} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c: any) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">
                {isAr ? (c.title_ar || c.title_en) : c.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourse && (
          <p className="text-[10px] text-primary">
            {isAr
              ? `ادعُ هذا المستقل لدعم الطلاب في ${selectedCourse.title_ar || selectedCourse.title_en}`
              : `Invite this freelancer to support students in ${selectedCourse.title_en}`}
          </p>
        )}
      </div>

      {/* Support scope */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {isAr ? "نطاق الدعم" : "Support Scope"}
        </Label>
        <Input
          placeholder={isAr ? "مثال: الرد على الأسئلة التقنية ومراجعة الكود" : "e.g. Answer technical questions and review code"}
          value={supportScope}
          onChange={(e) => onSupportScopeChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Duration + Compensation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {isAr ? "المدة" : "Duration"}
          </Label>
          <Select value={duration} onValueChange={onDurationChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={isAr ? "اختر..." : "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-sm">
                  {isAr ? d.label_ar : d.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {isAr ? "نوع التعويض" : "Compensation"}
          </Label>
          <Select value={compensation} onValueChange={onCompensationChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={isAr ? "اختر..." : "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {compensationOptions.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-sm">
                  {isAr ? c.label_ar : c.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {isAr ? "رسالة (اختياري)" : "Message (optional)"}
        </Label>
        <Textarea
          placeholder={isAr ? "اكتب رسالة مخصصة للمستقل..." : "Write a personalized message to the freelancer..."}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>
    </>
  );
}
