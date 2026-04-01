import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

export default function AccountBlocked() {
  const { user, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
    if (user) signOut();
  }, [loading, user, signOut, navigate]);

  return (
    <>
      <SEO title={isAr ? "تم تعطيل الحساب" : "Account Disabled"} />
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
          <Ban className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? "تم تعطيل الحساب" : "Account disabled"}</h2>
          <p className="text-muted-foreground text-sm">{isAr ? "تم تعطيل حسابك نهائياً." : "Your account has been permanently disabled."}</p>
          <Link to="/contact"><Button variant="outline" className="w-full">{isAr ? "تواصل مع الدعم" : "Contact support"}</Button></Link>
        </div>
      </div>
    </>
  );
}
