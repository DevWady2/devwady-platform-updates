import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // Not a valid recovery link — but let it stay, user might have session
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) setError(error.message);
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md mx-auto px-4">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{lang === "ar" ? "تم التحديث" : "Password Updated"}</h2>
          <Button onClick={() => navigate("/")} className="mt-4 rounded-full gradient-brand text-primary-foreground">
            {lang === "ar" ? "الذهاب للرئيسية" : "Go to Home"}
          </Button>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <SEO title={t("seo.resetPassword.title")} />
      <section className="min-h-[80vh] flex items-center justify-center py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-6">{lang === "ar" ? "كلمة مرور جديدة" : "Set New Password"}</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder={lang === "ar" ? "كلمة المرور الجديدة" : "New Password"} value={password} onChange={(e) => setPassword(e.target.value)} className="ps-10" required minLength={6} disabled={loading} />
            </div>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder={lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="ps-10" required minLength={6} disabled={loading} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gradient-brand text-primary-foreground rounded-full" disabled={loading}>
              {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{lang === "ar" ? "جاري التحديث..." : "Updating..."}</> : lang === "ar" ? "تحديث" : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </section>
    </>
  );
}
