/**
 * InstructorSidebar — Contextual right sidebar for the Instructor homepage.
 *
 * Desktop: sticky sidebar with operational sections
 * Mobile: stacked accordion blocks
 *
 * LP-02A scope: Student Questions + Relevant Jobs only.
 * No mock data — real DB queries or honest empty states.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Briefcase, ArrowRight } from "lucide-react";

export default function InstructorSidebar() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  /* ── Unanswered questions for instructor's courses ── */
  const { data: questions = [] } = useQuery({
    queryKey: ["instructor-sidebar-questions", user?.id],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      // Get instructor's course IDs first
      const { data: courses } = await supabase
        .from("training_courses")
        .select("id")
        .eq("instructor_id", user!.id);
      if (!courses || courses.length === 0) return [];
      const courseIds = courses.map((c) => c.id);
      const { data } = await supabase
        .from("course_questions")
        .select("id, question_text, course_id, created_at")
        .in("course_id", courseIds)
        .is("answer_text", null)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  /* ── Relevant jobs — no job_posts table yet, honest empty state ── */
  const jobs: any[] = [];

  const sections = [
    {
      id: "questions",
      icon: HelpCircle,
      title: isAr ? "أسئلة الطلاب" : "Student Questions",
      badge: questions.length > 0 ? questions.length : undefined,
      content: (
        <div className="space-y-2">
          {questions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {isAr ? "لا أسئلة معلّقة حالياً." : "No pending questions right now."}
            </p>
          ) : (
            questions.map((q: any) => (
              <div key={q.id} className="p-2.5 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                  {q.question_text}
                </p>
              </div>
            ))
          )}
          <Link
            to="/instructor/questions"
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline pt-1"
          >
            {isAr ? "عرض الكل" : "View all questions"}
            <ArrowRight className="icon-flip-rtl h-2.5 w-2.5" />
          </Link>
        </div>
      ),
    },
    {
      id: "jobs",
      icon: Briefcase,
      title: isAr ? "فرص ذات صلة" : "Relevant Jobs",
      badge: jobs.length > 0 ? jobs.length : undefined,
      content: (
        <div className="space-y-2">
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {isAr ? "لا فرص مطابقة حالياً." : "No matching jobs right now."}
            </p>
          ) : (
            jobs.map((job: any) => (
              <div key={job.id} className="p-2.5 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs font-medium text-foreground line-clamp-1">
                  {isAr ? job.title_ar || job.title_en : job.title_en}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {job.type_en}{job.location_en ? ` · ${isAr ? job.location_ar || job.location_en : job.location_en}` : ""}
                </p>
              </div>
            ))
          )}
          <Link
            to="/instructor/jobs"
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline pt-1"
          >
            {isAr ? "تصفح الكل" : "Browse all jobs"}
            <ArrowRight className="icon-flip-rtl h-2.5 w-2.5" />
          </Link>
        </div>
      ),
    },
  ];

  /* ── Desktop sidebar ── */
  const desktopSidebar = (
    <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-md bg-primary/8 flex items-center justify-center">
                <section.icon className="h-3 w-3 text-primary" />
              </div>
              <h3 className="text-xs font-semibold text-foreground flex-1">{section.title}</h3>
              {section.badge && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {section.badge}
                </span>
              )}
            </div>
            {section.content}
          </div>
        ))}
      </div>
    </aside>
  );

  /* ── Mobile accordion ── */
  const mobileAccordion = (
    <div className="lg:hidden mt-6">
      <Accordion type="multiple" defaultValue={["questions"]} className="space-y-2">
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="rounded-xl border border-border/60 bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-md bg-primary/8 flex items-center justify-center">
                  <section.icon className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{section.title}</span>
                {section.badge && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {section.badge}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  return { desktopSidebar, mobileAccordion };
}
