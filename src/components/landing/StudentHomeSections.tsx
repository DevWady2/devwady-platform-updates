/**
 * StudentHomeSections — Feed column for Student Home.
 *
 * Receives StudentHomeData as props and renders by homeState:
 *  - loading:    skeleton pulse
 *  - empty:      2×2 starter dashboard grid
 *  - low_signal: summary strip + continue learning + guidance
 *  - active:     full feed (continue → activity → community → opportunities)
 *
 * No insights section in v1.
 * Export reconciliation marker: Phase B1 student home sections.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import type {
  StudentHomeData,
  StudentCommunityItem,
  StudentOpportunityItem,
} from "@/hooks/useStudentHomeData";
import SummaryStrip, { type SummaryStat } from "@/components/home/SummaryStrip";
import FeedSection from "@/components/home/FeedSection";
import FeedCard from "@/components/home/FeedCard";
import {
  BookOpen, GraduationCap, Calendar, ClipboardCheck,
  UserCog, Map, Sparkles, ArrowRight, Plus,
  CheckCircle2, UsersRound, Activity, Lightbulb,
} from "lucide-react";

interface StudentHomeSectionsProps {
  data: StudentHomeData;
}

export default function StudentHomeSections({ data }: StudentHomeSectionsProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  if (data.isLoading) {
    return <LoadingSkeleton />;
  }

  switch (data.homeState) {
    case "empty":
      return <EmptyState isAr={isAr} />;
    case "low_signal":
      return <LowSignalState isAr={isAr} data={data} />;
    case "active":
      return <ActiveFeed isAr={isAr} data={data} />;
  }
}

// ─── Summary Stats Builder ──────────────────────────────────────────────────

function buildSummaryStats(
  stats: StudentHomeData["summaryStats"],
  isAr: boolean,
): SummaryStat[] {
  const items: SummaryStat[] = [
    { label: isAr ? "دورات نشطة" : "Active", value: stats.activeCourses, icon: BookOpen },
  ];
  if (stats.avgProgress > 0) {
    items.push({
      label: isAr ? "تقدم" : "Progress",
      value: `${Math.round(stats.avgProgress)}%`,
      icon: GraduationCap,
    });
  }
  if (stats.upcomingSessions > 0) {
    items.push({
      label: isAr ? "جلسات" : "Sessions",
      value: stats.upcomingSessions,
      icon: Calendar,
    });
  }
  if (stats.pendingSubmissions > 0) {
    items.push({
      label: isAr ? "تسليمات" : "Pending",
      value: stats.pendingSubmissions,
      icon: ClipboardCheck,
    });
  }
  return items;
}

// ─── Empty State — Starter Dashboard Grid ───────────────────────────────────

function EmptyState({ isAr }: { isAr: boolean }) {
  const { percentage, nextStep, loading } = useProfileCompleteness();
  const showProfile = !loading && percentage < 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Card 1 — Browse Courses */}
      <StarterCard
        icon={GraduationCap}
        title={isAr ? "تصفح الدورات" : "Browse courses"}
        body={isAr ? "اكتشف الدورات المتاحة وسجّل في ما يناسبك." : "Explore available courses and enroll in what fits your goals."}
        actionLabel={isAr ? "تصفح" : "Browse courses"}
        actionPath="/academy/courses"
        accent
      />

      {/* Card 2 — Complete Profile (conditional) */}
      {showProfile && (
        <StarterCard
          icon={UserCog}
          title={isAr ? "أكمل ملفك الشخصي" : "Complete your profile"}
          body={
            nextStep
              ? `${percentage}% — ${isAr ? "التالي" : "Next"}: ${nextStep}`
              : `${percentage}%`
          }
          actionLabel={isAr ? "تعديل الملف" : "Edit profile"}
          actionPath="/profile/edit"
        />
      )}

      {/* Card 3 — How Learning Works */}
      <div className="rounded-xl border border-border/60 bg-card p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
            <Map className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-card-foreground mb-1.5">
              {isAr ? "كيف يعمل التعلم" : "How learning works"}
            </h4>
            <ol className="space-y-1">
              {(isAr
                ? ["سجّل في دورة", "تعلّم وأكمل الدروس", "احصل على شهادتك"]
                : ["Enroll in a course", "Learn and complete lessons", "Earn your certificate"]
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

      {/* Card 4 — Set Up Talent Profile */}
      <div className={!showProfile ? "sm:col-span-2" : ""}>
        <StarterCard
          icon={Sparkles}
          title={isAr ? "أنشئ ملفك المهني" : "Set up your talent profile"}
          body={isAr ? "فعّل المطابقة مع الفرص والترشيحات." : "Enable opportunity matching and instructor nominations."}
          actionLabel={isAr ? "إعداد" : "Set up profile"}
          actionPath="/academy/portal/talent-profile"
        />
      </div>
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

// ─── Low-Signal State ───────────────────────────────────────────────────────

function LowSignalState({
  isAr,
  data,
}: {
  isAr: boolean;
  data: StudentHomeData;
}) {
  return (
    <div className="space-y-3">
      <SummaryStrip stats={buildSummaryStats(data.summaryStats, isAr)} />

      {data.continueItems.length > 0 && (
        <FeedSection
          title={isAr ? "أكمل التعلم" : "Continue Learning"}
          icon={BookOpen}
          viewAllPath="/my/learning"
        >
          {data.continueItems.map((item, idx) => (
            <FeedCard
              key={item.id}
              icon={feedTypeIcon(item.type)}
              title={item.title}
              subtitle={item.subtitle}
              timestamp={item.timestamp}
              actionPath={item.actionPath}
              accent={idx === 0 ? "attention" : item.accent}
            />
          ))}
        </FeedSection>
      )}

      {/* Guidance card */}
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
                ? "مع تقدمك في الدروس والمشاريع، ستظهر هنا النتائج والنشاطات والفرص."
                : "As you progress through lessons and projects, your results, activity, and opportunities will appear here."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active Feed ────────────────────────────────────────────────────────────

function ActiveFeed({
  isAr,
  data,
}: {
  isAr: boolean;
  data: StudentHomeData;
}) {
  return (
    <div className="space-y-4">
      <SummaryStrip stats={buildSummaryStats(data.summaryStats, isAr)} />

      {/* 1. Continue Learning */}
      {data.continueItems.length > 0 && (
        <FeedSection
          title={isAr ? "أكمل التعلم" : "Continue Learning"}
          icon={BookOpen}
          viewAllPath="/my/learning"
        >
          {data.continueItems.map((item, idx) => (
            <FeedCard
              key={item.id}
              icon={feedTypeIcon(item.type)}
              title={item.title}
              subtitle={item.subtitle}
              timestamp={item.timestamp}
              actionPath={item.actionPath}
              accent={idx === 0 ? "attention" : item.accent}
            />
          ))}
        </FeedSection>
      )}

      {/* 2. Learning Activity */}
      {data.learningActivityItems.length > 0 && (
        <FeedSection
          title={isAr ? "نشاط التعلم" : "Learning Activity"}
          icon={Activity}
        >
          {data.learningActivityItems.map((item) => (
            <FeedCard
              key={item.id}
              icon={feedTypeIcon(item.type)}
              title={item.title}
              subtitle={item.subtitle}
              timestamp={item.timestamp}
              actionPath={item.actionPath}
              accent={item.accent}
            />
          ))}
        </FeedSection>
      )}

      {/* 3. My Batch / Context */}
      {data.communityItems.length > 0 && (
        <FeedSection
          title={isAr ? "مجموعتي" : "My Batch"}
          icon={UsersRound}
        >
          {data.communityItems.map((item, idx) => (
            <StudentCommunityCard key={idx} item={item} isAr={isAr} />
          ))}
        </FeedSection>
      )}

      {/* 4. Talent & Opportunities */}
      {data.opportunityItems.length > 0 && (
        <FeedSection
          title={isAr ? "المواهب والفرص" : "Talent & Opportunities"}
          icon={Sparkles}
        >
          <div className="flex flex-wrap gap-2">
            {data.opportunityItems.map((opp, idx) => (
              <StudentOpportunityChip key={idx} item={opp} />
            ))}
          </div>
        </FeedSection>
      )}

      {/* Low-signal hint when sparse */}
      {data.homeState === "active" &&
        data.continueItems.length === 0 &&
        data.learningActivityItems.length === 0 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? "لا يوجد نشاط جديد — ستظهر التحديثات مع تقدمك."
                : "No new activity — updates will appear as you make progress."}
            </p>
          </div>
        )}
    </div>
  );
}

// ─── Local Sub-components ───────────────────────────────────────────────────

function StudentCommunityCard({ item, isAr }: { item: StudentCommunityItem; isAr: boolean }) {
  return (
    <Link
      to={item.actionPath}
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

function StudentOpportunityChip({ item }: { item: StudentOpportunityItem }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">
      <Sparkles className="h-3 w-3 text-muted-foreground" />
      <span className="font-bold text-card-foreground tabular-nums">{item.value}</span>
      <span className="text-muted-foreground">{item.label}</span>
    </div>
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

// ─── Icon resolver for student feed item types ──────────────────────────────

function feedTypeIcon(type: string) {
  switch (type) {
    case "resume_lesson":
      return BookOpen;
    case "join_session":
      return Calendar;
    case "review_feedback":
      return ClipboardCheck;
    case "continue_course":
      return GraduationCap;
    case "assessment_passed":
    case "assessment_failed":
      return GraduationCap;
    case "project_reviewed":
    case "project_submitted":
      return ClipboardCheck;
    default:
      return Activity;
  }
}
