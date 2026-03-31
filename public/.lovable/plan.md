

## LP-24 — Sample-Data Fallback Normalization (Revised)

### Summary
Centralize page-local mock arrays, normalize all dialog fallback gating via explicit `isSampleContext` props, and add truthful labeling where missing.

### Changes

**A. `src/data/mockData.ts` — Add centralized mock exports**
Move the 4 page-local arrays from InstructorStudents.tsx into centralized exports:
- `MOCK_STUDENT_ENROLLMENTS`, `MOCK_STUDENT_PROFILES`, `MOCK_STUDENT_PROGRESS`, `MOCK_STUDENT_COURSE`

**B. `src/pages/instructor/InstructorStudents.tsx`**
- Delete local `MOCK_ENROLLMENTS`, `MOCK_PROFILES`, `MOCK_PROGRESS`, `MOCK_COURSE` arrays
- Import centralized versions from `@/data/mockData`
- No logic changes — existing `isSampleCourse` gating and `SampleDataBadge` already correct

**C. `src/components/instructor/NominateStudentDialog.tsx`**
- Add `isSampleContext?: boolean` prop (default `false`)
- Replace `isSampleMode()` with `isSampleContext` for student list gating
- Remove direct `isSampleMode` import

**D. `src/components/instructor/InviteAssistantDialog.tsx` ← REQUIRED CORRECTION**
- Add `isSampleContext?: boolean` prop (default `false`)
- Replace all 4 raw `isSampleMode()` calls (lines 140, 156, 167, 201) with `isSampleContext`
- Remove direct `isSampleMode` import
- This dialog is opened from two parents:
  - `InstructorCourseDetail.tsx` — has `isSampleCourse` already, will pass it
  - `InstructorAssistants.tsx` — real-data page, will pass `false` (default)

**E. `src/pages/instructor/InstructorCourseDetail.tsx` — Update dialog props**
- Pass `isSampleContext={isSampleCourse}` to both `NominateStudentDialog` and `InviteAssistantDialog`

**F. `src/pages/instructor/InstructorJobs.tsx`**
- Track whether displayed jobs came from mock fallback
- Show `SampleDataBadge` in page header when sample jobs are active

**G. No changes to:**
- `InstructorCourses.tsx` — already correct
- `InstructorAssistants.tsx` — real-data page, default `isSampleContext=false` is correct

### Gating logic summary

| Surface | Gate | Badge |
|---------|------|-------|
| InstructorCourses | `withSampleFallback()` | Yes (existing) |
| InstructorCourseDetail | `isSampleCourse` (mock-prefix) | Yes (existing) |
| InstructorStudents | `isSampleCourse` (mock-prefix) | Yes (existing) |
| InstructorJobs | `isSampleMode()` + empty real data | Yes (adding) |
| NominateStudentDialog | `isSampleContext` prop from parent | Parent badge covers |
| InviteAssistantDialog | `isSampleContext` prop from parent | Parent badge covers |

### Files changed (7)
1. `src/data/mockData.ts`
2. `src/pages/instructor/InstructorStudents.tsx`
3. `src/components/instructor/NominateStudentDialog.tsx`
4. `src/components/instructor/InviteAssistantDialog.tsx`
5. `src/pages/instructor/InstructorCourseDetail.tsx`
6. `src/pages/instructor/InstructorJobs.tsx`

### Build
Run standard production build (`npm run build`) and stop.

