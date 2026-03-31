/**
 * Standalone "My Certificates" page for students (website-first UX).
 * Certificate preview cards with share-to-LinkedIn and download.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, Download, ExternalLink, ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function MyCertificates() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["my-certificates-page", user?.id],
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

  const shareToLinkedIn = (courseName: string, certUrl: string) => {
    const text = `I just earned a certificate in "${courseName}" from DevWady Academy! 🎓`;
    const url = certUrl || window.location.origin;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      "_blank",
      "width=600,height=500"
    );
  };

  return (
    <>
      <SEO title={isAr ? "شهاداتي" : "My Certificates"} description={isAr ? "الشهادات المكتسبة" : "Your earned certificates"} />
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/academy/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3 w-3 icon-flip-rtl" /> {isAr ? "العودة للدورات" : "Back to Courses"}
              </Link>
              <h1 className="text-2xl font-bold">{isAr ? "شهاداتي" : "My Certificates"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "الشهادات المكتسبة من الدورات المكتملة" : "Certificates earned from completed courses"}</p>
            </div>
            <Link to="/my/learning">
              <Button variant="outline" size="sm" className="rounded-full">
                <BookOpen className="h-4 w-4 me-1.5" />{isAr ? "تعلّمي" : "My Learning"}
              </Button>
            </Link>
          </div>

          {/* Summary */}
          {certificates.length > 0 && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{certificates.length}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "شهادات مكتسبة" : "Certificates Earned"}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-16">
              <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">{isAr ? "لا توجد شهادات بعد" : "No certificates yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "أكمل دورة للحصول على أول شهادة" : "Complete a course to earn your first certificate"}</p>
              <Link to="/academy/courses">
                <Button variant="outline" size="sm" className="mt-4 rounded-full">
                  <BookOpen className="h-3.5 w-3.5 me-1" />{isAr ? "تصفح الدورات" : "Browse Courses"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((e: any, i: number) => {
                const course = e.training_courses;
                const courseName = isAr ? (course?.title_ar || course?.title_en) : course?.title_en;
                const certPageUrl = `${window.location.origin}/certificate/${e.id}`;
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                      {/* Certificate preview header */}
                      <div className="h-28 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
                        <div className="relative text-center">
                          <Award className="h-10 w-10 text-primary mx-auto mb-1" />
                          <p className="text-[10px] font-medium text-primary/70 uppercase tracking-widest">
                            {isAr ? "شهادة إتمام" : "Certificate of Completion"}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold truncate mb-1">{courseName}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {isAr ? "مكتمل في" : "Completed on"} {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Link to={`/certificate/${e.id}`}>
                            <Button variant="default" size="sm" className="h-7 text-xs">
                              <ExternalLink className="h-3 w-3 me-1" />{isAr ? "عرض" : "View"}
                            </Button>
                          </Link>
                          {e.certificate_url && (
                            <a href={e.certificate_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <Download className="h-3 w-3 me-1" />{isAr ? "تحميل" : "Download"}
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => shareToLinkedIn(courseName || "", e.certificate_url || certPageUrl)}
                          >
                            <Share2 className="h-3 w-3 me-1" />LinkedIn
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
