import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ExistingStateNoticeProps {
  status: string;
  isAr: boolean;
}

const CONFIG: Record<string, {
  icon: typeof AlertCircle;
  className: string;
  en: string;
  ar: string;
}> = {
  pending: {
    icon: AlertCircle,
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    en: "A pending invitation already exists for this freelancer on this course. You cannot send another until it is responded to.",
    ar: "توجد دعوة معلّقة بالفعل لهذا المستقل في هذه الدورة. لا يمكن إرسال أخرى حتى يتم الرد عليها.",
  },
  accepted: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    en: "This freelancer is already assigned as an assistant for this course.",
    ar: "هذا المستقل معيّن بالفعل كمساعد في هذه الدورة.",
  },
  declined: {
    icon: XCircle,
    className: "border-muted bg-muted/30 text-muted-foreground",
    en: "A previous invitation was declined. You may send a new one if appropriate.",
    ar: "تم رفض دعوة سابقة. يمكنك إرسال دعوة جديدة إذا كان ذلك مناسباً.",
  },
};

export default function ExistingStateNotice({ status, isAr }: ExistingStateNoticeProps) {
  const config = CONFIG[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${config.className}`}
         data-testid="existing-state-notice"
         data-status={status}>
      <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
      <p>{isAr ? config.ar : config.en}</p>
    </div>
  );
}
