---
phase: 2
slug: student-search-ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom and React Testing Library |
| **Config file** | `vite.config.ts`, `src/setupTests.ts` |
| **Quick run command** | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` |
| **Full suite command** | `npm run ci:test` |
| **Estimated runtime** | < 30 seconds for focused component tests |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before verification:** Run focused Phase 2 tests, lint, and production build.
- **Max feedback latency:** 120 seconds for focused component tests.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 2-01-01 | 01 | 1 | UI-02, UI-03, UI-06 | Class-scoped explicit search renders initial/loading/empty/error/rate-limit states without stale updates | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | pending |
| 2-01-02 | 01 | 1 | UI-04, UI-05, UI-07, UI-08 | Image-only result grid exposes `Dieses Bild nutzen` through hover/focus/keyboard and appends `Mehr Ergebnisse` pages without metadata/filter UI | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | pending |
| 2-02-01 | 02 | 1 | UI-06, TEST-03 | Locale JSON provides German and fallback copy for all OpenVerse UI states | static/component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | pending |
| 2-02-02 | 02 | 1 | TEST-03 | Phase 2 does not import class-state mutation or remote canvas import boundaries | static grep/test | `rg "classState|setData|importOpenVerseImage|samples:" src/workflow/OpenVerseSearch` should print no matches | pending |

*Status: pending · green · red · flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Actual hover/focus/touch feel inside full training-data workflow | UI-05 | Phase 2 builds reusable dialog without Phase 3 entry point; full workflow interaction requires Phase 3 integration | Deferred to Phase 3/4 browser validation. |

---

## Validation Sign-Off

- [x] All tasks have automated verification.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers required test infrastructure.
- [x] No watch-mode flags in full-suite command.
- [x] Feedback latency < 120s for focused tests.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-05-06
