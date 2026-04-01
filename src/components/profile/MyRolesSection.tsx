import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User, Building2, GraduationCap, BookOpen, Shield, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const t = (lang: string, en: string, ar: string) => (lang === "ar" ? ar : en);

const accountConfig: Record<string, { icon: LucideIcon; en: string; ar: string; onboarding: string }> = {
  freelancer: { icon: User, en: "Freelancer", ar: "مستقل", onboarding: "/onboarding/freelancer" },
  company: { icon: Building2, en: "Company", ar: "شركة", onboarding: "/onboarding/company" },
  student: { icon: GraduationCap, en: "Student", ar: "طالب", onboarding: "/onboarding/student" },
  instructor: { icon: BookOpen, en: "Instructor", ar: "مدرب", onboarding: "/onboarding/instructor" },
  expert: { icon: Shield, en: "Expert", ar: "خبير", onboarding: "/onboarding/expert" },
  admin: { icon: Shield, en: "Admin", ar: "مشرف", onboarding: "/admin" },
};

function MiniRing({ percentage, size = 36 }: { percentage: number; size?: number }) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  if (percentage >= 100) {
    return (
      <div className="rounded-full bg-green-500/15 flex items-center justify-center" style={{ width: size, height: size }}>
        <Check className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">{percentage}</span>
    </div>
  );
}

export default function MyRolesSection() {
  const { accountType } = useAuth();
  const { lang } = useLanguage();
  const { percentage, loading } = useProfileCompleteness(accountType ?? undefined);

  if (!accountType) return null;

  const cfg = accountConfig[accountType] || accountConfig.freelancer;
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-card rounded-2xl border border-border p-6">
      <h2 className="font-bold text-lg mb-4">{t(lang, "Account Type", "نوع الحساب")}</h2>
      <div className="flex flex-wrap gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-3 min-w-[140px]">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{lang === "ar" ? cfg.ar : cfg.en}</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0">{t(lang, "Active", "نشط")}</Badge>
          {!loading && <MiniRing percentage={percentage} />}
          {percentage < 50 && (
            <Button size="sm" variant="outline" className="text-xs w-full" asChild>
              <Link to={cfg.onboarding}>{t(lang, "Complete setup", "أكمل الإعداد")}</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
