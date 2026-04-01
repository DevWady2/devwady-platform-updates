import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export default function Pricing() {
  const { t } = useLanguage();

  const packages = [
    {
      title: t("pricing.projectBased"),
      desc: t("pricing.projectBasedDesc"),
      forLabel: t("pricing.projectBasedFor"),
      popular: false,
    },
    {
      title: t("pricing.dedicatedSquads"),
      desc: t("pricing.dedicatedSquadsDesc"),
      forLabel: t("pricing.dedicatedSquadsFor"),
      popular: true,
    },
    {
      title: t("pricing.teamAug"),
      desc: t("pricing.teamAugDesc"),
      forLabel: t("pricing.teamAugFor"),
      popular: false,
    },
    {
      title: t("pricing.consulting"),
      desc: t("pricing.consultingDesc"),
      forLabel: t("pricing.consultingFor"),
      popular: false,
    },
  ];

  return (
    <>
      <SEO title={t("seo.pricing.title")} description={t("seo.pricing.desc")} />
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">{t("pricing.title")}</h1>
          <p className="text-xl text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 max-w-4xl">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border ${
                pkg.popular
                  ? "border-primary gradient-brand text-primary-foreground"
                  : "border-border bg-card"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 start-6 flex items-center gap-1 px-3 py-1 rounded-full bg-warning text-warning-foreground text-xs font-bold">
                  <Star className="h-3 w-3" /> {t("pricing.popular")}
                </span>
              )}
              <span className={`text-xs font-semibold uppercase tracking-wider ${pkg.popular ? "opacity-80" : "text-primary"}`}>
                {pkg.forLabel}
              </span>
              <h3 className="text-xl font-bold mt-2 mb-3">{pkg.title}</h3>
              <p className={`text-sm leading-relaxed mb-6 ${pkg.popular ? "opacity-90" : "text-muted-foreground"}`}>
                {pkg.desc}
              </p>
              <Link to="/get-started">
                <Button
                  variant={pkg.popular ? "secondary" : "outline"}
                  className="rounded-full w-full"
                >
                  {t("pricing.requestQuote")} <ArrowRight className="icon-flip-rtl ms-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
