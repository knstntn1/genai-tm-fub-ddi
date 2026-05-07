---
phase: 3
slug: training-workflow-integration
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for integrating OpenVerse image search into class training data.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom and React Testing Library |
| **Config file** | `vite.config.ts`, `src/setupTests.ts` |
| **Quick run command** | `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx --run` |
| **Dialog regression command** | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` |
| **Full suite command** | `npm run ci:test` |
| **Estimated runtime** | < 45 seconds for focused component tests |

---

## Sampling Rate

- **After every task commit:** Run focused Phase 3 component tests.
- **After integration wiring:** Run Phase 2 dialog regression tests.
- **After every plan wave:** Run `npm run lint && npm run build`.
- **Before verification:** Run focused Phase 3 tests, Phase 2 dialog tests, lint, and production build.
- **Max feedback latency:** 120 seconds for focused component tests.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 3-01-01 | 01 | 1 | UI-01, TRAIN-05 | Image workflows show `Bildsuche` beside Webcam/Upload; speech/audio workflows do not expose or reserve OpenVerse controls | component | `npm test -- src/workflow/ClassEntry/Classification.test.tsx --run` | pending |
| 3-01-02 | 01 | 1 | TRAIN-01, TRAIN-02, TEST-04 | Selecting a dialog result imports a readable canvas and prepends a normal sample only to the intended class | integration | `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx --run` | pending |
| 3-01-03 | 01 | 1 | TRAIN-04 | Failed, stale, deleted, or renamed target-class imports leave every class sample array unchanged and keep the dialog recoverable | integration | `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx --run` | pending |
| 3-01-04 | 01 | 1 | TRAIN-03 | Imported canvas samples remain compatible with existing preview, delete, move, save/load preparation, and training sample shape | component/static | `npm test -- src/workflow/TrainingData/TrainingData.test.tsx src/workflow/ClassEntry/SamplePreviewModal.test.tsx --run` | pending |
| 3-01-05 | 01 | 1 | UI-01, TEST-04 | No OpenVerse license, attribution, creator, source, provenance, advanced filter, or mature-control UI leaks into the class workflow | static grep | `bash -lc '! rg -n "license|attribution|creator|source|provenance|mature|filter" src/workflow/ClassEntry src/workflow/TrainingData src/workflow/OpenVerseSearch'` | pending |

*Status: pending · green · red · flaky*

---

## Manual / Browser Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Integrated desktop/tablet/mobile visual fit for three class-card actions | UI-01 | German `Bildsuche` label and compact action row need real layout inspection | Open the image training workflow, verify Webcam/Upload/Bildsuche fit without overlap at desktop, tablet, and mobile widths. |
| Hover/focus/touch access to `Dieses Bild nutzen` from integrated entry point | UI-05 carried from Phase 2 | jsdom cannot validate real hover/touch overlay feel | Open `Bildsuche`, search with mocked or live results, verify hover, keyboard focus, and touch can activate a result. |
| Live OpenVerse image CORS/readability path | Phase 4 boundary | Depends on live provider and remote image hosts | Defer full live API/CORS/browser training validation to Phase 4. |

---

## Validation Sign-Off

- [x] All tasks have automated verification.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers required test infrastructure.
- [x] No watch-mode flags in full-suite command.
- [x] Feedback latency < 120s for focused tests.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-05-07
