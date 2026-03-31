/**
 * StudentTalentBadges — compact inline talent indicators for student cards.
 * Shows talent profile status, recommendation count, nomination opt-in,
 * and explicit blocked/private states for instructor awareness.
 */
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Award, UserCheck, Eye, ShieldOff, EyeOff } from "lucide-react";
import type { StudentTalentData } from "@/portals/academy/hooks/useStudentTalentSignals";

interface Props {
  data: StudentTalentData | undefined;
  compact?: boolean;
}

export default function StudentTalentBadges({ data, compact }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  if (!data) return null;

  // No talent profile at all — nothing to show
  if (!data.hasProfile) return null;

  const isPrivate = data.visibility === "private";
  const isNominationBlocked = data.hasProfile && !data.allowNomination;

  const visibilityLabel =
    data.visibility === "opportunity_ready"
      ? (isAr ? "مفتوح للفرص" : "Open")
      : data.visibility === "academy_only"
        ? (isAr ? "أكاديمي" : "Academy")
        : null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Private profile indicator */}
      {isPrivate && (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/20">
          <EyeOff className="h-2.5 w-2.5" />
          {!compact && (isAr ? "خاص" : "Private")}
        </Badge>
      )}

      {/* Visible profile visibility level */}
      {!isPrivate && visibilityLabel && (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
          <Eye className="h-2.5 w-2.5" />
          {!compact && visibilityLabel}
        </Badge>
      )}

      {/* Nomination opt-in */}
      {data.allowNomination && (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 bg-accent text-accent-foreground border-accent/50">
          <UserCheck className="h-2.5 w-2.5" />
          {!compact && (isAr ? "قابل للترشيح" : "Nominatable")}
        </Badge>
      )}

      {/* Nomination blocked — explicit indicator */}
      {isNominationBlocked && (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 bg-destructive/5 text-destructive border-destructive/20">
          <ShieldOff className="h-2.5 w-2.5" />
          {!compact && (isAr ? "الترشيح مغلق" : "Nom. Blocked")}
        </Badge>
      )}

      {/* Recommendation count */}
      {data.recommendationCount > 0 && (
        <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0 h-4">
          <Star className="h-2.5 w-2.5" />
          {data.recommendationCount}
        </Badge>
      )}

      {/* Nomination count */}
      {data.nominationCount > 0 && (
        <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0 h-4">
          <Award className="h-2.5 w-2.5" />
          {data.nominationCount}
        </Badge>
      )}
    </div>
  );
}
