import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type AppRole = "individual" | "company" | "admin" | "expert" | "student" | "instructor";

interface ProfileCompleteness {
  score: number;
  total: 100;
  percentage: number;
  missingFields: string[];
  nextStep: string | null;
  loading: boolean;
}

const labels = {
  en: {
    full_name: "Full name",
    avatar_url: "Profile photo",
    skills: "Your skills (add at least 3)",
    skills_1: "Add at least 1 interest",
    links: "Professional link (portfolio, LinkedIn, or GitHub)",
    bio: "Bio / about you",
    location: "Location",
    hourly_rate: "Hourly rate",
    phone: "Phone number",
    track: "Professional track",
    company_name: "Company name",
    logo_url: "Company logo",
    industry: "Industry",
    description: "Company description",
    website: "Company website",
    contact_email: "Contact email",
    contact_phone: "Contact phone",
    employee_count: "Employee count",
    founded_year: "Founded year",
    expert_avatar: "Expert profile photo",
    expert_bio: "Expert bio (min 50 chars)",
    specializations: "Specializations (at least 2)",
    linkedin_url: "LinkedIn profile",
    github_url: "GitHub profile",
    years_experience: "Years of experience",
    availability: "Availability (at least 3 slots)",
    expert_email: "Contact email",
    portfolio_url: "Portfolio / website",
    expertise_areas: "Expertise areas (at least 2)",
    has_course: "Create at least one course",
  },
  ar: {
    full_name: "الاسم الكامل",
    avatar_url: "صورة الملف الشخصي",
    skills: "المهارات (أضف 3 على الأقل)",
    skills_1: "أضف اهتمام واحد على الأقل",
    links: "رابط مهني (معرض أعمال أو لينكدإن أو جيتهب)",
    bio: "نبذة عنك",
    location: "الموقع",
    hourly_rate: "سعر الساعة",
    phone: "رقم الهاتف",
    track: "المسار المهني",
    company_name: "اسم الشركة",
    logo_url: "شعار الشركة",
    industry: "القطاع",
    description: "وصف الشركة",
    website: "موقع الشركة",
    contact_email: "البريد الإلكتروني للتواصل",
    contact_phone: "رقم هاتف التواصل",
    employee_count: "عدد الموظفين",
    founded_year: "سنة التأسيس",
    expert_avatar: "صورة الخبير",
    expert_bio: "نبذة عن الخبير (50 حرف كحد أدنى)",
    specializations: "التخصصات (2 على الأقل)",
    linkedin_url: "حساب لينكدإن",
    github_url: "حساب جيتهب",
    years_experience: "سنوات الخبرة",
    availability: "التوفر (3 مواعيد على الأقل)",
    expert_email: "البريد الإلكتروني",
    portfolio_url: "معرض الأعمال / الموقع",
    expertise_areas: "مجالات الخبرة (2 على الأقل)",
    has_course: "أنشئ دورة واحدة على الأقل",
  },
};

const has = (v: unknown): boolean => typeof v === "string" && v.length > 0;

