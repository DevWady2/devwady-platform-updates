export type CanonicalAccountType = "freelancer" | "company" | "admin" | "expert" | "student" | "instructor";
export type LegacyAppRole = "individual" | "company" | "admin" | "expert" | "student" | "instructor";

export function normalizeAccountType(value?: string | null): CanonicalAccountType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "individual") return "freelancer";
  if (["freelancer", "company", "admin", "expert", "student", "instructor"].includes(normalized)) {
    return normalized as CanonicalAccountType;
  }
  return null;
}

export function legacyRoleFromAccountType(accountType?: string | null): LegacyAppRole | null {
  const normalized = normalizeAccountType(accountType);
  if (!normalized) return null;
  return normalized === "freelancer" ? "individual" : normalized;
}

export const accountTypeLabels: Record<CanonicalAccountType, { en: string; ar: string }> = {
  freelancer: { en: "Freelancer", ar: "مستقل" },
  company: { en: "Company", ar: "شركة" },
  admin: { en: "Admin", ar: "مشرف" },
  expert: { en: "Expert", ar: "خبير" },
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "مدرب" },
};

export function getAccountTypeLabel(accountType?: string | null, lang: "en" | "ar" = "en") {
  const normalized = normalizeAccountType(accountType);
  return normalized ? accountTypeLabels[normalized][lang] : null;
}
