# Fixes applied to latest Lovable export

This package patches the latest `devwady-platform-updates-main.zip` export.

## Applied fixes

1. Fixed infinite loading risk in `src/hooks/useProfileCompleteness.ts` when a user has no `profiles` row.
2. Hardened `src/contexts/AuthContext.tsx` to create a fallback `profiles` row from auth metadata when missing.
3. Added `src/lib/profilePersistence.ts` helper for safer profile save/update flows.
4. Switched signup, onboarding, account settings, and profile edit flows to use safe profile persistence instead of update-only writes.
5. Fixed stale invalidation key in `src/pages/onboarding/ExpertOnboarding.tsx`.
6. Added insert fallback for missing `company_profiles` in `src/pages/ProfileEdit.tsx`.
7. Updated `.gitignore` to ignore `.env` files.

## Validation run

- `npm install`
- `npx tsc --noEmit -p tsconfig.json`
- `npm run build`

