import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

export default function AccountSuspended() {
  const { user, accountStatus, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
    if (!loading && accountStatus === "active") navigate("/post-login", { replace: true });
  }, [loading, user, accountStatus, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("status_reason").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setReason(data?.status_reason ?? null));
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <>
      <SEO title={isAr ? "تم تعليق الحساب" : "Account Suspended"} />
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
          <ShieldX className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? "تم تعليق الحساب" : "Account suspended"}</h2>
          <p className="text-muted-foreground text-sm">{isAr ? "تم تعليق حسابك مؤقتاً." : "Your account has been temporarily suspended."}</p>
          {reason && <p className="text-sm bg-muted rounded-lg p-3 text-muted-foreground italic">"{reason}"</p>}
          <div className="space-y-3">
            <Link to="/contact"><Button variant="outline" className="w-full">{isAr ? "تواصل مع الدعم" : "Contact support"}</Button></Link>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{isAr ? "تسجيل الخروج" : "Sign out"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
