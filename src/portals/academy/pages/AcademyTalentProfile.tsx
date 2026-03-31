/**
 * Academy Student — Talent Profile Page
 *
 * Lets students opt into the Talent Bridge, manage visibility,
 * and maintain their academy-ready profile.
 * Route: /academy/portal/talent-profile
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, EyeOff, Sparkles, AlertTriangle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useMyTalentProfile,
  useUpsertTalentProfile,
  useMyRecommendations,
  useMyNominations,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
  
  type TalentVisibility,
} from "@/features/academy/talentBridge";
import { useStudentEnrollments } from "@/portals/academy/hooks/useStudentEnrollments";
import { computeReadiness } from "@/features/academy/learningModel/readiness";
import { deriveTalentSignal, TALENT_SIGNAL_LABELS, TALENT_SIGNAL_COLORS, useOpportunityHints } from "@/features/academy/talentBridge";
import type { StudentMatchProfile } from "@/features/academy/talentBridge";
import ReadinessSignalCard from "@/components/academy/ReadinessSignalCard";
import OpportunityHintsCard from "@/components/academy/OpportunityHintsCard";

const VISIBILITY_OPTIONS: TalentVisibility[] = ["private", "academy_only", "opportunity_ready"];

export default function AcademyTalentProfile() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const userId = user?.id;

  const { data: profile, isLoading } = useMyTalentProfile(userId);
  const upsert = useUpsertTalentProfile();

  // Form state
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [primaryTrack, setPrimaryTrack] = useState("");
  const [specTags, setSpecTags] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [visibility, setVisibility] = useState<TalentVisibility>("private");
  const [allowNomination, setAllowNomination] = useState(false);
  const [allowMatching, setAllowMatching] = useState(false);

  // Populate from loaded profile
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? "");
      setSummary(profile.summary ?? "");
      setPrimaryTrack(profile.primary_track ?? "");
      setSpecTags((profile.specialization_tags ?? []).join(", "));
      setPortfolioUrl(profile.portfolio_url ?? "");
      setGithubUrl(profile.github_url ?? "");
      setLinkedinUrl(profile.linkedin_url ?? "");
      setCvUrl(profile.cv_url ?? "");
      setAvailabilityStatus(profile.availability_status ?? "");
      setVisibility((profile.visibility_state as TalentVisibility) ?? "private");
      setAllowNomination(profile.allow_nomination ?? false);
      setAllowMatching(profile.allow_opportunity_matching ?? false);
    }
  }, [profile]);

  // Real data: enrollments + lesson progress
  const { enrollments, progressData } = useStudentEnrollments();
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");
  const totalCompleted = progressData.filter((p: any) => p.is_completed).length;
  const totalLessons = activeEnrollments.reduce((s: number, e: any) => s + (e.training_courses?.total_lessons ?? 0), 0);

  // Real data: recommendations & nominations for this student
  const { data: myRecommendations = [] } = useMyRecommendations(userId);
  const { data: myNominations = [] } = useMyNominations(userId); // used in match profile
  const activeRecs = myRecommendations.filter((r: any) => r.status === "active");
  const hasInstructorRecommendation = activeRecs.length > 0;

  // Readiness: only use lesson-based dimension (the only one with real data).
  // Sessions, assessments, and projects are marked as unsupported so the
  // signal engine skips them instead of presenting fake zeros as real data.
  const readiness = computeReadiness({
    lessonsCompleted: totalCompleted,
    lessonsTotal: totalLessons,
    attendedSessions: 0,
    requiredSessions: 0,
    assessmentsPassed: 0,
    assessmentsTotal: 0,
    projectsApproved: 0,
    projectsTotal: 0,
    supportsLiveSessions: false,
    supportsAssessments: false,
    supportsProjects: false,
  });

  // Talent signal: real lesson + recommendation data; unsupported dimensions excluded
  const talentResult = deriveTalentSignal({
    readiness,
    lessonsCompleted: totalCompleted,
    lessonsTotal: totalLessons,
    projectsApproved: 0,
    projectsTotal: 0,
    assessmentsPassed: 0,
    assessmentsTotal: 0,
    attendedSessions: 0,
    requiredSessions: 0,
    isBootcamp: false,
    isLiveCourse: false,
    cohortCompletionState: null,
    hasInstructorRecommendation,
    recommendationCount: myRecommendations.length,
  });

  // Track which dimensions have real data for transparent preview
  const availableDimensions = ["Lesson completion"];
  if (myRecommendations.length > 0) availableDimensions.push("Recommendations");
  const limitedPreview = true; // signal is based on partial data only

  // Opportunity matching hints (read-only, for opted-in students)
  const studentMatchProfile: StudentMatchProfile | null =
    allowMatching && visibility === "opportunity_ready"
      ? {
          primaryTrack: primaryTrack || null,
          specializationTags: specTags ? specTags.split(",").map(t => t.trim()).filter(Boolean) : [],
          talentSignal: talentResult.signal,
          hasRecommendation: hasInstructorRecommendation,
          nominationCount: myNominations.length,
          availabilityStatus: availabilityStatus || null,
        }
      : null;

  const { summary: oppSummary } = useOpportunityHints(studentMatchProfile);

  const handleSave = async () => {
    if (!userId) return;
    // State consistency: clear matching if visibility is not opportunity_ready
    const effectiveMatching = visibility === "opportunity_ready" ? allowMatching : false;
    try {
      await upsert.mutateAsync({
        user_id: userId,
        headline: headline || null,
        summary: summary || null,
        primary_track: primaryTrack || null,
        specialization_tags: specTags ? specTags.split(",").map(t => t.trim()).filter(Boolean) : null,
        portfolio_url: portfolioUrl || null,
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        cv_url: cvUrl || null,
        availability_status: availabilityStatus || null,
        visibility_state: visibility,
        allow_nomination: allowNomination,
        allow_opportunity_matching: effectiveMatching,
      });
      // Sync local state to match saved value
      if (!effectiveMatching && allowMatching) setAllowMatching(false);
      toast.success(isAr ? "تم حفظ الملف بنجاح" : "Talent profile saved");
    } catch {
      toast.error(isAr ? "فشل حفظ الملف" : "Failed to save profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Talent Profile"
        title_ar="ملف المواهب"
        description_en="Manage your academy-ready profile and talent bridge visibility"
        description_ar="إدارة ملفك الأكاديمي وإعدادات ظهورك في جسر المواهب"
      />

      {/* Privacy & Visibility — shown first for safety */}
      <Card className="border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {isAr ? "الخصوصية والظهور" : "Privacy & Visibility"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "تحكّم في من يمكنه رؤية ملف مواهبك. الإعداد الافتراضي خاص تمامًا."
              : "Control who can see your talent profile. Default is completely private."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? "حالة الظهور" : "Visibility State"}</Label>
            <Select value={visibility} onValueChange={v => setVisibility(v as TalentVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map(v => (
                  <SelectItem key={v} value={v}>
                    <div className="flex items-center gap-2">
                      {v === "private" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{isAr ? VISIBILITY_LABELS[v].ar : VISIBILITY_LABELS[v].en}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {isAr ? VISIBILITY_DESCRIPTIONS[visibility].ar : VISIBILITY_DESCRIPTIONS[visibility].en}
            </p>
          </div>

          {visibility !== "private" && (
            <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? "تغيير الظهور من 'خاص' يعني أن المدرّبين في دوراتك قد يرون ملفك."
                  : "Changing visibility from Private means instructors in your courses may see your profile."}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">{isAr ? "السماح بالترشيح" : "Allow Nomination"}</Label>
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? "السماح للمدرّبين بترشيحك لفرص العمل"
                  : "Let instructors nominate you for opportunities"}
              </p>
            </div>
            <Switch checked={allowNomination} onCheckedChange={setAllowNomination} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">{isAr ? "السماح بمطابقة الفرص" : "Allow Opportunity Matching"}</Label>
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? "السماح لشركاء التوظيف برؤية جاهزيتك (يتطلب 'مفتوح للفرص')"
                  : "Let hiring partners see your readiness signals (requires 'Open to Opportunities')"}
              </p>
            </div>
            <Switch
              checked={allowMatching}
              onCheckedChange={setAllowMatching}
              disabled={visibility !== "opportunity_ready"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Readiness hint — partial preview with transparency */}
      {readiness.overall_readiness_status !== "not_started" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {isAr ? "إشارات الجاهزية" : "Readiness Signals"}
              {limitedPreview && (
                <Badge variant="outline" className="text-[9px] ml-1">
                  {isAr ? "معاينة جزئية" : "Partial Preview"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReadinessSignalCard signals={readiness} compact />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{isAr ? "إشارة المواهب:" : "Talent Signal:"}</span>
              <Badge className={TALENT_SIGNAL_COLORS[talentResult.signal] + " text-xs"}>
                {isAr ? TALENT_SIGNAL_LABELS[talentResult.signal].ar : TALENT_SIGNAL_LABELS[talentResult.signal].en}
              </Badge>
            </div>
            {limitedPreview && (
              <p className="text-[10px] text-muted-foreground italic">
                {isAr
                  ? `مبني على: ${availableDimensions.join("، ")}. التقييمات والمشاريع والحضور غير متوفرة بعد.`
                  : `Based on: ${availableDimensions.join(", ")}. Assessments, projects, and session attendance not yet available.`}
              </p>
            )}
            {talentResult.blockers.length > 0 && (
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p className="font-medium">{isAr ? "للتقدم للمستوى التالي:" : "To reach the next level:"}</p>
                {talentResult.blockers.map((b, i) => <p key={i}>• {b}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Opportunity Hints — only for opted-in students with matching enabled */}
      {oppSummary && oppSummary.totalOpportunities > 0 && (
        <OpportunityHintsCard summary={oppSummary} />
      )}

      {/* Profile Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "معلومات الملف" : "Profile Information"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "العنوان الرئيسي" : "Headline"}</Label>
              <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder={isAr ? "مثال: مطور Android" : "e.g. Android Developer"} />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "المسار الأساسي" : "Primary Track"}</Label>
              <Input value={primaryTrack} onChange={e => setPrimaryTrack(e.target.value)} placeholder={isAr ? "مثال: تطوير Android" : "e.g. Android Development"} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{isAr ? "الملخص" : "Summary"}</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder={isAr ? "نبذة مختصرة عنك" : "Brief summary about yourself"} />
          </div>

          <div className="space-y-1.5">
            <Label>{isAr ? "التخصصات" : "Specialization Tags"}</Label>
            <Input value={specTags} onChange={e => setSpecTags(e.target.value)} placeholder={isAr ? "مفصولة بفاصلة: Kotlin, Jetpack Compose" : "Comma-separated: Kotlin, Jetpack Compose"} />
            <p className="text-[10px] text-muted-foreground">{isAr ? "مفصولة بفاصلة" : "Comma-separated values"}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{isAr ? "حالة التوفر" : "Availability Status"}</Label>
            <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر الحالة" : "Select status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actively_looking">{isAr ? "أبحث بنشاط" : "Actively Looking"}</SelectItem>
                <SelectItem value="open_to_offers">{isAr ? "مفتوح للعروض" : "Open to Offers"}</SelectItem>
                <SelectItem value="not_looking">{isAr ? "غير مهتم حاليًا" : "Not Looking"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "الروابط" : "Links"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Portfolio URL</Label>
            <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>GitHub URL</Label>
            <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1.5">
            <Label>CV / Resume URL</Label>
            <Input value={cvUrl} onChange={e => setCvUrl(e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isAr ? "حفظ الملف" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
