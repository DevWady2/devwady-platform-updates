import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export default function AccountReactivate() {
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
      <SEO title={isAr ? "إعادة تفعيل الحساب" : "Reactivate Account"} />
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? "حسابك معطّل" : "Your account is deactivated"}</h2>
          <p className="text-muted-foreground text-sm">{isAr ? "يمكنك إعادة تفعيل حسابك في أي وقت." : "You can reactivate your account at any time."}</p>
          <div className="space-y-3">
            <Button className="w-full" onClick={async () => {
              const { error } = await supabase.from("profiles")
                .update({ account_status: "active", status_changed_at: new Date().toISOString() })
                .eq("user_id", user.id);
              if (error) toast.error(error.message);
              else { toast.success(isAr ? "تم إعادة تفعيل حسابك" : "Account reactivated"); window.location.reload(); }
            }}>
              {isAr ? "إعادة تفعيل حسابي" : "Reactivate my account"}
            </Button>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{isAr ? "تسجيل الخروج" : "Sign out"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
