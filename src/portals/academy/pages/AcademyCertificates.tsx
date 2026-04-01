/**
 * Academy — Certificates page.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, Download, ExternalLink } from "lucide-react";

export default function AcademyCertificates() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["academy-certificates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, training_courses(title_en, title_ar, slug, thumbnail_url)")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Certificates"
        title_ar="شهاداتي"
        description_en="Certificates earned from completed courses"
        description_ar="الشهادات المكتسبة من الدورات المكتملة"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-12 w-12" />}
          title_en="No certificates yet"
          title_ar="لا توجد شهادات بعد"
          description_en="Complete a course to earn your first certificate"
          description_ar="أكمل دورة للحصول على أول شهادة"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((e: any) => {
            const course = e.training_courses;
            return (
              <Card key={e.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{isAr ? course?.title_ar : course?.title_en}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isAr ? "مكتمل في" : "Completed on"} {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Link to={`/certificate/${e.id}`}>
                          <Button variant="default" size="sm" className="h-7 text-xs">
                            <ExternalLink className="h-3 w-3 me-1" />{isAr ? "عرض الشهادة" : "View Certificate"}
                          </Button>
                        </Link>
                        {e.certificate_url && (
                          <a href={e.certificate_url} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <Download className="h-3 w-3 me-1" />{isAr ? "تحميل" : "Download"}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
