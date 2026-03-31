/**
 * Academy — Student Progress overview.
 * Uses shared useStudentEnrollments hook + readiness signals.
 * Surfaces Talent Bridge status: opt-in, nomination readiness, opportunity hints.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState } from "@/core/components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, CheckCircle2, Clock, Sparkles, Eye, EyeOff, UserCheck, Briefcase } from "lucide-react";
import { useStudentEnrollments } from "../hooks/useStudentEnrollments";
import { computeReadiness } from "@/features/academy/learningModel/readiness";
import ReadinessSignalCard from "@/components/academy/ReadinessSignalCard";
import {
  useMyTalentProfile,
  useMyRecommendations,
  useMyNominations,
  deriveTalentSignal,
  TALENT_SIGNAL_LABELS,
  TALENT_SIGNAL_COLORS,
  VISIBILITY_LABELS,
  useOpportunityHints,
} from "@/features/academy/talentBridge";
import type { StudentMatchProfile } from "@/features/academy/talentBridge";

export default function AcademyProgress() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const { enrollments, progressData, isLoading, getProgress } = useStudentEnrollments();
  const { data: talentProfile } = useMyTalentProfile(user?.id);
  const { data: myRecommendations = [] } = useMyRecommendations(user?.id);
  const { data: myNominations = [] } = useMyNominations(user?.id);

  const activeRecommendations = myRecommendations.filter((r: any) => r.status === "active");
  const hasActiveRec = activeRecommendations.length > 0;
  const recCount = myRecommendations.length;
  const nomCount = myNominations.length;

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const totalCompleted = progressData.filter(p => p.is_completed).length;
  const totalLessonsAll = activeEnrollments.reduce((s: number, e: any) => s + (e.training_courses?.total_lessons ?? 0), 0);
  const overallPct = totalLessonsAll > 0 ? Math.round((totalCompleted / totalLessonsAll) * 100) : 0;

  // Derive talent signal — mark unwired dimensions as unsupported
  const readiness = computeReadiness({
    lessonsCompleted: totalCompleted,
    lessonsTotal: totalLessonsAll,
    attendedSessions: 0, requiredSessions: 0,
    assessmentsPassed: 0, assessmentsTotal: 0,
    projectsApproved: 0, projectsTotal: 0,
    supportsLiveSessions: false, supportsAssessments: false, supportsProjects: false,
  });
  const talentResult = deriveTalentSignal({
    readiness,
    lessonsCompleted: totalCompleted, lessonsTotal: totalLessonsAll,
    projectsApproved: 0, projectsTotal: 0,
    assessmentsPassed: 0, assessmentsTotal: 0,
    attendedSessions: 0, requiredSessions: 0,
    isBootcamp: false, isLiveCourse: false, cohortCompletionState: null,
    hasInstructorRecommendation: hasActiveRec, recommendationCount: recCount,
  });
  const isPartialSignal = true; // projects, assessments, sessions not yet wired

  // Opportunity hints — only for opted-in students
  const visibility = (talentProfile?.visibility_state ?? "private") as string;
  const allowMatching = talentProfile?.allow_opportunity_matching ?? false;
  const allowNomination = talentProfile?.allow_nomination ?? false;
  const studentMatchProfile: StudentMatchProfile | null =
    allowMatching && visibility === "opportunity_ready"
      ? {
          primaryTrack: talentProfile?.primary_track ?? null,
          specializationTags: (talentProfile?.specialization_tags as string[]) ?? [],
          talentSignal: talentResult.signal,
          hasRecommendation: hasActiveRec,
          nominationCount: nomCount,
          availabilityStatus: talentProfile?.availability_status ?? null,
        }
      : null;
  const { summary: oppSummary } = useOpportunityHints(studentMatchProfile);

  const getCompletedCount = (enrollmentId: string) =>
    progressData.filter(p => p.enrollment_id === enrollmentId && p.is_completed).length;

  const getLastAccessed = (enrollmentId: string) => {
    const items = progressData.filter(p => p.enrollment_id === enrollmentId);
    return items.reduce((latest, p) => {
      const d = p.last_accessed_at ? new Date(p.last_accessed_at).getTime() : 0;
      return d > latest ? d : latest;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Learning Progress"
        title_ar="تقدم التعلم"
        description_en="Track your progress across all enrolled courses"
        description_ar="تتبع تقدمك في جميع الدورات المسجل بها"
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{isAr ? "التقدم الإجمالي" : "Overall Progress"}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <Progress value={overallPct} className="h-2.5 flex-1" />
                <span className="text-sm font-bold text-primary">{overallPct}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {totalCompleted} / {totalLessonsAll} {isAr ? "درس مكتمل" : "lessons completed"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Talent Bridge status card */}
      <Link to="/academy/portal/talent-profile">
        <Card className="hover:shadow-md transition-shadow border-primary/20">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium">{isAr ? "ملف المواهب" : "Talent Profile"}</h3>
                <p className="text-[10px] text-muted-foreground">{isAr ? "إدارة ظهورك المهني وجسر المواهب" : "Manage your career visibility & talent bridge settings"}</p>
              </div>
            </div>

            {/* Status badges row */}
            <div className="flex flex-wrap gap-1.5">
              {/* Visibility */}
              <Badge variant="outline" className="text-[10px] gap-1 h-5">
                {visibility === "private" ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {isAr ? VISIBILITY_LABELS[visibility as keyof typeof VISIBILITY_LABELS]?.ar : VISIBILITY_LABELS[visibility as keyof typeof VISIBILITY_LABELS]?.en ?? visibility}
              </Badge>

              {/* Nomination opt-in */}
              <Badge
                variant="outline"
                className={`text-[10px] gap-1 h-5 ${allowNomination ? "text-emerald-600 border-emerald-500/30" : "text-muted-foreground"}`}
              >
                <UserCheck className="h-3 w-3" />
                {allowNomination
                  ? (isAr ? "قابل للترشيح" : "Nominatable")
                  : (isAr ? "الترشيح مغلق" : "Nomination Off")}
              </Badge>

              {/* Talent signal */}
              {talentResult.signal !== "not_ready_yet" && (
                <Badge className={`text-[10px] h-5 ${TALENT_SIGNAL_COLORS[talentResult.signal]}`}>
                  {isAr ? TALENT_SIGNAL_LABELS[talentResult.signal].ar : TALENT_SIGNAL_LABELS[talentResult.signal].en}
                </Badge>
              )}

              {/* Partial preview indicator */}
              {isPartialSignal && (
                <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground border-dashed">
                  {isAr ? "معاينة جزئية" : "Partial Preview"}
                </Badge>
              )}

              {/* Opportunity summary chip */}
              {oppSummary && oppSummary.alignedCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 h-5 text-primary border-primary/30">
                  <Briefcase className="h-3 w-3" />
                  {oppSummary.alignedCount} {isAr ? "فرصة متوافقة" : "aligned"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : activeEnrollments.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title_en="No active courses"
          title_ar="لا توجد دورات نشطة"
          description_en="Enroll in a course to start tracking your progress"
          description_ar="سجل في دورة لبدء تتبع تقدمك"
        />
      ) : (
        <div className="space-y-3">
          {activeEnrollments.map((e: any) => {
            const course = e.training_courses;
            const pct = getProgress(e.id, course?.total_lessons ?? 0);
            const completedCount = getCompletedCount(e.id);
            const lastAccessed = getLastAccessed(e.id);
            return (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/learn/${course?.slug}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">
                        {isAr ? course?.title_ar : course?.title_en}
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs font-bold">{pct}%</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />{completedCount}/{course?.total_lessons ?? 0}</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{course?.duration_en ?? "—"}</span>
                        {lastAccessed > 0 && (
                          <span>{isAr ? "آخر وصول" : "Last"}: {new Date(lastAccessed).toLocaleDateString()}</span>
                        )}
                      </div>
                      {/* Readiness signals */}
                      {(() => {
                        const totalLessons = course?.total_lessons ?? 0;
                        const signals = computeReadiness({
                          lessonsCompleted: completedCount,
                          lessonsTotal: totalLessons,
                          attendedSessions: 0, requiredSessions: 0,
                          assessmentsPassed: 0, assessmentsTotal: 0,
                          projectsApproved: 0, projectsTotal: 0,
                          supportsLiveSessions: false, supportsAssessments: false, supportsProjects: false,
                        });
                        return signals.overall_readiness_status !== "not_started" ? (
                          <div className="mt-1.5">
                            <ReadinessSignalCard signals={signals} compact />
                          </div>
                        ) : null;
                      })()}
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
