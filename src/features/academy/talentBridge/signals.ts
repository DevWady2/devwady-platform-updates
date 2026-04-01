/**
 * Academy Talent Bridge — Talent Signal Concepts
 *
 * A "talent signal" summarizes a student's readiness for career opportunities
 * based on their academy performance. Derived from readiness signals but
 * expressed in hiring-relevant vocabulary.
 */

/** Canonical talent signal levels, ordered from lowest to highest readiness. */
export const TALENT_SIGNALS = [
  "not_ready_yet",
  "portfolio_ready",
  "nomination_ready",
  "interview_ready",
  "standout_student",
] as const;

export type TalentSignal = (typeof TALENT_SIGNALS)[number];

/** Human-readable labels (EN/AR) for each talent signal. */
export const TALENT_SIGNAL_LABELS: Record<TalentSignal, { en: string; ar: string }> = {
  not_ready_yet:    { en: "Not Ready Yet",    ar: "غير جاهز بعد" },
  portfolio_ready:  { en: "Portfolio Ready",  ar: "جاهز للملف" },
  nomination_ready: { en: "Nomination Ready", ar: "جاهز للترشيح" },
  interview_ready:  { en: "Interview Ready",  ar: "جاهز للمقابلة" },
  standout_student: { en: "Standout Student", ar: "طالب متميز" },
};

/** Short descriptions for tooltips / info popovers. */
export const TALENT_SIGNAL_DESCRIPTIONS: Record<TalentSignal, { en: string; ar: string }> = {
  not_ready_yet:    { en: "Student has not yet met minimum readiness thresholds.",           ar: "لم يستوفِ الطالب الحد الأدنى من الجاهزية بعد." },
  portfolio_ready:  { en: "Has completed enough project work to build a portfolio.",         ar: "أكمل ما يكفي من المشاريع لبناء ملف أعمال." },
  nomination_ready: { en: "Performance supports an instructor nomination.",                  ar: "الأداء يدعم ترشيح المدرّب." },
  interview_ready:  { en: "Strong across assessments, projects, and attendance.",             ar: "قوي في التقييمات والمشاريع والحضور." },
  standout_student: { en: "Exceptional performance — top candidate for opportunities.",      ar: "أداء استثنائي — مرشح متميز للفرص." },
};

/** Semantic badge colors using design-system tokens. */
export const TALENT_SIGNAL_COLORS: Record<TalentSignal, string> = {
  not_ready_yet:    "bg-muted text-muted-foreground",
  portfolio_ready:  "bg-blue-500/10 text-blue-600",
  nomination_ready: "bg-amber-500/10 text-amber-600",
  interview_ready:  "bg-emerald-500/10 text-emerald-600",
  standout_student: "bg-primary/10 text-primary",
};

/** Ordered index for comparison / sorting. */
export function talentSignalRank(signal: TalentSignal): number {
  return TALENT_SIGNALS.indexOf(signal);
}

/** Returns true when the signal meets or exceeds a given threshold. */
export function meetsSignalThreshold(current: TalentSignal, threshold: TalentSignal): boolean {
  return talentSignalRank(current) >= talentSignalRank(threshold);
}
