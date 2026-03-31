import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export default function VerifyEmail() {
  const { user, isEmailVerified, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
    if (!loading && isEmailVerified) navigate("/post-login", { replace: true });
  }, [loading, user, isEmailVerified, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <SEO title={isAr ? "تأكيد البريد الإلكتروني" : "Verify Email"} />
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
          <Mail className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? "يرجى تأكيد بريدك الإلكتروني" : "Please verify your email"}</h2>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? `أرسلنا رابط تحقق إلى ${user.email}. انقر على الرابط لتفعيل حسابك.`
              : `We sent a verification link to ${user.email}. Click the link to activate your account.`}
          </p>
          <div className="space-y-3">
            <Button className="w-full" disabled={resending} onClick={async () => {
              setResending(true);
              const { error } = await supabase.auth.resend({ type: "signup", email: user.email! });
              setResending(false);
              if (error) toast.error(error.message);
              else toast.success(isAr ? "تم إعادة إرسال الرابط" : "Verification email resent");
            }}>
              {resending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isAr ? "إعادة إرسال رابط التحقق" : "Resend verification email"}
            </Button>
            <Button variant="outline" className="w-full" disabled={refreshing} onClick={async () => {
              setRefreshing(true);
              await supabase.auth.refreshSession();
              setRefreshing(false);
              window.location.reload();
            }}>
              {refreshing && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isAr ? "لقد تحققت — تحديث" : "I've verified — refresh"}
            </Button>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
