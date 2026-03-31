import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Clock, ShieldX, Ban, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useEffect } from "react";

interface Props {
  children: ReactNode;
  requireVerified?: boolean;
}

export default function AccountStatusGate({ children, requireVerified = true }: Props) {
  const { user, accountStatus, isEmailVerified, signOut } = useAuth();
  const { lang } = useLanguage();
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = lang === "ar";

  // Auto sign-out banned users
  useEffect(() => {
    if (accountStatus === "banned") {
      signOut();
    }
  }, [accountStatus, signOut]);

  if (!user) return null;

  // Email verification gate
  if (requireVerified && !isEmailVerified) {
    return (
      <StatusScreen
        icon={<Mail className="h-12 w-12 text-primary" />}
        title={isAr ? "يرجى تأكيد بريدك الإلكتروني" : "Please verify your email"}
        description={
          isAr
            ? `أرسلنا رابط تحقق إلى ${user.email}. انقر على الرابط لتفعيل حسابك.`
            : `We sent a verification link to ${user.email}. Click the link to activate your account.`
        }
      >
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={async () => {
              setResending(true);
              const { error } = await supabase.auth.resend({ type: "signup", email: user.email! });
              setResending(false);
              if (error) toast.error(error.message);
              else toast.success(isAr ? "تم إعادة إرسال الرابط" : "Verification email resent");
            }}
            disabled={resending}
          >
            {resending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isAr ? "إعادة إرسال رابط التحقق" : "Resend verification email"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setRefreshing(true);
              await supabase.auth.refreshSession();
              setRefreshing(false);
              window.location.reload();
            }}
            disabled={refreshing}
          >
            {refreshing && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isAr ? "لقد تحققت — تحديث" : "I've verified — refresh"}
          </Button>
          <SignOutLink isAr={isAr} onSignOut={signOut} />
        </div>
      </StatusScreen>
    );
  }

  // Account status gates
  if (accountStatus === "pending_approval") {
    return (
      <StatusScreen
        icon={<Clock className="h-12 w-12 text-yellow-500" />}
        title={isAr ? "الحساب قيد المراجعة" : "Account under review"}
        description={
          isAr
            ? "حساب شركتك قيد المراجعة من قبل فريقنا. عادةً ما يستغرق ذلك 24-48 ساعة. سنبلغك بالبريد الإلكتروني بمجرد الموافقة."
            : "Your company account is being reviewed by our team. This usually takes 24-48 hours. We'll notify you by email once approved."
        }
      >
        <Link to="/contact">
          <Button variant="outline" className="w-full">
            {isAr ? "تواصل مع الدعم" : "Contact support"}
          </Button>
        </Link>
        <SignOutLink isAr={isAr} onSignOut={signOut} />
      </StatusScreen>
    );
  }

  if (accountStatus === "suspended") {
    return (
      <StatusScreen
        icon={<ShieldX className="h-12 w-12 text-destructive" />}
        title={isAr ? "تم تعليق الحساب" : "Account suspended"}
        description={isAr ? "تم تعليق حسابك مؤقتاً." : "Your account has been temporarily suspended."}
        showReason
      >
        <Link to="/contact">
          <Button variant="outline" className="w-full">
            {isAr ? "تواصل مع الدعم" : "Contact support"}
          </Button>
        </Link>
        <SignOutLink isAr={isAr} onSignOut={signOut} />
      </StatusScreen>
    );
  }

  if (accountStatus === "banned") {
    return (
      <StatusScreen
        icon={<Ban className="h-12 w-12 text-destructive" />}
        title={isAr ? "تم تعطيل الحساب" : "Account disabled"}
        description={isAr ? "تم تعطيل حسابك نهائياً." : "Your account has been permanently disabled."}
        showReason
      >
        <Link to="/contact">
          <Button variant="outline" className="w-full">
            {isAr ? "تواصل مع الدعم" : "Contact support"}
          </Button>
        </Link>
      </StatusScreen>
    );
  }

  if (accountStatus === "deactivated") {
    return (
      <StatusScreen
        icon={<UserX className="h-12 w-12 text-muted-foreground" />}
        title={isAr ? "حسابك معطّل" : "Your account is deactivated"}
        description={isAr ? "يمكنك إعادة تفعيل حسابك في أي وقت." : "You can reactivate your account at any time."}
      >
        <Button
          className="w-full"
          onClick={async () => {
            const { error } = await supabase
              .from("profiles")
              .update({ account_status: "active", status_changed_at: new Date().toISOString() })
              .eq("user_id", user.id);
            if (error) toast.error(error.message);
            else {
              toast.success(isAr ? "تم إعادة تفعيل حسابك" : "Account reactivated");
              window.location.reload();
            }
          }}
        >
          {isAr ? "إعادة تفعيل حسابي" : "Reactivate my account"}
        </Button>
        <SignOutLink isAr={isAr} onSignOut={signOut} />
      </StatusScreen>
    );
  }

  return <>{children}</>;
}

function StatusScreen({
  icon,
  title,
  description,
  showReason,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  showReason?: boolean;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (showReason && user) {
      supabase
        .from("profiles")
        .select("status_reason")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setReason(data?.status_reason ?? null));
    }
  }, [showReason, user]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
        {showReason && reason && (
          <p className="text-sm bg-muted rounded-lg p-3 text-muted-foreground italic">"{reason}"</p>
        )}
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function SignOutLink({ isAr, onSignOut }: { isAr: boolean; onSignOut: () => void }) {
  return (
    <button onClick={onSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
      {isAr ? "تسجيل الخروج" : "Sign out"}
    </button>
  );
}
