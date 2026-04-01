import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  GraduationCap, DollarSign, Globe, Rocket, Users,
  CheckCircle2, Loader2, X, ArrowRight, Clock
} from "lucide-react";

export default function BecomeInstructor() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const qc = useQueryClient();

  // Check existing application
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ["instructor-application", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_applications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill from profile
  const { data: profile } = useQuery({
    queryKey: ["profile-prefill", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, linkedin_url, portfolio_url")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Platform stats
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [courses, enrollments] = await Promise.all([
        supabase.from("training_courses").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }),
      ]);
      return { courses: courses.count || 0, students: enrollments.count || 0 };
    },
    staleTime: 60000,
  });

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    expertise_areas: [] as string[],
    bio: "",
    portfolio_url: "",
    linkedin_url: "",
    sample_content_url: "",
    course_proposal: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill once profile loads
  if (profile && !prefilled) {
    setForm((f) => ({
      ...f,
      full_name: profile.full_name || f.full_name,
      email: user?.email || f.email,
      linkedin_url: profile.linkedin_url || f.linkedin_url,
      portfolio_url: profile.portfolio_url || f.portfolio_url,
    }));
    setPrefilled(true);
  }

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !form.expertise_areas.includes(tag) && form.expertise_areas.length < 10) {
      setForm((f) => ({ ...f, expertise_areas: [...f.expertise_areas, tag] }));
      setTagInput("");
    }
  }, [tagInput, form.expertise_areas]);

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, expertise_areas: f.expertise_areas.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.bio.trim()) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }
    if (form.bio.length > 1000 || form.course_proposal.length > 2000) {
      toast.error(isAr ? "النص طويل جداً" : "Text is too long");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("instructor_applications").insert({
      user_id: user.id,
      full_name: form.full_name.trim().slice(0, 100),
      email: form.email.trim().slice(0, 255),
      expertise_areas: form.expertise_areas.slice(0, 10),
      bio: form.bio.trim().slice(0, 1000),
      portfolio_url: form.portfolio_url.trim().slice(0, 500) || null,
      linkedin_url: form.linkedin_url.trim().slice(0, 500) || null,
      sample_content_url: form.sample_content_url.trim().slice(0, 500) || null,
      course_proposal: form.course_proposal.trim().slice(0, 2000) || null,
    });

    if (error) {
      toast.error(isAr ? "فشل إرسال الطلب" : "Failed to submit application");
    } else {
      toast.success(isAr ? "تم إرسال طلبك بنجاح!" : "Application submitted successfully!");
      // Notify admins
      const { data: admins } = await supabase.from("profiles").select("user_id").eq("account_type", "admin");
      for (const admin of admins || []) {
        await supabase.rpc("create_notification", {
          _user_id: admin.user_id,
          _type: "instructor_application",
          _title_en: `New instructor application from ${form.full_name}`,
          _title_ar: `طلب معلم جديد من ${form.full_name}`,
          _link: "/admin/training",
        });
      }
      qc.invalidateQueries({ queryKey: ["instructor-application"] });
    }
    setSubmitting(false);
  };

  const benefits = [
    { icon: Users, title: isAr ? "آلاف الطلاب" : "Thousands of Students", desc: isAr ? "وصول فوري لجمهور متعطش للتعلم" : "Instant access to an eager learning audience" },
    { icon: DollarSign, title: isAr ? "إيرادات تصل لـ 70%" : "Up to 70% Revenue", desc: isAr ? "احصل على 70% من مبيعات دورتك" : "Keep 70% of your course sales" },
    { icon: Globe, title: isAr ? "المنصة تتولى كل شيء" : "We Handle Everything", desc: isAr ? "الاستضافة والمدفوعات والتسويق علينا" : "Hosting, payments, and marketing handled for you" },
    { icon: Rocket, title: isAr ? "انطلق بسرعة" : "Launch Fast", desc: isAr ? "أدوات إنشاء محتوى سهلة وبسيطة" : "Easy content creation tools to get started quickly" },
  ];

  return (
    <>
      <SEO
        title={isAr ? "كن معلمًا | DevWady" : "Become an Instructor | DevWady"}
        description={isAr ? "شارك خبرتك وعلّم آلاف الطلاب على منصة DevWady" : "Share your expertise and teach thousands of students on DevWady"}
      />

      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
              <GraduationCap className="h-3.5 w-3.5 ltr:me-1.5 rtl:ms-1.5" />
              {isAr ? "انضم لفريق المعلمين" : "Join our teaching team"}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {isAr ? "شارك خبرتك مع العالم" : "Share Your Expertise with the World"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {isAr
                ? "أنشئ دورات تدريبية وعلّم طلابًا حقيقيين واكسب دخلًا من شغفك بالتعليم"
                : "Create courses, teach real students, and earn income from your passion for education"}
            </p>
            <div className="flex justify-center gap-8 text-center">
              {[
                { val: stats?.students || "0", label: isAr ? "طالب" : "Students" },
                { val: stats?.courses || "0", label: isAr ? "دورة" : "Courses" },
                { val: "70%", label: isAr ? "حصة المعلم" : "Instructor Share" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-primary">{s.val}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full text-center">
                  <CardContent className="pt-6 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isAr ? "قدّم طلبك الآن" : "Apply Now"}
          </h2>

          {!user ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">{isAr ? "ابدأ من مسار المدربين لإكمال التسجيل ثم تقديم طلبك." : "Start from the instructor access flow to finish registration and submit your application."}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild className="gradient-brand text-primary-foreground rounded-xl">
                    <Link to="/auth/academy?role=instructor">
                      {isAr ? "مسار المدربين" : "Instructor Access"} <ArrowRight className="icon-flip-rtl h-4 w-4 ltr:ms-2 rtl:me-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/login?redirect=/become-instructor">
                      {isAr ? "تسجيل الدخول للمتابعة" : "Sign In to Continue"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : appLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : application ? (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                {application.status === "pending" && (
                  <>
                    <Clock className="h-12 w-12 mx-auto text-amber-500" />
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200 text-sm">
                      {isAr ? "قيد المراجعة" : "Under Review"}
                    </Badge>
                    <p className="text-muted-foreground">
                      {isAr ? "تم استلام طلبك! سنراجعه خلال 3-5 أيام عمل." : "Application received! We'll review it within 3-5 business days."}
                    </p>
                  </>
                )}
                {application.status === "approved" && (
                  <>
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-sm">
                      {isAr ? "تمت الموافقة" : "Approved"}
                    </Badge>
                    <p className="text-muted-foreground">{isAr ? "مرحبًا بك في فريق المعلمين!" : "Welcome aboard!"}</p>
                    <Button asChild className="gradient-brand text-primary-foreground rounded-xl">
                      <Link to="/instructor/workspace">{isAr ? "لوحة التحكم" : "Go to Workspace"} <ArrowRight className="icon-flip-rtl h-4 w-4 ltr:ms-2 rtl:me-2" /></Link>
                    </Button>
                  </>
                )}
                {application.status === "rejected" && (
                  <>
                    <X className="h-12 w-12 mx-auto text-destructive/50" />
                    <Badge variant="destructive" className="text-sm">
                      {isAr ? "لم يتم القبول" : "Not Accepted"}
                    </Badge>
                    <p className="text-muted-foreground">
                      {isAr ? "للأسف لم يتم قبول طلبك هذه المرة." : "Unfortunately your application was not accepted this time."}
                    </p>
                    {application.admin_notes && (
                      <p className="text-sm bg-muted/50 rounded-lg p-3">{application.admin_notes}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{isAr ? "الاسم الكامل *" : "Full Name *"}</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{isAr ? "مجالات الخبرة" : "Expertise Areas"}</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.expertise_areas.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder={isAr ? "اكتب واضغط Enter" : "Type and press Enter"}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>{isAr ? "نبذة عنك *" : "Bio *"}</Label>
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={1000} rows={4} required
                      placeholder={isAr ? "لماذا أنت مؤهل للتدريس؟" : "Why are you qualified to teach?"} />
                    <p className="text-xs text-muted-foreground text-end">{form.bio.length}/1000</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{isAr ? "رابط الملف الشخصي" : "Portfolio URL"}</Label>
                      <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} maxLength={500} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("form.linkedin")}</Label>
                      <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} maxLength={500} placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{isAr ? "رابط محتوى تعليمي" : "Sample Content URL"}</Label>
                    <Input value={form.sample_content_url} onChange={(e) => setForm({ ...form, sample_content_url: e.target.value })} maxLength={500}
                      placeholder={isAr ? "رابط فيديو أو مقال تعليمي" : "Link to a video, blog post, or teaching sample"} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>{isAr ? "اقتراح الدورة" : "Course Proposal"}</Label>
                    <Textarea value={form.course_proposal} onChange={(e) => setForm({ ...form, course_proposal: e.target.value })} maxLength={2000} rows={3}
                      placeholder={isAr ? "ما الدورة التي ستنشئها؟ وصف مختصر" : "What course would you create? Brief description"} />
                    <p className="text-xs text-muted-foreground text-end">{form.course_proposal.length}/2000</p>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gradient-brand text-primary-foreground rounded-xl" size="lg">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin ltr:me-2 rtl:ms-2" /> : <Rocket className="h-4 w-4 ltr:me-2 rtl:ms-2" />}
                    {isAr ? "إرسال الطلب" : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
