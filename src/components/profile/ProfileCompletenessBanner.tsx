import { Link } from "react-router-dom";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { useAuth } from "@/contexts/AuthContext";
import { type AccountType } from "@/core/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const editPaths: Record<AccountType, string> = {
  company: "/company/profile",
  expert: "/expert/profile",
  instructor: "/profile/edit",
  student: "/profile/edit",
  freelancer: "/profile/edit",
  admin: "/profile/edit",
};

export default function ProfileCompletenessBanner() {
  const { user, accountType } = useAuth();
  const { lang } = useLanguage();
  const { percentage, nextStep, loading } = useProfileCompleteness(accountType ?? undefined);
  const isAr = lang === "ar";

  if (!user || loading || percentage >= 100) return null;

  const editPath = accountType ? editPaths[accountType] ?? "/profile/edit" : "/profile/edit";

  return (
    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground truncate">
            {isAr ? "أكمل ملفك الشخصي" : "Complete your profile"}
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {percentage}%
          </span>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-full gap-1.5 shadow-sm">
          <Link to={editPath}>
            {isAr ? "أكمل الآن" : "Complete now"}
            <ArrowRight className="icon-flip-rtl h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-1.5 rounded-full gradient-brand transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {nextStep && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isAr ? "التالي: " : "Next: "}{nextStep}
        </p>
      )}
    </div>
  );
}
