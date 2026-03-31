import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Briefcase, Phone, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isAr = lang === "ar";

  const title = isAr ? "الصفحة غير موجودة" : "Page Not Found";
  const subtitle = isAr
    ? "يبدو أن هذه الصفحة اختارت مساراً مختلفاً"
    : "Looks like this page took a different route";
  const searchPlaceholder = isAr ? "ابحث عن محتوى..." : "Search for content...";
  const quickLinksTitle = isAr ? "روابط سريعة" : "Quick Links";

  const quickLinks = [
    { icon: Home, label: isAr ? "الرئيسية" : "Home", href: "/" },
    { icon: Briefcase, label: isAr ? "الخدمات" : "Services", href: "/services" },
    { icon: GraduationCap, label: isAr ? "الأكاديمية" : "Academy", href: "/academy/courses" },
    { icon: Phone, label: isAr ? "تواصل معنا" : "Contact", href: "/contact" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/blog?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <SEO title={title} />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-secondary px-4">
        {/* DW watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <span className="select-none text-[20rem] font-black leading-none text-white sm:text-[28rem]">
            DW
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 mx-auto max-w-lg text-center"
        >
          {/* 404 number */}
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-2 text-[8rem] font-black leading-none text-white/90 sm:text-[10rem]"
          >
            404
          </motion.h1>

          <p className="mb-2 text-xl font-semibold text-white">{title}</p>
          <p className="mb-8 text-white/70">{subtitle}</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mx-auto mb-10 flex max-w-sm gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40"
            />
            <Button type="submit" size="icon" variant="secondary" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick links */}
          <p className="mb-3 text-sm font-medium text-white/60">{quickLinksTitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {quickLinks.map((link) => (
              <Button
                key={link.href}
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => navigate(link.href)}
              >
                <link.icon className="me-1.5 h-4 w-4" />
                {link.label}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
