import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  onSaved: () => void;
}

export default function RatingDialog({ open, onClose, bookingId, onSaved }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error(isAr ? "يرجى اختيار تقييم" : "Please select a rating");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("consulting_bookings")
      .update({ rating, review: review.trim() || null, reviewed_at: new Date().toISOString() })
      .eq("id", bookingId);
    setSaving(false);
    if (error) {
      toast.error(isAr ? "فشل إرسال التقييم" : "Failed to submit rating");
      return;
    }
    toast.success(isAr ? "شكراً لتقييمك!" : "Thank you for your feedback!");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isAr ? "قيّم الجلسة" : "Rate this session"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star className={`h-8 w-8 ${s <= (hover || rating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
          <div>
            <Label>{isAr ? "ملاحظاتك (اختياري)" : "Your review (optional)"}</Label>
            <Textarea
              value={review}
              onChange={e => setReview(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              placeholder={isAr ? "شاركنا تجربتك..." : "Share your experience..."}
            />
            <p className="text-[10px] text-muted-foreground text-end mt-1">{review.length}/500</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSubmit} disabled={saving || rating < 1}>
              {saving && <Loader2 className="h-4 w-4 animate-spin me-1" />}
              {isAr ? "إرسال" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
