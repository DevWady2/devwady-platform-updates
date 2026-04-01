/**
 * Academy — Shared constants.
 *
 * Status colors and helpers are now canonical in the learning model.
 * Re-exported here for backward compatibility with existing portal imports.
 */
export {
  ENROLLMENT_STATUS_COLORS,
  COURSE_STATUS_COLORS,
} from "@/features/academy/learningModel/statuses";

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
