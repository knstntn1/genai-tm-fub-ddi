# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-06)

**Core value:** Students can add useful image examples to a class through a trivial OpenVerse search flow without leaving the training-data workflow.
**Current focus:** Milestone complete

## Current Position

Phase: 4 of 4 (Live Browser Validation)
Plan: 04-01
Status: Complete
Last activity: 2026-05-07 - Phase 4 live browser validation passed. A live training blocker was found and fixed by normalizing OpenVerse imports to 224x224 training canvases; real search/import, failed-provider recovery, desktop/tablet/mobile behavior, save/load, and training all validated.

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: same-day execution
- Total execution time: 0.0 hours tracked

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 2 | same-day | same-day |
| Phase 2 | 2 | same-day | same-day |
| Phase 3 | 1 | same-day | same-day |
| Phase 4 | 1 | same-day | same-day |

**Recent Trend:**
- Last 5 plans: 01-02 Remote Image Import Boundary, 02-01 OpenVerse Search Dialog, 02-02 OpenVerse Locale Keys, 03-01 Training Workflow Integration, 04-01 Live Browser Validation
- Trend: Milestone complete

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Project]: Add OpenVerse image search as a third image-sample source in the existing image training workflow.
- [Project]: Keep v1 as "Einfacher Import" with no visible attribution/license UI or advanced filters.
- [Project]: Integrate only successfully converted OpenVerse images into the existing class sample state.
- [Project]: Prefer direct browser integration in the static SPA unless validation proves a proxy/cache is required.
- [Phase 1]: Valid OpenVerse `results: []` responses are successful empty search responses, not typed errors, so Phase 2 can render a normal empty-result UI state.
- [Phase 2]: OpenVerse search UI is a reusable dialog boundary that calls `onUseImage(result)` only; Phase 3 owns the class-card entry point and actual sample import.
- [Phase 3]: OpenVerse imports are guarded by class object identity, not label alone, so same-label class shifts cannot receive stale imports.
- [Phase 3]: `scripts/addOpenVerseLocaleKeys.cjs --check` now exits non-zero on locale drift.
- [Phase 4]: OpenVerse imports must normalize remote images to the model's `224x224` square training-canvas shape before adding samples.
- [Phase 4]: Direct browser OpenVerse import is sufficient for v1 after the training-canvas normalization fix; proxy/cache remains v2 unless classroom pilots reveal school-network, hotlink, rate-limit, or policy issues.

### Pending Todos

- None for v1 OpenVerse image search.

### Blockers/Concerns

- Anonymous OpenVerse rate limits and classroom-network behavior should still be monitored during classroom pilots.
- Client-side `mature=false` is best-effort and does not guarantee complete classroom-safe results.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |
| Browser validation | Real browser visual/touch check for OpenVerseSearchDialog, including 2/3/4 grid, hover/focus/touch overlay, and no metadata/filter UI | Completed in Phase 4 browser validation | Phase 4 verification |
| Browser validation | Real browser desktop/tablet/mobile check for `Bildsuche` label fit, focus return, touch reachability, and integrated dialog overlay access | Completed in Phase 4 browser validation | Phase 4 verification |
| Live provider validation | Real OpenVerse provider/CORS/canvas readability, browser save/load, and training with imported samples | Completed in Phase 4 browser validation | Phase 4 verification |

## Session Continuity

Last session: 2026-05-07
Stopped at: Milestone complete; next step is optional ship/review.
Resume file: None
