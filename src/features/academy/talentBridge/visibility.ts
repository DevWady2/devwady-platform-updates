/**
 * Academy Talent Bridge — Talent Profile Visibility
 *
 * Controls how much of a student's academy performance is
 * visible within internal talent-bridge surfaces. Privacy-safe by default:
 * students start as "private" and must explicitly opt in.
 *
 * "opportunity_ready" enables internal matching hints, NOT public exposure.
 * No student data is shared externally in this preparation phase.
 */

export const VISIBILITY_STATES = [
  "private",
  "academy_only",
  "opportunity_ready",
] as const;

export type TalentVisibility = (typeof VISIBILITY_STATES)[number];

export const VISIBILITY_LABELS: Record<TalentVisibility, { en: string; ar: string }> = {
  private:           { en: "Private",           ar: "خاص" },
  academy_only:      { en: "Academy Only",      ar: "الأكاديمية فقط" },
  opportunity_ready: { en: "Open to Opportunities", ar: "مفتوح للفرص" },
};

export const VISIBILITY_DESCRIPTIONS: Record<TalentVisibility, { en: string; ar: string }> = {
  private:           { en: "Profile hidden from all talent surfaces. Only you and your instructors can see your progress.",    ar: "الملف مخفي عن جميع أسطح المواهب. فقط أنت ومدرّبوك يمكنهم رؤية تقدّمك." },
  academy_only:      { en: "Visible to instructors and academy admins for internal nominations only.",                          ar: "مرئي للمدرّبين ومشرفي الأكاديمية للترشيحات الداخلية فقط." },
  opportunity_ready: { en: "Your readiness signals and approved nominations are visible to hiring partners.",                   ar: "إشارات جاهزيتك وترشيحاتك المعتمدة مرئية لشركاء التوظيف." },
};

export const VISIBILITY_COLORS: Record<TalentVisibility, string> = {
  private:           "bg-muted text-muted-foreground",
  academy_only:      "bg-blue-500/10 text-blue-600",
  opportunity_ready: "bg-emerald-500/10 text-emerald-600",
};

/** True when the student has opted in to any external visibility. */
export function isExternallyVisible(visibility: TalentVisibility): boolean {
  return visibility === "opportunity_ready";
}

/** True when instructors can see the student for nomination purposes. */
export function isNominationEligible(visibility: TalentVisibility): boolean {
  return visibility !== "private";
}
