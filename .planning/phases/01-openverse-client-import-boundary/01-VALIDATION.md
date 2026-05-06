---
phase: 1
slug: openverse-client-import-boundary
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1.1 with jsdom |
| **Config file** | `vite.config.ts`, `src/setupTests.ts` |
| **Quick run command** | `npm test -- src/util/openverse.test.ts src/util/openverseImageImport.test.ts` |
| **Full suite command** | `npm run ci:test` |
| **Estimated runtime** | ~60 seconds for focused tests; full suite runtime depends on CI environment |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/util/openverse.test.ts src/util/openverseImageImport.test.ts`
- **After every plan wave:** Run `npm run lint && npm run build && npm run ci:test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds for focused utility tests

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | OVAPI-01, OVAPI-02, OVAPI-05 | T-1-01 | OpenVerse search sends only public unauthenticated browser requests with `mature=false` | unit | `npm test -- src/util/openverse.test.ts` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | OVAPI-03, OVAPI-04, TEST-01 | T-1-02 | OpenVerse responses and failures are normalized into stable app-owned types | unit | `npm test -- src/util/openverse.test.ts` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | IMPORT-01, IMPORT-04 | T-1-03 | Remote image imports are bounded before becoming training samples | unit | `npm test -- src/util/openverseImageImport.test.ts` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 1 | IMPORT-02, IMPORT-03, IMPORT-05, TEST-02 | T-1-04 | Tainted, failed, timed-out, aborted, or duplicate-pending image imports return typed failures and no sample mutation path | unit | `npm test -- src/util/openverseImageImport.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- [x] `vitest` and `jsdom` are configured in `vite.config.ts`.
- [x] `src/setupTests.ts` provides browser/API mocks used by component and utility tests.
- [x] Utility tests can be co-located under `src/util/*.test.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real provider image CORS/canvas behavior | IMPORT-02, IMPORT-03 | jsdom cannot prove real third-party image tainting behavior | Deferred to Phase 4 live browser validation. In Phase 1, unit tests must simulate unreadable canvas failures. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags in full-suite command
- [x] Feedback latency < 120s for focused utility tests
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-06
