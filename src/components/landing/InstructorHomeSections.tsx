/**
 * InstructorHomeSections — Feed-based homepage for the Instructor role.
 *
 * Renders based on maturity homeState:
 *  - new:      no courses or no students yet → starter CTA + informational
 *  - active:   has students → attention + activity + community feed
 *  - advanced: multiple courses, large student base → nomination + top-students priority
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

import type { InstructorHomeData, CommunityItem, InsightItem, OpportunitySummaryItem } from "@/hooks/useInstructorHomeData";
import SummaryStrip, { type SummaryStat } from "@/components/home/SummaryStrip";
import FeedSection from "@/components/home/FeedSection";
import FeedCard from "@/components/home/FeedCard";
import {
  BookOpen, Users, GraduationCap, ClipboardCheck, Calendar,
  AlertTriangle, Activity, UsersRound, Sparkles, TrendingUp,
  TrendingDown, ArrowRight, Plus, Share2, Lightbulb,
  Map, CheckCircle2, Star,
} from "lucide-react";

interface InstructorHomeSectionsProps {
  data: InstructorHomeData;
}

export default function InstructorHomeSections({ data }: InstructorHomeSectionsProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  if (data.isLoading) {
    return <LoadingSkeleton />;
  }

  switch (data.homeState) {
    case "new":
      return <NewInstructorState isAr={isAr} data={data} />;
    case "active":
      return <ActiveFeed isAr={isAr} data={data} />;
    case "advanced":
      return <AdvancedFeed isAr={isAr} data={data} />;
  }
}

// ─── Summary Stats Builder ──────────────────────────────────────────────────

function buildSummaryStats(
  stats: InstructorHomeData["summaryStats"],
  isAr: boolean
): SummaryStat[] {
  return [
    { label: isAr ? "دورات" : "Courses", value: stats.ownedCourses, icon: BookOpen },
    { label: isAr ? "منشورة" : "Published", value: stats.publishedCourses, icon: GraduationCap },
    { label: isAr ? "طلاب نشطين" : "Active", value: stats.activeStudents, icon: Users },
    { label: isAr ? "مكتملين" : "Completed", value: stats.completedStudents, icon: Users },
    ...(stats.pendingReviews > 0
      ? [{ label: isAr ? "مراجعات" : "Reviews", value: stats.pendingReviews, icon: ClipboardCheck }]
      : []),
    ...(stats.upcomingSessionsCount > 0
      ? [{ label: isAr ? "جلسات" : "Sessions", value: stats.upcomingSessionsCount, icon: Calendar }]
      : []),
  ];
}

// ─── New Instructor State ───────────────────────────────────────────────────

function NewInstructorState({ isAr, data }: { isAr: boolean; data: InstructorHomeData }) {
  const hasCourses = data.summaryStats.ownedCourses > 0;

  return (
    <div className="space-y-3">
      {hasCourses && <SummaryStrip stats={buildSummaryStats(data.summaryStats, isAr)} />}

      {!hasCourses ? (
        <>
          {/* Primary CTA — Create Android Course */}
          <StarterCard
            icon={BookOpen}
            title={isAr ? "أنشئ أول دورة Android لك" : "Create your first Android course"}
            body={isAr ? "ابنِ المحتوى وانشره كتجربة تعلّم." : "Build, structure, and publish a learning experience."}
            actionLabel={isAr ? "إنشاء دورة Android" : "Create Android Course"}
            actionPath="/instructor/workspace/courses/new"
            accent
          />

          {/* How your home works — informational only */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                <Map className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-card-foreground mb-1.5">
                  {isAr ? "كيف تعمل هذه الصفحة" : "How your home works"}
                </h4>
                <ol className="space-y-1">
                  {(isAr
                    ? ["أنشئ وانشر دورة", "الطلاب يسجّلون", "النشاط والرؤى تظهر هنا"]
                    : ["Create and publish a course", "Students enroll", "Activity and insights appear here"]
                  ).map((step, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Has courses but no students — share prompt */}
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-start gap-3">
              <Share2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-card-foreground">
                  {isAr ? "شارك دوراتك للحصول على طلاب" : "Share your courses to get students"}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                  {isAr
                    ? "دوراتك جاهزة — شاركها مع جمهورك."
                    : "Your courses are ready — share them with your audience or add enrollment links to your platforms."}
                </p>
                <Link
                  to="/instructor/courses"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 hover:text-primary/80 transition-colors"
                >
                  {isAr ? "عرض الدورات المنشورة" : "View My Listed Courses"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                <Map className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-card-foreground mb-1">
                  {isAr ? "ماذا سيحدث بعد ذلك" : "What happens next"}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isAr
                    ? "عندما يسجّل الطلاب، سيظهر هنا نشاطهم والتقييمات والعناصر التي تحتاج انتباهك ورؤى الأداء."
                    : "Once students enroll, their activity, submissions, attention items, and performance insights will appear on this page."}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <SecondaryCta isAr={isAr} />
    </div>
  );
}

/** Compact bordered card used in the starter dashboard grid */
function StarterCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionPath,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  actionLabel?: string;
  actionPath?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${accent ? "border-primary/25 bg-primary/5" : "border-border/60 bg-card"}`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${accent ? "bg-primary/10" : "bg-muted/60"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-card-foreground">{title}</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
          {actionLabel && actionPath && (
            <Link
              to={actionPath}
              className={`inline-flex items-center gap-1 text-[11px] font-medium mt-2 transition-colors ${
                accent
                  ? "rounded-md bg-primary px-2.5 py-1 text-primary-foreground hover:bg-primary/90"
                  : "text-primary hover:text-primary/80"
              }`}
            >
              {accent && <Plus className="h-3 w-3" />}
              {actionLabel}
              {!accent && <ArrowRight className="h-3 w-3" />}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Secondary CTA — shared across all states ──────────────────────────────

function SecondaryCta({ isAr }: { isAr: boolean }) {
  return (
    <Link
      to="/instructor/workspace"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {isAr ? "فتح مساحة العمل" : "Open Workspace"}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

// ─── Active Instructor Feed ─────────────────────────────────────────────────

function ActiveFeed({ isAr, data }: { isAr: boolean; data: InstructorHomeData }) {
  return (
    <div className="space-y-4">
      <SummaryStrip stats={buildSummaryStats(data.summaryStats, isAr)} />

      <Link
        to="/instructor/courses"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {isAr ? "عرض الدورات المنشورة" : "View My Listed Courses"}
        <ArrowRight className="h-3 w-3" />
      </Link>

      <SharedFeedSections isAr={isAr} data={data} />

      {/* Low-signal hint when active but sparse */}
      {data.attentionItems.length === 0 && data.teachingActivityItems.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <Lightbulb className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            {isAr
              ? "لا يوجد نشاط جديد — ستظهر التحديثات هنا عندما يتفاعل الطلاب."
              : "No new activity — updates will appear here as students engage."}
          </p>
        </div>
      )}

      <SecondaryCta isAr={isAr} />
    </div>
  );
}

// ─── Advanced Instructor Feed ───────────────────────────────────────────────

function AdvancedFeed({ isAr, data }: { isAr: boolean; data: InstructorHomeData }) {
  // Advanced prioritizes: top students → nominations → attention → activity
  const topStudents = data.insightItems.filter((i) => i.type === "top_student");
  const atRisk = data.insightItems.filter((i) => i.type === "at_risk");

  return (
    <div className="space-y-4">
      <SummaryStrip stats={buildSummaryStats(data.summaryStats, isAr)} />

      <Link
        to="/instructor/courses"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {isAr ? "عرض الدورات المنشورة" : "View My Listed Courses"}
        <ArrowRight className="h-3 w-3" />
      </Link>

      {/* Outstanding Students — advanced priority section */}
      {topStudents.length > 0 && (
        <FeedSection
          title={isAr ? "طلاب متميزون" : "Outstanding Students"}
          icon={Star}
        >
          {topStudents.map((item) => (
            <InsightRow key={item.id} item={item} isAr={isAr} />
          ))}
        </FeedSection>
      )}

      {/* Nomination Opportunities — advanced priority */}
      {data.opportunityItems.length > 0 && (
        <FeedSection
          title={isAr ? "فرص الترشيح" : "Nomination Opportunities"}
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-2">
            {data.opportunityItems.map((opp) => (
              <OpportunityChip key={opp.metric} item={opp} />
            ))}
          </div>
        </FeedSection>
      )}

      {/* At-risk students */}
      {atRisk.length > 0 && (
        <FeedSection
          title={isAr ? "يحتاج متابعة" : "Needs Follow-up"}
          icon={TrendingDown}
        >
          {atRisk.map((item) => (
            <InsightRow key={item.id} item={item} isAr={isAr} />
          ))}
        </FeedSection>
      )}

      <SharedFeedSections isAr={isAr} data={data} showInsights={false} />

      <SecondaryCta isAr={isAr} />
    </div>
  );
}

// ─── Shared Feed Sections (attention, activity, community, opportunities, insights) ─

function SharedFeedSections({
  isAr,
  data,
  showInsights = true,
}: {
  isAr: boolean;
  data: InstructorHomeData;
  showInsights?: boolean;
}) {
  return (
    <>
      {data.attentionItems.length > 0 && (
        <FeedSection
          title={isAr ? "يحتاج انتباهك" : "Needs Attention"}
          icon={AlertTriangle}
        >
          {data.attentionItems.map((item) => (
            <FeedCard
              key={item.id}
              icon={feedTypeIcon(item.type)}
              title={item.title}
              subtitle={item.subtitle}
              timestamp={item.timestamp}
              actionPath={item.actionPath}
              accent="attention"
            />
          ))}
        </FeedSection>
      )}

      {data.teachingActivityItems.length > 0 && (
        <FeedSection
          title={isAr ? "نشاط التدريس" : "Teaching Activity"}
          icon={Activity}
        >
          {data.teachingActivityItems.map((item) => (
            <FeedCard
              key={item.id}
              icon={feedTypeIcon(item.type)}
              title={item.title}
              subtitle={item.subtitle}
              timestamp={item.timestamp}
              actionPath={item.actionPath}
              accent="neutral"
            />
          ))}
        </FeedSection>
      )}

      {data.communityItems.length > 0 && (
        <FeedSection
          title={isAr ? "المجموعات والدفعات" : "Batches & Groups"}
          icon={UsersRound}
        >
          {data.communityItems.map((item) => (
            <CommunityCard key={`${item.courseId}-${item.cohortName}`} item={item} isAr={isAr} />
          ))}
        </FeedSection>
      )}

      {showInsights && data.opportunityItems.length > 0 && (
        <FeedSection
          title={isAr ? "الفرص" : "Opportunities"}
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-2">
            {data.opportunityItems.map((opp) => (
              <OpportunityChip key={opp.metric} item={opp} />
            ))}
          </div>
        </FeedSection>
      )}

      {showInsights && data.insightItems.length > 0 && (
        <FeedSection
          title={isAr ? "رؤى" : "Insights"}
          icon={TrendingUp}
        >
          {data.insightItems.map((item) => (
            <InsightRow key={item.id} item={item} isAr={isAr} />
          ))}
        </FeedSection>
      )}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CommunityCard({ item, isAr }: { item: CommunityItem; isAr: boolean }) {
  return (
    <Link
      to={item.deliveryPath}
      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 hover:bg-muted/50 transition-colors"
    >
      <UsersRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-card-foreground truncate">{item.cohortName}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {item.courseName} · {item.learnerCount} {isAr ? "متعلم" : "learners"}
          {item.nextSessionTitle && ` · ${isAr ? "التالي" : "Next"}: ${item.nextSessionTitle}`}
        </p>
      </div>
    </Link>
  );
}

function OpportunityChip({ item }: { item: OpportunitySummaryItem }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">
      <Sparkles className="h-3 w-3 text-muted-foreground" />
      <span className="font-bold text-card-foreground tabular-nums">{item.count}</span>
      <span className="text-muted-foreground">{item.label}</span>
    </div>
  );
}

function InsightRow({ item, isAr }: { item: InsightItem; isAr: boolean }) {
  const isRisk = item.type === "at_risk";
  const pct = Math.round(item.completionRatio);
  return (
    <Link
      to={`/instructor/workspace/courses/${item.courseId}/delivery`}
      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 hover:bg-muted/50 transition-colors"
    >
      {isRisk
        ? <TrendingDown className="h-3.5 w-3.5 shrink-0 text-warning" />
        : <TrendingUp className="h-3.5 w-3.5 shrink-0 text-success" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-card-foreground truncate">
          {item.studentName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {item.courseName} · {pct}%{isRisk ? (isAr ? " — متابعة" : " — follow-up") : ""}
        </p>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Icon resolver for feed item types ──────────────────────────────────────

function feedTypeIcon(type: string) {
  switch (type) {
    case "pending_project_review":
    case "pending_assessment_grading":
    case "project_submission":
      return ClipboardCheck;
    case "upcoming_session":
      return Calendar;
    case "assessment_outcome":
      return GraduationCap;
    case "nomination_update":
      return Sparkles;
    default:
      return Activity;
  }
}
