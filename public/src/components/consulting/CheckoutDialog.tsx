import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Shield, User, Mail, Phone, MessageSquare, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expert: {
    name: string;
    name_ar: string;
    role: string;
    role_ar: string;
    session_rate_usd: number;
    session_duration_minutes: number;
    track: string;
    track_ar: string;
    initials: string;
  };
  selectedDate: Date;
  selectedSlot: string;
  onSubmit: (guest: { name: string; email: string; phone: string; notes: string }) => void;
  isSubmitting: boolean;
}

export default function CheckoutDialog({
  open,
  onOpenChange,
  expert,
  selectedDate,
  selectedSlot,
  onSubmit,
  isSubmitting,
}: CheckoutDialogProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  const rate = expert.session_rate_usd;
  const serviceFee = Math.round(rate * 0.05);
  const total = rate + serviceFee;

  const hour = parseInt(selectedSlot?.split(":")[0] || "0");
  const ampm = hour >= 12 ? (isAr ? "م" : "PM") : (isAr ? "ص" : "AM");
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const timeLabel = `${h12}:00 ${ampm}`;

  const handleSubmit = () => {
    onSubmit({ name: guestName, email: guestEmail, phone: guestPhone, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isAr ? "إتمام الحجز" : "Checkout"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isAr ? "تفاصيل حجز الجلسة الاستشارية" : "Consulting session booking details"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator className="my-3" />

        <div className="px-6 pb-6 space-y-5">
          {/* Session summary card */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                {expert.initials}
              </div>
              <div>
                <p className="font-semibold text-sm">{isAr ? expert.name_ar : expert.name}</p>
                <p className="text-xs text-muted-foreground">{isAr ? expert.role_ar : expert.role}</p>
              </div>
              <Badge variant="outline" className="ms-auto text-[10px] text-primary border-primary/30">
                {isAr ? expert.track_ar : expert.track}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(selectedDate, "d MMM yyyy", { locale: isAr ? ar : enUS })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeLabel}</span>
              </div>
            </div>
          </div>

          {/* Guest details */}
          {!user && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {isAr ? "يمكنك الحجز بدون تسجيل دخول" : "Book without signing in"}{" · "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  {isAr ? "تسجيل الدخول" : "Sign in"}
                </Link>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" />{isAr ? "الاسم *" : "Name *"}</Label>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={isAr ? "اسمك" : "Full name"} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{isAr ? "البريد *" : "Email *"}</Label>
                  <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="email@example.com" className="mt-1 h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{isAr ? "الهاتف" : "Phone (optional)"}</Label>
                <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" className="mt-1 h-9 text-sm" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" />{isAr ? "ملاحظات" : "Notes (optional)"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? "ما الذي تريد مناقشته؟" : "What would you like to discuss?"} className="mt-1 text-sm" rows={2} />
          </div>

          <Separator />

          {/* Protected badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "حجزك محمي بواسطة" : "Your booking is protected by"}{" "}
            <span className="font-bold text-foreground">DevWady</span>
          </div>

          <Separator />

          {/* Price details */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm">{isAr ? "تفاصيل السعر" : "Price Details"}</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "رسوم الجلسة" : "Session Fee"}</span>
              <span>USD {rate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "رسوم الخدمة" : "Service Fee"}</span>
              <span>USD {serviceFee}</span>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">{isAr ? "الإجمالي" : "Total"}</span>
            <span className="text-2xl font-bold text-primary">USD {total}</span>
          </div>

          {/* Stripe redirect note */}
          {rate > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
              {isAr ? "سيتم توجيهك لصفحة الدفع الآمنة عبر Stripe" : "You will be redirected to secure Stripe payment"}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl text-base h-12 gradient-brand hover:opacity-90 text-primary-foreground"
            size="lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAr ? "جاري التحويل للدفع..." : "Redirecting to payment..."}
              </span>
            ) : rate > 0 ? (
              isAr ? "المتابعة للدفع" : "Proceed to Payment"
            ) : (
              isAr ? "تأكيد الحجز" : "Book Session"
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            {rate > 0
              ? (isAr ? "ستتم معالجة الدفع بشكل آمن عبر Stripe" : "Payment processed securely via Stripe")
              : (isAr ? "سيتم التواصل معك لتأكيد الجلسة" : "We'll contact you to confirm your session")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
