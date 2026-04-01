/**
 * ArrivalHint — Subtle, auto-dismissing context indicator shown
 * when a user arrives from the homepage with entry context.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { WorkspaceEntryState } from "@/lib/workspaceEntry";

interface Props {
  entry: WorkspaceEntryState | null;
}

export default function ArrivalHint({ entry }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [visible, setVisible] = useState(!!entry?.context_en);

  useEffect(() => {
    if (!entry?.context_en) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [entry]);

  const label = isAr ? entry?.context_ar : entry?.context_en;
  if (!label) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-primary/5 border border-primary/10 text-sm text-primary"
        >
          <ArrowRight className="h-3.5 w-3.5 icon-flip-rtl flex-shrink-0" />
          <span className="font-medium">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
