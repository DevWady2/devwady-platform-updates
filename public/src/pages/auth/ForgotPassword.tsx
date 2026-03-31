import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <>
      <SEO title={t("seo.forgotPassword.title")} />
      <section className="min-h-[80vh] flex items-center justify-center py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">{lang === "ar" ? "تحقق من بريدك" : "Check Your Email"}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {lang === "ar" ? "تم إرسال رابط إعادة تعيين كلمة المرور." : "Password reset link has been sent."}
              </p>
              <Link to="/login"><Button variant="outline" className="rounded-full"><ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {lang === "ar" ? "العودة" : "Back to Login"}</Button></Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">{lang === "ar" ? "نسيت كلمة المرور" : "Forgot Password"}</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">{lang === "ar" ? "أدخل بريدك لإعادة التعيين" : "Enter your email to reset your password"}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" required disabled={loading} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gradient-brand text-primary-foreground rounded-full" disabled={loading}>
                  {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{lang === "ar" ? "جاري الإرسال..." : "Sending..."}</> : lang === "ar" ? "إرسال الرابط" : "Send Reset Link"}
                </Button>
              </form>
              <Link to="/login" className="block text-center mt-4 text-sm text-primary hover:underline">
                <ArrowLeft className="icon-flip-rtl inline h-3 w-3 me-1" />{lang === "ar" ? "العودة لتسجيل الدخول" : "Back to Login"}
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </section>
    </>
  );
}
