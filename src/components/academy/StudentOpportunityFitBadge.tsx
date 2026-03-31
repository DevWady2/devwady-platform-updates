/**
 * StudentOpportunityFitBadge — compact inline opportunity alignment indicator.
 * For instructor surfaces: shows how many opportunities align with a student's profile.
 * Read-only, no apply flow.
 */
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { useOpportunityHints } from "@/features/academy/talentBridge/useOpportunityHints";
import type { StudentMatchProfile } from "@/features/academy/talentBridge/opportunityMatching";
import type { StudentTalentData } from "@/portals/academy/hooks/useStudentTalentSignals";

interface Props {
  talentData: StudentTalentData | undefined;
}

/**
 * Only renders for students who are opportunity_ready + have a derived signal.
 * Fetches opportunity hints inline and shows a compact badge.
 */
export default function StudentOpportunityFitBadge({ talentData }: Props) {
  const isEligible =
    talentData?.hasProfile &&
    talentData.visibility === "opportunity_ready" &&
    talentData.allowOpportunityMatching === true &&
    talentData.signal &&
    talentData.signal !== "not_ready_yet";

  const matchProfile: StudentMatchProfile | null = isEligible
    ? {
        primaryTrack: null, // Not available at this level; matching uses tags
        specializationTags: [],
        talentSignal: talentData!.signal!,
        hasRecommendation: talentData!.recommendationCount > 0,
        nominationCount: talentData!.nominationCount,
        availabilityStatus: null,
      }
    : null;

  const { summary } = useOpportunityHints(matchProfile, isEligible ?? false);

  if (!summary || summary.alignedCount === 0) return null;

  return (
    <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 text-primary border-primary/20 bg-primary/5" title={summary.alignedCount === 1 ? "1 internal role alignment" : `${summary.alignedCount} internal role alignments`}>
      <Briefcase className="h-2.5 w-2.5" />
      {summary.alignedCount} {summary.alignedCount === 1 ? "fit" : "fits"}
    </Badge>
  );
}
