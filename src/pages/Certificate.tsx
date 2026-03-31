import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import SEO from "@/components/SEO";

export default function Certificate() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: enrollment, isLoading, error } = useQuery({
    queryKey: ["certificate", enrollmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, training_courses(title_en, title_ar, total_duration_hours, instructor_id)")
        .eq("id", enrollmentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!enrollmentId && !!user,
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["certificate-student", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ["certificate-instructor", enrollment?.training_courses?.instructor_id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_profile_display_by_id", {
        p_user_id: enrollment!.training_courses!.instructor_id!,
      });
      return data as { user_id: string; full_name: string | null; avatar_url: string | null; bio: string | null } | null;
    },
    enabled: !!enrollment?.training_courses?.instructor_id,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (error || !enrollment || enrollment.user_id !== user.id || enrollment.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{isAr ? "الشهادة غير متاحة" : "Certificate not available"}</p>
      </div>
    );
  }

  const course = enrollment.training_courses;
  const studentName = studentProfile?.full_name || user.email || "Student";
  const courseName = isAr ? (course?.title_ar || course?.title_en) : course?.title_en;
  const instructorName = instructorProfile?.full_name || "DevWady";
  const completionDate = enrollment.completed_at
    ? format(new Date(enrollment.completed_at), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");
  const certId = enrollmentId?.slice(0, 8).toUpperCase();

  return (
    <>
      <SEO title={isAr ? "شهادة إتمام" : "Certificate of Completion"} />

      {/* Print button - hidden in print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          {isAr ? "طباعة الشهادة" : "Print Certificate"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          {isAr ? "حفظ كـ PDF" : "Save as PDF"}
        </Button>
      </div>

      {/* Certificate */}
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-8 print:p-0 print:bg-white">
        <div className="w-[800px] bg-white shadow-2xl print:shadow-none border-2 border-primary/20 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[hsl(var(--primary))] text-primary-foreground py-8 px-12 text-center">
            <img loading="lazy"               src="/src/assets/logo-dark.svg"
              alt="DevWady"
              className="h-10 mx-auto mb-4 brightness-0 invert"
            />
            <h1 className="text-3xl font-bold tracking-wide">
              {isAr ? "شهادة إتمام" : "Certificate of Completion"}
            </h1>
          </div>

          {/* Body */}
          <div className="px-12 py-10 text-center space-y-6">
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              {isAr ? "نشهد بأن" : "This certifies that"}
            </p>

            <h2 className="text-4xl font-bold text-primary border-b-2 border-primary/20 pb-4 inline-block px-8">
              {studentName}
            </h2>

            <p className="text-muted-foreground text-lg">
              {isAr
                ? "قد أتم بنجاح دورة"
                : "has successfully completed the course"}
            </p>

            <h3 className="text-2xl font-semibold text-foreground">
              {courseName}
            </h3>

            <div className="grid grid-cols-3 gap-6 pt-6 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">{instructorName}</p>
                <p>{isAr ? "المدرّب" : "Instructor"}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {course?.total_duration_hours || 0}h
                </p>
                <p>{isAr ? "المدة" : "Duration"}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{completionDate}</p>
                <p>{isAr ? "تاريخ الإتمام" : "Completion Date"}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-border mt-8">
              <p className="text-xs text-muted-foreground font-mono">
                {isAr ? "رقم الشهادة" : "Certificate ID"}: DW-{certId}
              </p>
            </div>
          </div>

          {/* Footer accent */}
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-white { background: white !important; }
          @page { size: landscape; margin: 0; }
        }
      `}</style>
    </>
  );
}
