import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Loader2, X } from "lucide-react";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "freelancer" | "company";
  targetName: string;
  hireRequestId: string;
  targetUserId: string;
  skills?: string[];
  onSuccess: () => void;
}

export default function ReviewDialog({
  open, onOpenChange, type, targetName, hireRequestId, targetUserId, skills = [], onSuccess,
}: ReviewDialogProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setReview("");
    setSelectedSkills([]);
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error(isAr ? "يرجى اختيار تقييم" : "Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      if (type === "freelancer") {
        const { error } = await supabase.from("freelancer_reviews").insert({
          freelancer_user_id: targetUserId,
          reviewer_user_id: user.id,
          hire_request_id: hireRequestId,
          rating,
          title: title || null,
          review: review || null,
          skills_demonstrated: selectedSkills.length > 0 ? selectedSkills : [],
        });
        if (error) throw error;
        await supabase.from("hire_requests").update({ is_reviewed_by_company: true }).eq("id", hireRequestId);
      } else {
        const { error } = await supabase.from("company_reviews").insert({
          company_user_id: targetUserId,
          reviewer_user_id: user.id,
          hire_request_id: hireRequestId,
          rating,
          title: title || null,
          review: review || null,
        });
        if (error) throw error;
        await supabase.from("hire_requests").update({ is_reviewed_by_freelancer: true }).eq("id", hireRequestId);
      }
      toast.success(isAr ? "تم إرسال التقييم بنجاح" : "Review submitted successfully");
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل إرسال التقييم" : "Failed to submit review"));
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? `تقييم ${targetName}` : `Review ${targetName}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star rating */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">{isAr ? "تقييمك" : "Your rating"}</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star className={`h-8 w-8 transition-colors ${s <= displayRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {displayRating === 1 ? "Poor" : displayRating === 2 ? "Fair" : displayRating === 3 ? "Good" : displayRating === 4 ? "Very Good" : "Excellent"}
              </p>
            )}
          </div>

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? "ملخص تجربتك" : "Summarize your experience"}
            maxLength={100}
          />

          {/* Review text */}
          <div>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={isAr ? "شارك تفاصيل تجربتك في العمل معاً..." : "Share details about working together..."}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-end">{review.length}/1000</p>
          </div>

          {/* Skills demonstrated (only for freelancer reviews) */}
          {type === "freelancer" && skills.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{isAr ? "المهارات المُظهرة" : "Skills demonstrated"}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <Badge key={sk} variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${isSelected ? "" : "hover:bg-accent"}`}
                      onClick={() => setSelectedSkills((prev) => isSelected ? prev.filter((s) => s !== sk) : [...prev, sk])}
                    >
                      {sk}
                      {isSelected && <X className="h-3 w-3 ms-1" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
            {isAr ? "إرسال التقييم" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
