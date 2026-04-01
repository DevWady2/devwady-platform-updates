import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

export default function AccountPending() {
  const { user, accountStatus, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
    if (!loading && accountStatus === "active") navigate("/post-login", { replace: true });
  }, [loading, user, accountStatus, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <SEO title={isAr ? "الحساب قيد المراجعة" : "Account Under Review"} />
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
          <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? "الحساب قيد المراجعة" : "Account under review"}</h2>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? "حساب شركتك قيد المراجعة من قبل فريقنا. عادةً ما يستغرق ذلك 24-48 ساعة."
              : "Your company account is being reviewed by our team. This usually takes 24-48 hours."}
          </p>
          <div className="space-y-3">
            <Link to="/contact"><Button variant="outline" className="w-full">{isAr ? "تواصل مع الدعم" : "Contact support"}</Button></Link>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{isAr ? "تسجيل الخروج" : "Sign out"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
