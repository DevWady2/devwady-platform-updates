import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, ArrowRight, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { loginFormSchema, extractErrors } from "@/lib/validations";

function detectMailProvider(email: string) {
  const d = email.split("@")[1]?.toLowerCase();
  if (!d) return null;
  if (d.includes("gmail")) return { label: "Gmail", url: "https://mail.google.com" };
  if (d.includes("outlook") || d.includes("hotmail") || d.includes("live")) return { label: "Outlook", url: "https://outlook.live.com" };
  if (d.includes("yahoo")) return { label: "Yahoo Mail", url: "https://mail.yahoo.com" };
  return null;
}

export default function Login() {
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isAr = lang === "ar";

  const redirectTarget = searchParams.get("redirect") || "";
  const signupPath = (() => {
    if (redirectTarget.startsWith("/become-instructor")) {
      return "/auth/academy?role=instructor";
    }
    if (redirectTarget.startsWith("/academy")) {
      return "/auth/academy";
    }
    if (redirectTarget.startsWith("/talent") || redirectTarget.startsWith("/hiring")) {
      return "/auth/talent";
    }
    if (redirectTarget.startsWith("/consulting/portal")) {
      return "/auth/consulting?role=expert";
    }
    if (redirectTarget.startsWith("/consulting")) {
      return "/auth/consulting";
    }
    if (
      redirectTarget.startsWith("/enterprise") ||
      redirectTarget.startsWith("/start-project") ||
      redirectTarget.startsWith("/request-service") ||
      redirectTarget.startsWith("/request-status")
    ) {
      return "/auth/enterprise";
    }
    return "/";
  })();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      const errs = extractErrors(result.error);
      setFieldErrors(errs);
      toast.error(result.error.issues[0].message);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(isAr ? "بيانات الدخول غير صحيحة" : error.message);
      setLoading(false);
      return;
    }

    // Check if email is verified
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !user.email_confirmed_at) {
      setShowVerification(true);
      setLoading(false);
      return;
    }

    navigate("/post-login");
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(60);
    toast.success(isAr ? "تم إعادة إرسال رابط التحقق" : "Verification link resent");
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      toast.error(isAr ? "لم يتم التحقق بعد — تحقق من بريدك" : "Not verified yet — check your inbox");
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at) {
      navigate("/post-login");
    } else {
      toast.error(isAr ? "لم يتم التحقق بعد — تحقق من بريدك" : "Not verified yet — check your inbox");
    }
    setLoading(false);
  };

  const mailProvider = detectMailProvider(email);

  // Verification screen
  if (showVerification) {
    return (
      <>
        <SEO title={t("seo.login.title")} />
        <section className="min-h-[80vh] flex items-center justify-center py-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto px-4 text-center">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-amber-500" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">
                {isAr ? "تحقق من بريدك الإلكتروني" : "Verify Your Email"}
              </h2>
              <p className="text-muted-foreground mb-1">
                {isAr ? "يرجى التحقق من بريدك الإلكتروني للوصول إلى حسابك" : "Please verify your email to access your account."}
              </p>
              <p className="font-semibold text-sm mb-6">{email}</p>

              <div className="space-y-3">
                <Button onClick={handleCheckVerification} disabled={loading} className="w-full rounded-full gradient-brand text-primary-foreground">
                  {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                  {isAr ? "لقد تحققت — تابع" : "I've verified — continue"}
                </Button>
                <Button variant="outline" onClick={handleResend} disabled={resendCooldown > 0} className="w-full rounded-full">
                  <RefreshCw className="me-2 h-4 w-4" />
                  {resendCooldown > 0 ? `${resendCooldown}s` : (isAr ? "إعادة إرسال الرابط" : "Resend verification email")}
                </Button>
                {mailProvider && (
                  <a href={mailProvider.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {isAr ? `فتح ${mailProvider.label}` : `Open ${mailProvider.label}`}
                  </a>
                )}
              </div>

              <button
                onClick={() => { setShowVerification(false); supabase.auth.signOut(); }}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isAr ? "تسجيل الخروج" : "Sign out and try again"}
              </button>
            </div>
          </motion.div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO title={t("seo.login.title")} />
      <section className="min-h-[80vh] flex items-center justify-center py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{isAr ? "تسجيل الدخول" : "Sign In"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "مرحباً بعودتك" : "Welcome back to DevWady"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Input type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }} className="ps-10" disabled={loading} />
              </div>
              {fieldErrors.password && <p className="text-sm text-destructive mt-1">{fieldErrors.password}</p>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full gradient-brand text-primary-foreground rounded-full" disabled={loading}>
              {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري الدخول..." : "Signing in..."}</> : <>{isAr ? "دخول" : "Sign In"} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline block">
              {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
            </Link>
            <p className="text-muted-foreground">
              {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <Link to={signupPath} className="text-primary hover:underline font-medium">
                {isAr ? "سجل الآن" : "Sign Up"}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </section>
    </>
  );
}