export function useProfileCompleteness(forRole?: AppRole): ProfileCompleteness {
  const { user, role: primaryRole, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const l = labels[lang] ?? labels.en;
  const targetRole = forRole ?? primaryRole;

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["completeness-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: company, isLoading: cLoading } = useQuery({
    queryKey: ["completeness-company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("company_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user && targetRole === "company",
    staleTime: 60_000,
  });

  const { data: expert, isLoading: eLoading } = useQuery({
    queryKey: ["completeness-expert", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("consulting_experts").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user && targetRole === "expert",
    staleTime: 60_000,
  });

  const { data: availCount } = useQuery({
    queryKey: ["completeness-expert-avail", expert?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("expert_availability")
        .select("id", { count: "exact", head: true })
        .eq("expert_id", expert!.id)
        .eq("is_active", true);
      return count ?? 0;
    },
    enabled: !!expert?.id,
    staleTime: 60_000,
  });

  const { data: courseCount } = useQuery({
    queryKey: ["completeness-instructor-courses", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("training_courses")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user && targetRole === "instructor",
    staleTime: 60_000,
  });

  const loading =
    authLoading ||
    pLoading ||
    (targetRole === "company" && cLoading) ||
    (targetRole === "expert" && eLoading);

  if (loading || !profile) {
    return { score: 0, total: 100, percentage: 0, missingFields: [], nextStep: null, loading: true };
  }

  if (targetRole === "admin") {
    return { score: 100, total: 100, percentage: 100, missingFields: [], nextStep: null, loading: false };
  }

  const missing: { label: string; pts: number }[] = [];
  let score = 0;

  const check = (ok: boolean, label: string, pts: number) => {
    if (ok) score += pts;
    else missing.push({ label, pts });
  };

  switch (targetRole) {
    case "company": {
      check(has(company?.company_name), l.company_name, 15);
      check(has(company?.logo_url), l.logo_url, 15);
      check(has(profile.full_name), l.full_name, 10);
      check(has(profile.avatar_url), l.avatar_url, 5);
      check(has(company?.industry), l.industry, 10);
      check(has(company?.description), l.description, 10);
      check(has(company?.website), l.website, 10);
      check(has(company?.contact_email), l.contact_email, 5);
      check(has(company?.contact_phone), l.contact_phone, 5);
      check(has(company?.location), l.location, 5);
      check(has(company?.employee_count), l.employee_count, 5);
      check(company?.founded_year != null, l.founded_year, 5);
      break;
    }
    case "student": {
      check(has(profile.full_name), l.full_name, 25);
      check(has(profile.avatar_url), l.avatar_url, 20);
      check(has(profile.bio), l.bio, 15);
      check(has(profile.location), l.location, 10);
      check(has(profile.phone), l.phone, 10);
      check(has(profile.track), l.track, 10);
      check(Array.isArray(profile.skills) && profile.skills.length >= 1, l.skills_1, 10);
      break;
    }
    case "expert": {
      check(has(expert?.avatar_url), l.expert_avatar, 15);
      check(has(expert?.bio) && (expert?.bio?.length ?? 0) >= 50, l.expert_bio, 15);
      check(Array.isArray(expert?.specializations) && (expert?.specializations?.length ?? 0) >= 2, l.specializations, 15);
      check(has(expert?.linkedin_url), l.linkedin_url, 10);
      check((expert?.years_experience ?? 0) > 0, l.years_experience, 10);
      check(has(expert?.github_url), l.github_url, 5);
      check((availCount ?? 0) >= 3, l.availability, 20);
      check(has(expert?.email), l.expert_email, 10);
      break;
    }
    case "instructor": {
      check(has(profile.full_name), l.full_name, 15);
      check(has(profile.avatar_url), l.avatar_url, 15);
      check(has(profile.bio), l.bio, 15);
      check(Array.isArray(profile.skills) && profile.skills.length >= 2, l.expertise_areas, 15);
      check(has(profile.linkedin_url), l.linkedin_url, 10);
      check(has(profile.portfolio_url), l.portfolio_url, 10);
      check(has(profile.location), l.location, 5);
      check(has(profile.phone), l.phone, 5);
      check((courseCount ?? 0) >= 1, l.has_course, 10);
      break;
    }
    default: {
      const hasLink = has(profile.portfolio_url) || has(profile.linkedin_url) || has(profile.github_url);
      check(has(profile.full_name), l.full_name, 15);
      check(has(profile.avatar_url), l.avatar_url, 15);
      check(Array.isArray(profile.skills) && profile.skills.length >= 3, l.skills, 15);
      check(hasLink, l.links, 15);
      check(has(profile.bio), l.bio, 10);
      check(has(profile.location), l.location, 10);
      check(has(profile.hourly_rate), l.hourly_rate, 10);
      check(has(profile.phone), l.phone, 5);
      check(has(profile.track), l.track, 5);
      break;
    }
  }

  missing.sort((a, b) => b.pts - a.pts);
  const missingFields = missing.map((m) => m.label);

  return {
    score,
    total: 100,
    percentage: score,
    missingFields,
    nextStep: missingFields[0] ?? null,
    loading: false,
  };
}
