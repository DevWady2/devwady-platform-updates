import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageViewTracker from "@/components/PageViewTracker";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function Layout({ children }: { children: ReactNode }) {
  const { dir } = useLanguage();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none">
        Skip to content
      </a>
      <PageViewTracker />
      <Navbar />
      <motion.main
        id="main-content"
        className="flex-1 pt-20"
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
