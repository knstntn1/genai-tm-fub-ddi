---
phase: 03-training-workflow-integration
plan: 01
subsystem: training-data
tags: [react, mui, vitest, openverse, i18n, training-data]
requires:
  - phase: 01-openverse-client-import-boundary
    provides: Typed OpenVerse search client and readable canvas import boundary
  - phase: 02-student-search-ui
    provides: Reusable class-scoped OpenVerse search dialog
provides:
  - Image-class `Bildsuche` entry point beside Webcam and Upload
  - OpenVerse result import into normal class sample state
  - Stale, failed, superseded, and invalid-index import guards
  - Locale propagation for `trainingdata.actions.openverse`
affects: [training-data, image-class-samples, openverse-search-ui]
tech-stack:
  added: []
  patterns:
    - Class-card action row extension with existing `VerticalButton`
    - Async importer callback with AbortController and request identity guard
    - Normal sample shape preservation `{ data: canvas, id: '' }`
key-files:
  modified:
    - src/workflow/ClassEntry/Classification.tsx
    - src/workflow/ClassEntry/Classification.test.tsx
    - src/workflow/TrainingData/TrainingData.tsx
    - src/workflow/TrainingData/TrainingData.test.tsx
    - scripts/addOpenVerseLocaleKeys.cjs
    - public/locales/*/image_adv.json
key-decisions:
  - "Close the dialog after successful sample insertion so the student immediately sees the class card update."
  - "Treat class label changes before import completion as stale and reject through the dialog failure path."
  - "Keep OpenVerse provenance/license/source metadata out of class sample state and visible UI."
requirements-completed: [UI-01, TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TEST-04]
completed: 2026-05-07
---

# Phase 3 Plan 01: Training Workflow Integration Summary

**Integrated OpenVerse image search into image training class cards and wired selected results into normal trainable samples.**

## Accomplishments

- Added a localized `Bildsuche` `VerticalButton` with `ImageSearchIcon` beside Webcam and Upload for image class cards only.
- Reused `OpenVerseSearchDialog` with the current class name and connected `onUseImage(result)` to `importOpenVerseImage`.
- Prepended imported readable canvases as normal samples using `{ data: canvas, id: '' }`, preserving existing class fields such as `disabled`.
- Added stale/failure hardening: importer rejection leaves samples unchanged, class-label changes reject late imports, superseded imports are aborted/discarded, and invalid class indexes are ignored in `TrainingData`.
- Extended locale propagation so all `image_adv.json` bundles include `trainingdata.actions.openverse`; German uses `Bildsuche`, fallback locales use `Image search`.

## Task Commits

1. **Task 1: Add image-class entry point and locale action key** - `66f419a`
2. **Task 2: Wire successful imports into intended class samples** - `8761d45`
3. **Task 3: Harden stale/failure/superseded class-state updates** - `4090126`

## Verification

- `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx --run` - passed, 13 tests.
- `npm test -- src/workflow/TrainingData/TrainingData.test.tsx src/workflow/ClassEntry/SamplePreviewModal.test.tsx --run` - passed, 27 tests.
- `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` - passed, 10 tests.
- `node scripts/addOpenVerseLocaleKeys.cjs --check` - passed, 15 locale files validated.
- Metadata/filter visible-UI grep - passed.
- `npm run lint` - passed.
- `npm run build` - passed; existing Vite large chunk warnings only. `src/generatedGitInfo.json` was restored after the build.

## Notes

- jsdom still logs existing `HTMLCanvasElement.prototype.getContext` not-implemented messages in canvas-rendering tests; those tests pass and the issue was already documented as a test-environment limitation.
- Full live OpenVerse provider/CORS/browser training validation remains in Phase 4.

---
*Phase: 03-training-workflow-integration*
*Completed: 2026-05-07*
