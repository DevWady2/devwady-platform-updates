import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { saveProfileByUserId } from "@/lib/profilePersistence";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Lock, Monitor, Trash2, Power, CheckCircle2, Clock, Eye, EyeOff, ShieldAlert, User, Building2, GraduationCap, BookOpen, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AccountSettings() {
  const { lang } = useLanguage();
  const { user, signOut, accountType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Email change
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Deactivate
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isVerified = Boolean(user?.email_confirmed_at);

  // Password strength
  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: lang === "ar" ? "ضعيف" : "Weak", color: "bg-red-500", pct: 25 };
    if (score === 2) return { label: lang === "ar" ? "متوسط" : "Medium", color: "bg-amber-500", pct: 50 };
    if (score === 3) return { label: lang === "ar" ? "جيد" : "Good", color: "bg-emerald-500", pct: 75 };
    return { label: lang === "ar" ? "قوي" : "Strong", color: "bg-emerald-600", pct: 100 };
  };

  const strength = getStrength(newPassword);

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: lang === "ar" ? "تم الإرسال" : "Confirmation sent", description: lang === "ar" ? "تحقق من بريدك الإلكتروني الجديد" : "Check your new email for a confirmation link" });
      setEmailOpen(false);
      setNewEmail("");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: lang === "ar" ? "كلمة المرور قصيرة جداً" : "Password too short", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: lang === "ar" ? "تم التحديث" : "Password updated" });
      setPwOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    if (error) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: lang === "ar" ? "تم الإرسال" : "Verification sent" });
    }
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast({ title: lang === "ar" ? "تم تسجيل الخروج" : "Signed out of all devices" });
    navigate("/login", { replace: true });
  };

  const handleDeactivate = async () => {
    if (deactivateConfirm !== "DEACTIVATE") return;
    setDeactivateLoading(true);
    await saveProfileByUserId(user!.id, { account_status: "deactivated" });
    setDeactivateLoading(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const handleDelete = async () => {
    if (deleteConfirm !== user?.email) return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      toast({ title: lang === "ar" ? "تم حذف الحساب" : "Account deleted" });
      navigate("/", { replace: true });
    } catch (e: any) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <SEO title={lang === "ar" ? "إعدادات الحساب" : "Account Settings"} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="mb-4 gap-2">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {lang === "ar" ? "العودة للملف" : "Back to profile"}
        </Button>
        <h1 className="text-2xl font-bold mb-6">{lang === "ar" ? "إعدادات الحساب" : "Account Settings"}</h1>

        {/* Email */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5" /> {lang === "ar" ? "البريد الإلكتروني" : "Email"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {lang === "ar" ? "تم التحقق" : "Verified"}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3.5 w-3.5" /> {lang === "ar" ? "غير متحقق" : "Unverified"}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!isVerified && (
                  <Button variant="outline" size="sm" onClick={handleResendVerification}>
                    {lang === "ar" ? "إعادة إرسال" : "Resend"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                  {lang === "ar" ? "تغيير" : "Change"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" /> {lang === "ar" ? "كلمة المرور" : "Password"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setPwOpen(true)}>
              {lang === "ar" ? "تغيير كلمة المرور" : "Change password"}
            </Button>
          </CardContent>
        </Card>

        {/* Session */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Monitor className="h-5 w-5" /> {lang === "ar" ? "الجلسات" : "Sessions"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "الجلسة الحالية نشطة" : "Current session is active"}</p>
            <Button variant="outline" onClick={handleSignOutAll}>
              {lang === "ar" ? "تسجيل الخروج من جميع الأجهزة" : "Sign out of all devices"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Type */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> {lang === "ar" ? "نوع الحساب" : "Account Type"}
            </CardTitle>
            <CardDescription>{lang === "ar" ? "نوع حسابك الحالي على المنصة" : "Your current account type on the platform"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accountType && (() => {
              const icons: Record<string, any> = { freelancer: User, company: Building2, student: GraduationCap, instructor: BookOpen, expert: Shield, admin: Shield };
              const names: Record<string, { en: string; ar: string }> = {
                freelancer: { en: "Freelancer", ar: "مستقل" }, company: { en: "Company", ar: "شركة" },
                student: { en: "Student", ar: "طالب" }, instructor: { en: "Instructor", ar: "مدرب" },
                expert: { en: "Expert", ar: "خبير" }, admin: { en: "Admin", ar: "مشرف" },
              };
              const Icon = icons[accountType] || User;
              const name = names[accountType] || { en: accountType, ar: accountType };
              return (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{lang === "ar" ? name.ar : name.en}</span>
                    <Badge variant="secondary" className="text-[10px]">{lang === "ar" ? "نشط" : "Active"}</Badge>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 border-s-4 border-s-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive"><ShieldAlert className="h-5 w-5" /> {lang === "ar" ? "منطقة الخطر" : "Danger Zone"}</CardTitle>
            <CardDescription>{lang === "ar" ? "هذه الإجراءات لا يمكن التراجع عنها بسهولة" : "These actions are difficult to reverse"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-500/10" onClick={() => setDeactivateOpen(true)}>
              <Power className="me-2 h-4 w-4" /> {lang === "ar" ? "إلغاء تنشيط الحساب" : "Deactivate account"}
            </Button>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" /> {lang === "ar" ? "حذف الحساب" : "Delete account"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تغيير البريد الإلكتروني" : "Change email"}</DialogTitle>
            <DialogDescription>{lang === "ar" ? "سيتم إرسال رابط تأكيد إلى بريدك الجديد" : "A confirmation link will be sent to your new email"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{lang === "ar" ? "البريد الإلكتروني الجديد" : "New email"}</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleEmailChange} disabled={emailLoading || !newEmail}>{emailLoading ? "..." : lang === "ar" ? "تحديث" : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{lang === "ar" ? "كلمة المرور الجديدة" : "New password"}</Label>
              <div className="relative">
                <Input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <Label>{lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handlePasswordChange} disabled={pwLoading || !newPassword || !confirmPassword}>
              {pwLoading ? "..." : lang === "ar" ? "تحديث" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إلغاء تنشيط الحساب" : "Deactivate account"}</DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "سيتم إخفاء ملفك وتعطيل حسابك. يمكنك إعادة التنشيط في أي وقت عند تسجيل الدخول."
                : "This will hide your profile and disable your account. You can reactivate anytime by logging in."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>{lang === "ar" ? "اكتب DEACTIVATE للتأكيد" : "Type DEACTIVATE to confirm"}</Label>
            <Input value={deactivateConfirm} onChange={(e) => setDeactivateConfirm(e.target.value)} placeholder="DEACTIVATE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeactivateOpen(false); setDeactivateConfirm(""); }}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" disabled={deactivateConfirm !== "DEACTIVATE" || deactivateLoading} onClick={handleDeactivate}>
              {deactivateLoading ? "..." : lang === "ar" ? "إلغاء التنشيط" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{lang === "ar" ? "حذف الحساب نهائياً" : "Permanently delete account"}</DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "سيتم حذف حسابك وجميع البيانات المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء."
                : "This will permanently delete your account and all associated data. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>{lang === "ar" ? "اكتب بريدك الإلكتروني للتأكيد" : "Type your email to confirm"}</Label>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={user?.email || ""} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" disabled={deleteConfirm !== user?.email || deleteLoading} onClick={handleDelete}>
              {deleteLoading ? "..." : lang === "ar" ? "حذف نهائياً" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
