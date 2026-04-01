import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Linkedin, Github, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Team() {
  const { t, lang } = useLanguage();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const leadership = members.filter((m) => m.department === "leadership");
  const developers = members.filter((m) => m.department === "development" || m.department === "engineering");
  const qaTeam = members.filter((m) => m.department === "qa");
  const otherMembers = members.filter(
    (m) => !["leadership", "development", "engineering", "qa"].includes(m.department || "")
  );

  const getName = (m: typeof members[0]) => (lang === "ar" ? (m.name_ar || m.name_en) : m.name_en);
  const getRole = (m: typeof members[0]) => (lang === "ar" ? (m.role_ar || m.role_en) : m.role_en);
  const getInitials = (m: typeof members[0]) =>
    m.name_en.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const renderMemberCard = (m: typeof members[0], i: number, variant: "large" | "compact" | "small" = "compact") => {
    if (variant === "large") {
      return (
        <motion.div
          key={m.id}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg transition-shadow"
        >
          {m.avatar_url ? (
            <img loading="lazy" src={m.avatar_url} alt={getName(m)} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-brand mx-auto mb-4 flex items-center justify-center text-primary-foreground text-xl font-bold">
              {getInitials(m)}
            </div>
          )}
          <h3 className="text-lg font-bold">{getName(m)}</h3>
          <p className="text-sm text-muted-foreground">{getRole(m)}</p>
          <div className="flex justify-center gap-2 mt-3">
            {m.linkedin_url && (
              <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </a>
            )}
            {m.github_url && (
              <a href={m.github_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Github className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      );
    }

    if (variant === "small") {
      return (
        <motion.div
          key={m.id}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-card rounded-xl p-5 border border-border text-center"
        >
          {m.avatar_url ? (
            <img loading="lazy" src={m.avatar_url} alt={getName(m)} className="w-14 h-14 rounded-full mx-auto mb-3 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center text-primary font-bold">
              {getInitials(m)}
            </div>
          )}
          <h3 className="font-semibold text-sm">{getName(m)}</h3>
          <p className="text-xs text-muted-foreground">{getRole(m)}</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={m.id}
        custom={i}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="bg-card rounded-xl p-5 border border-border flex items-center gap-4 hover:border-primary/30 transition-colors"
      >
        {m.avatar_url ? (
          <img loading="lazy" src={m.avatar_url} alt={getName(m)} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
            {getInitials(m)}
          </div>
        )}
        <div>
          <h3 className="font-semibold">{getName(m)}</h3>
          <p className="text-sm text-muted-foreground">{getRole(m)}</p>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO title={t("seo.team.title")} description={t("seo.team.desc")} />
      {/* Hero */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="container mx-auto px-4 relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-6xl font-bold mb-4"
          >
            {t("team.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl"
          >
            {t("team.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Leadership */}
      {leadership.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">{t("team.leadership")}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {leadership.map((m, i) => renderMemberCard(m, i, "large"))}
            </div>
          </div>
        </section>
      )}

      {/* Developers */}
      {developers.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">{t("team.developers")}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((m, i) => renderMemberCard(m, i, "compact"))}
            </div>
          </div>
        </section>
      )}

      {/* QA Team */}
      {qaTeam.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2">{lang === "ar" ? "فريق ضمان الجودة" : "Quality Assurance Team"}</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">{lang === "ar" ? "فريقنا المتخصص في ضمان جودة المنتجات والتطبيقات." : "Our dedicated team ensuring product and application quality."}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {qaTeam.map((m, i) => renderMemberCard(m, i, "small"))}
            </div>
          </div>
        </section>
      )}

      {/* Other Members */}
      {otherMembers.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">{lang === "ar" ? "أعضاء الفريق" : "Team Members"}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherMembers.map((m, i) => renderMemberCard(m, i, "compact"))}
            </div>
          </div>
        </section>
      )}

      {members.length === 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            {lang === "ar" ? "لا يوجد أعضاء في الفريق بعد" : "No team members added yet"}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="gradient-brand rounded-3xl p-10 lg:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-3">{t("team.joinUs")}</h2>
            <p className="opacity-90 mb-6 max-w-md mx-auto">{t("team.joinUsDesc")}</p>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="rounded-full px-8">
                {t("team.applyNow")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
