import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Mail, Lock, User, Building2, GraduationCap, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { signupFormSchema, extractErrors } from "@/lib/validations";

type SignupAccountType = "freelancer" | "company" | "student";

const accountTypeConfig: Record<SignupAccountType, { icon: typeof User; labelEn: string; labelAr: string }> = {
  freelancer: { icon: User, labelEn: "Freelancer", labelAr: "مستقل" },
  company: { icon: Building2, labelEn: "Company", labelAr: "شركة" },
  student: { icon: GraduationCap, labelEn: "Student", labelAr: "طالب" },
};

interface SignupFormProps {
  accountType: SignupAccountType;
  redirect?: string;
}

export default function SignupForm({ accountType, redirect: _redirect = "" }: SignupFormProps) {
  const { signUp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const config = accountTypeConfig[accountType];
  const Icon = config.icon;
  const isCompany = accountType === "company";

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const data: any = { email, password };
    if (isCompany) data.company_name = companyName;
    else data.full_name = fullName;

    const result = signupFormSchema.safeParse(data);
    if (!result.success) {
      const errs = extractErrors(result.error);
      setFieldErrors(errs);
      toast.error(result.error.issues[0].message);
      return;
    }

    if (!isCompany && (!fullName || fullName.trim().length < 2)) {
      setFieldErrors({ full_name: isAr ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters" });
      toast.error(isAr ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters");
      return;
    }
    if (isCompany && (!companyName || companyName.trim().length < 2)) {
      setFieldErrors({ company_name: isAr ? "اسم الشركة يجب أن يكون حرفين على الأقل" : "Company name must be at least 2 characters" });
      toast.error(isAr ? "اسم الشركة يجب أن يكون حرفين على الأقل" : "Company name must be at least 2 characters");
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const meta = { full_name: isCompany ? companyName : fullName, account_type: accountType };
    const { error: signUpError } = await signUp(email, password, meta);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      if (isCompany) {
        await supabase.from("company_profiles").insert({ user_id: newUser.id, company_name: companyName });
      }
    const templateName = isCompany ? "welcome_company" : accountType === "student" ? "welcome_student" : "welcome_freelancer";
    supabase.functions.invoke("send-email", {
      body: {
        to: email,
        template: templateName,
        data: { name: isCompany ? companyName : fullName, company_name: isCompany ? companyName : undefined, lang },
      },
    }).catch(() => {});
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/post-login");
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">
          {isCompany
            ? (isAr ? "حسابك قيد المراجعة" : "Account Under Review")
            : (isAr ? "تحقق من بريدك" : "Check Your Email")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isCompany
            ? (isAr ? "حساب شركتك قيد المراجعة. عادة ما يستغرق الأمر 24-48 ساعة. سنخبرك عبر البريد الإلكتروني عند الموافقة." : "Your company account is being reviewed. This usually takes 24-48 hours. We'll notify you by email once approved.")
            : (isAr ? "تم إرسال رابط التأكيد إلى بريدك الإلكتروني." : "We've sent a confirmation link to your email.")}
        </p>
        <Link to="/login">
          <Button variant="outline" className="rounded-full">{isAr ? "العودة لتسجيل الدخول" : "Back to Login"}</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">
          {isAr ? `إنشاء حساب ${config.labelAr}` : `Create ${config.labelEn} Account`}
        </h1>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isAr ? config.labelAr : config.labelEn}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isCompany ? (
          <div>
            <div className="relative">
              <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isAr ? "اسم الشركة" : "Company Name"} value={companyName} onChange={(e) => { setCompanyName(e.target.value); clearFieldError("company_name"); }} className="ps-10" disabled={loading} />
            </div>
            {fieldErrors.company_name && <p className="text-sm text-destructive mt-1">{fieldErrors.company_name}</p>}
          </div>
        ) : (
          <div>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isAr ? "الاسم الكامل" : "Full Name"} value={fullName} onChange={(e) => { setFullName(e.target.value); clearFieldError("full_name"); }} className="ps-10" disabled={loading} />
            </div>
            {fieldErrors.full_name && <p className="text-sm text-destructive mt-1">{fieldErrors.full_name}</p>}
          </div>
        )}
        <div>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} className="ps-10" disabled={loading} />
          </div>
          {fieldErrors.email && <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }} className="ps-10" minLength={6} disabled={loading} />
          </div>
          {fieldErrors.password && <p className="text-sm text-destructive mt-1">{fieldErrors.password}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full gradient-brand text-primary-foreground rounded-full" disabled={loading}>
          {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري إنشاء الحساب..." : "Creating account..."}</> : <>{isAr ? "إنشاء حساب" : "Create Account"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isAr ? "تسجيل الدخول عبر الشبكات الاجتماعية قريباً" : "Social login coming soon"}
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          {isAr ? "سجل دخول" : "Sign In"}
        </Link>
      </p>
    </div>
  );
}
