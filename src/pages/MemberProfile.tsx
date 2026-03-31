import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, CheckCircle2, GraduationCap } from "lucide-react";

const membersData: Record<string, any> = {
  "youssef-r": {
    name: { en: "Youssef R.", ar: "يوسف ر." },
    role: "Full-Stack Mobile Developer",
    bio: { en: "Top trainee of Batch 3 — shipped 2 production apps during the bootcamp. Passionate about building high-quality mobile experiences.", ar: "أفضل متدرب في الدفعة 3 — شحن تطبيقين إنتاج خلال البرنامج. شغوف ببناء تجارب موبايل عالية الجودة." },
    rating: 5.0, track: "Full-Stack Mobile", batch: "Batch 3",
    location: { en: "Cairo, Egypt", ar: "القاهرة، مصر" },
    skills: ["Flutter", "Dart", "Firebase", "REST APIs", "Git"],
    available: true,
    achievements: [
      { en: "Shipped AtmoDrive Captain App feature module", ar: "شحن وحدة تطبيق كابتن AtmoDrive" },
      { en: "Built real-time tracking component", ar: "بنى مكون التتبع المباشر" },
    ],
  },
  "mona-t": {
    name: { en: "Mona T.", ar: "منى ط." },
    role: "UI/UX Designer",
    bio: { en: "Designed complete design system for YOZYA product. Exceptional attention to detail and user-centric thinking.", ar: "صممت نظام تصميم كامل لمنتج YOZYA. اهتمام استثنائي بالتفاصيل وتفكير محوره المستخدم." },
    rating: 4.9, track: "UI/UX Design", batch: "Batch 2",
    location: { en: "Cairo, Egypt", ar: "القاهرة، مصر" },
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    available: true,
    achievements: [
      { en: "Created YOZYA design system from scratch", ar: "أنشأت نظام تصميم YOZYA من الصفر" },
    ],
  },
  "karim-s": {
    name: { en: "Karim S.", ar: "كريم س." },
    role: "Backend Engineer",
    bio: { en: "Built complex API with exceptional performance during the bootcamp. Strong problem-solving skills.", ar: "بنى API معقد بأداء استثنائي خلال البرنامج. مهارات حل مشكلات قوية." },
    rating: 4.8, track: "Backend Engineering", batch: "Batch 3",
    location: { en: "Cairo, Egypt", ar: "القاهرة، مصر" },
    skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs"],
    available: true,
    achievements: [
      { en: "Optimized HAMLA logistics API response times by 40%", ar: "حسن أوقات استجابة API لوجستيات HAMLA بنسبة 40%" },
    ],
  },
};

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const m = membersData[id || ""];

  if (!m) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{lang === "ar" ? "لم يتم العثور على الملف" : "Profile Not Found"}</h2>
          <Link to="/hiring"><Button variant="outline" className="rounded-full"><ArrowLeft className="icon-flip-rtl me-2 h-4 w-4" /> {lang === "ar" ? "العودة" : "Back"}</Button></Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO title={t("seo.team.title")} />
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/hiring" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="icon-flip-rtl h-4 w-4" /> {lang === "ar" ? "العودة للتوظيف" : "Back to Hiring"}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground text-3xl font-bold shrink-0">
                {m.name[lang][0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold">{m.name[lang]}</h1>
                  <span className="flex items-center gap-0.5 text-warning text-sm"><Star className="h-4 w-4 fill-current" /> {m.rating}</span>
                  {m.available && (
                    <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                      {lang === "ar" ? "متاح" : "Available"}
                    </span>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{m.role}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {m.location[lang]}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {m.track} · {m.batch}</span>
                </div>
              </div>
              <Link to="/contact">
                <Button className="gradient-brand text-primary-foreground rounded-full px-6">
                  {lang === "ar" ? "توظيف" : "Hire Now"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-3">{lang === "ar" ? "نبذة" : "About"}</h2>
            <p className="text-muted-foreground leading-relaxed">{m.bio[lang]}</p>
          </div>

          {/* Skills */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-3">{lang === "ar" ? "المهارات" : "Skills"}</h2>
            <div className="flex flex-wrap gap-2">
              {m.skills.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">{s}</span>
              ))}
            </div>
          </div>

          {/* DevWady Badge */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="font-bold text-lg">{lang === "ar" ? "موصى به بشدة من DevWady" : "Highly Recommended by DevWady"}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{m.track} · {m.batch}</p>
          </div>

          {/* Achievements */}
          {m.achievements && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4">{lang === "ar" ? "الإنجازات" : "Achievements"}</h2>
              <div className="space-y-3">
                {m.achievements.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm">{a[lang]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
    </>
  );
}
