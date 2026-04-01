import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Loader2 } from "lucide-react";

export default function PostLoginRedirect() {
  const { user, accountType, accountStatus, isEmailVerified, loading: authLoading } = useAuth();
  const { score, loading: scoreLoading } = useProfileCompleteness();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (scoreLoading) return;

    // Canonical account identity not resolved yet → continue onboarding entry flow
    if (accountType === null) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Account status checks first
    if (accountStatus === "banned") { navigate("/account-blocked", { replace: true }); return; }
    if (accountStatus === "suspended") { navigate("/account-suspended", { replace: true }); return; }
    if (accountStatus === "pending_approval") { navigate("/account-pending", { replace: true }); return; }
    if (accountStatus === "deactivated") { navigate("/account-reactivate", { replace: true }); return; }

    // Email verification (admins bypass)
    if (!isEmailVerified && accountType !== "admin") { navigate("/verify-email", { replace: true }); return; }

    // Redirect param
    const redirect = searchParams.get("redirect");
    if (redirect && score >= 50) { navigate(decodeURIComponent(redirect), { replace: true }); return; }

    // Onboarding routing by accountType
    if (score < 50) {
      switch (accountType) {
        case "freelancer":
          navigate("/onboarding/freelancer", { replace: true });
          break;
        case "company":
          navigate("/onboarding/company", { replace: true });
          break;
        case "student":
          navigate("/onboarding/student", { replace: true });
          break;
        case "expert":
          navigate("/onboarding/expert", { replace: true });
          break;
        case "instructor":
          navigate("/onboarding/instructor", { replace: true });
          break;
        case "admin":
          navigate("/admin", { replace: true });
          break;
        default:
          navigate("/onboarding", { replace: true });
      }
      return;
    }

    // AccountType-based home — admin goes to backoffice, all others land on personalized homepage
    if (accountType === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, accountType, accountStatus, isEmailVerified, score, scoreLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">
        {lang === "ar" ? "جاري تحضير مساحة عملك..." : "Setting up your workspace..."}
      </p>
    </div>
  );
}
