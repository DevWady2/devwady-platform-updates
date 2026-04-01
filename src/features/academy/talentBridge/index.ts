/**
 * Academy Talent Bridge — Public API
 *
 * Centralized vocabulary and helpers for the internal academy-to-talent
 * bridge preparation layer. Import from this barrel file.
 *
 * NOTE: This is an internal preparation phase. Jobs/opportunities remain
 * owned by the existing Talent portal. Recommendations and nominations
 * are privacy-gated and do not imply public student exposure.
 */

// Talent signals
export {
  TALENT_SIGNALS,
  TALENT_SIGNAL_LABELS,
  TALENT_SIGNAL_DESCRIPTIONS,
  TALENT_SIGNAL_COLORS,
  talentSignalRank,
  meetsSignalThreshold,
} from "./signals";
export type { TalentSignal } from "./signals";

// Recommendation types
export {
  RECOMMENDATION_TYPES,
  RECOMMENDATION_TYPE_LABELS,
  RECOMMENDATION_TYPE_DESCRIPTIONS,
} from "./recommendations";
export type { RecommendationType } from "./recommendations";

// Nomination scopes & statuses
export {
  NOMINATION_SCOPES,
  NOMINATION_SCOPE_LABELS,
  NOMINATION_SCOPE_DESCRIPTIONS,
  NOMINATION_STATUSES,
  NOMINATION_STATUS_LABELS,
  NOMINATION_STATUS_COLORS,
  NOMINATION_STATUS_TRANSITIONS,
  isTerminalNominationStatus,
} from "./nominations";
export type { NominationScope, NominationStatus } from "./nominations";

// Visibility
export {
  VISIBILITY_STATES,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
  VISIBILITY_COLORS,
  isExternallyVisible,
  isNominationEligible,
} from "./visibility";
export type { TalentVisibility } from "./visibility";

// Helpers
export {
  readinessToTalentSignal,
  formatBridgeLabel,
  compareTalentSignals,
  maxTalentSignal,
  minTalentSignal,
  minimumSignalForExperienceLevel,
  signalMeetsExperienceLevel,
} from "./helpers";

// Data hooks
export {
  useMyTalentProfile,
  useUpsertTalentProfile,
  useMyRecommendations,
  useInstructorRecommendations,
  useCreateRecommendation,
  useUpdateRecommendation,
  useMyNominations,
  useInstructorNominations,
  useCreateNomination,
  useUpdateNomination,
} from "./hooks";

// Derived signal computation
export { deriveTalentSignal } from "./derivedSignals";
export type { TalentSignalInput, TalentSignalResult, SignalBreakdownEntry } from "./derivedSignals";

// Opportunity matching (read-only preparation)
export {
  matchStudentToOpportunity,
  matchStudentToOpportunities,
} from "./opportunityMatching";
export type {
  StudentMatchProfile,
  OpportunityRecord,
  OpportunityMatchResult,
  MatchingSummary,
} from "./opportunityMatching";

// Opportunity hints hook
export { useOpportunityHints } from "./useOpportunityHints";
