# Project Research Summary

**Project:** GenAI Teachable Machine OpenVerse Image Search
**Domain:** Classroom browser-based image-classification training data import
**Researched:** 2026-05-06
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project adds a small OpenVerse image-search importer to an existing GenAI Teachable Machine image workflow. Experts would build this as another class-scoped image sample source, not as a separate media browser, dataset manager, route, or model feature. Students should remain inside the current training-data flow: choose a class, enter one search term, browse image-only results, and import one selected image as a normal trainable sample.

The recommended approach is a direct browser integration using a narrow local TypeScript client for `GET https://api.openverse.org/v1/images/`, plus a dedicated remote-image-to-readable-canvas import boundary. The UI should stay local to the image class card/training workflow, use existing React 19, Material UI, Jotai, localization, and testing patterns, and hide visible license/attribution metadata in v1 while preserving enough provenance internally if feasible.

The dominant risk is not search result rendering; it is turning third-party OpenVerse image URLs into readable canvas samples without corrupting class state. Remote images may fail, taint canvases, be oversized, hit rate limits, or contain unsuitable classroom content. Mitigate this by proving canvas readability before state mutation, using explicit `mature=false`, submit-only search, typed failure states, bounded canvas conversion, 429 handling, and focused tests around failure and stale async behavior.

## Key Findings

### Recommended Stack

Use the existing SPA stack and add only small local utilities. Research does not justify a new backend, global state subsystem, or OpenVerse SDK dependency for v1. A direct `fetch` wrapper is enough because the required API surface is one image search endpoint with a narrow response projection.

**Core technologies:**
- React 19: image-search dialog/grid components inside the existing workflow UI.
- Material UI: dialog, input, buttons, progress, and recoverable loading/error/empty states.
- Jotai: existing class sample state only; search state should remain local to the dialog.
- TypeScript local OpenVerse client: normalize API responses and isolate HTTP/rate-limit errors.
- Browser image/canvas APIs and existing `@genai-fi/base` helpers: convert selected remote images into readable `HTMLCanvasElement` samples.
- Vitest and React Testing Library: mock the OpenVerse boundary and image conversion while testing workflow state insertion.

Critical version constraints come from the current repo rather than OpenVerse: stay within the existing React/Vite/Material UI/Jotai conventions and do not ship browser-side OpenVerse secrets. Use anonymous OpenVerse requests unless a future backend/proxy exists.

### Expected Features

v1 should be deliberately small and classroom-focused. The required behavior is a class-scoped search-and-import flow, not a full-featured OpenVerse client.

**Must have (table stakes):**
- OpenVerse entry point inside each image class add-sample area.
- Single search input with explicit submit.
- Image-only OpenVerse result grid using thumbnails.
- Loading, empty, retry, rate-limit, and failed-image states in concise German UI.
- Hover/focus/tap action labeled `Dieses Bild nutzen`.
- One-click import into the selected class as a normal trainable canvas sample.
- Basic next-page or `Mehr Ergebnisse` pagination.
- Robust tests for API mapping, result rendering, import success, import failure, and class-state insertion.

**Should have (after validation):**
- Seed the search term from the class name if classroom testing shows it helps.
- Prevent duplicate imports within a class.
- Per-tile import progress for slow image conversion.
- Session-only recent search terms.
- Invisible provenance storage if it can be added without disrupting the sample pipeline.

**Defer (v2+):**
- Backend proxy/cache unless live browser testing proves direct import is unreliable.
- Visible attribution/license UI.
- Advanced filters for license, creator, source, file type, size, aspect ratio, or safety settings.
- Bulk import, full-screen media browser, cropping/editing, or persisted search history.
- Any claim of complete content moderation.

### Architecture Approach

OpenVerse should enter through the existing `Classification` class card as a third image source beside camera/file flows. UI state belongs in a new search dialog/component subtree; API and conversion behavior belong in utilities; only a successfully converted, readable canvas crosses into existing class sample state.

**Major components:**
1. `src/workflow/ClassEntry/Classification.tsx` - owns the per-class entry point and commits imported canvases into the selected class.
2. `src/components/OpenVerseImageSearch/OpenVerseImageSearchDialog.tsx` - owns query, result, loading, error, empty, pagination, and importing states.
3. `src/components/OpenVerseImageSearch/OpenVerseResultGrid.tsx` - renders image-only tiles and accessible import actions without v1 metadata chrome.
4. `src/util/openverse.ts` - calls `/v1/images/`, sends safe defaults, normalizes results, handles HTTP/429/malformed responses.
5. `src/util/openverseImageImport.ts` - loads the chosen image with CORS-aware behavior, bounds dimensions, proves canvas readability, and returns typed import failures.

Key patterns are normalized client boundaries, local transient UI state, convert-before-mutate sample insertion, abort/stale-response handling, and testable typed error categories.

### Critical Pitfalls

1. **Adding results before readable-canvas import succeeds** - import with CORS-aware loading, draw to a bounded canvas, prove `toBlob()`/`getImageData()`/`toDataURL()` works, then mutate class state.
2. **Async remote loads corrupting class state** - keep pending import state outside `classState`, use request IDs/abort handling, disable duplicate clicks, and revalidate the target class before commit.
3. **Assuming OpenVerse is classroom-safe enough** - always send `mature=false`, filter/drop mature fixtures, consider a small risky-query denylist, and avoid promising complete moderation.
4. **Hitting anonymous rate limits in classrooms** - use explicit-submit search, small page sizes, no live search or prefetch, in-memory query-page cache, and friendly 429 messaging.
5. **Losing provenance because v1 hides attribution** - separate visible UI policy from data retention; preserve OpenVerse IDs/source/license/landing fields invisibly or document schema follow-up explicitly.
6. **Importing oversized or unsupported remote files** - accept only supported HTTPS raster image paths where possible, use timeouts, reject decode/type failures, and downscale to model-appropriate canvas dimensions.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: OpenVerse Client and Import Boundary
**Rationale:** This resolves the highest uncertainty before UI work: whether browser-side OpenVerse search and selected-image canvas import are reliable enough without a proxy.
**Delivers:** `openverse.ts`, normalized result types, typed search errors including 429, explicit `mature=false`, `openverseImageImport.ts`, readable-canvas validation, bounded image conversion, timeout/failure handling, and unit tests.
**Addresses:** Image-only client, safe defaults, robust failed-image handling, training sample compatibility.
**Avoids:** Tainted canvases, premature class mutation, oversized imports, rate-limit blind spots.

### Phase 2: Search Dialog and Result Grid
**Rationale:** Build the student-facing experience on top of tested boundaries while keeping workflow state untouched.
**Delivers:** Class-scoped dialog, single query field, explicit submit, thumbnail grid, `Dieses Bild nutzen` action, loading/empty/error states, simple pagination, per-result importing state, German/English localization, and component tests.
**Uses:** React 19, Material UI, local UI state, normalized OpenVerse results.
**Implements:** `OpenVerseImageSearchDialog` and `OpenVerseResultGrid`.
**Avoids:** Advanced filters, metadata-heavy cards, live search, infinite scroll, global Jotai search state.

### Phase 3: Workflow Integration and Sample Integrity
**Rationale:** Touch the core training-data path only after client/import/UI behavior is test-covered.
**Delivers:** OpenVerse source button in image class cards, selected-result import into the current class, class-target revalidation, duplicate-click protection, success/failure feedback, and integration tests proving other classes remain unchanged.
**Addresses:** One-click import, import confirmation in context, normal trainable sample behavior.
**Avoids:** Wrong-class insertion, stale async commits, broken save/share/training assumptions.

### Phase 4: Browser and Classroom Validation
**Rationale:** Direct provider image imports, CORS, rate limits, and content quality cannot be fully proven with mocks.
**Delivers:** Live browser validation against representative OpenVerse searches, save/load/training smoke tests with imported samples, rate-limit behavior check, sample-size check, and a go/no-go decision on proxy/cache or feature disable/config.
**Addresses:** Classroom reliability, content-safety residual risk, browser CORS uncertainty.
**Avoids:** Shipping a feature that looks complete in jsdom but fails on school networks or real provider URLs.

### Phase 5: Post-v1 Hardening if Needed
**Rationale:** Only add complexity in response to validation or classroom pilot evidence.
**Delivers:** Optional duplicate prevention, class-name search seeding, session recent searches, teacher/variant disable switch, invisible provenance persistence, or backend proxy/cache.
**Addresses:** v1.x differentiators and conditional risk mitigations.
**Avoids:** Premature backend work, advanced search product scope, and unnecessary schema churn.

### Phase Ordering Rationale

- Prove OpenVerse API access and readable-canvas import first because every downstream feature depends on turning a selected result into the existing sample contract.
- Keep visual search components separate from class mutation so UI polish can be tested without risking training-data state.
- Integrate with `Classification` after utilities and components exist because this is the highest-blast-radius brownfield step.
- Schedule live browser/classroom validation before deciding on proxy/cache, safety controls, or provenance schema expansion.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Live CORS/canvas taint behavior across common OpenVerse providers and fallback policy for thumbnail vs full image.
- **Phase 4:** Classroom-scale anonymous rate limits, content-safety acceptability, and deployed-origin browser behavior.
- **Phase 5:** Backend proxy/cache architecture and provenance schema only if validation requires them.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Search dialog, result grid, loading/error/empty states, pagination, and localization are standard React/MUI patterns.
- **Phase 3:** Workflow integration follows existing class sample insertion and component testing patterns once the import boundary is stable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | OpenVerse endpoint and fields are documented, and repo patterns are clear; real provider image CORS remains uncertain. |
| Features | MEDIUM-HIGH | Project scope and classroom UX are well defined; safety and provenance policy need product validation beyond v1. |
| Architecture | HIGH | In-repo component boundaries and sample pipeline are clear; the direct-import reliability decision depends on live testing. |
| Pitfalls | HIGH | Browser canvas tainting, async state, rate limits, and oversized remote files are well-known risks with concrete mitigations. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Browser CORS/canvas success rate: spike real OpenVerse result imports before assuming direct SPA import is sufficient.
- Fallback image policy: decide whether to try thumbnails after full image failures or simply ask students to pick another result.
- Provenance persistence: decide whether v1 stores invisible attribution/source metadata or records an explicit schema follow-up.
- Content safety: define best-effort query/result filtering and whether teachers need a feature-disable switch.
- Rate limits: validate anonymous behavior from the deployed app and school-like shared-network usage before scaling beyond explicit-submit search.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - project scope, constraints, active requirements, out-of-scope decisions.
- `.planning/research/STACK.md` - recommended direct OpenVerse client, endpoint, response fields, stack guidance.
- `.planning/research/FEATURES.md` - v1 table stakes, differentiators, anti-features, classroom UX guidance.
- `.planning/research/ARCHITECTURE.md` - component boundaries, data flow, test strategy, anti-patterns.
- `.planning/research/PITFALLS.md` - critical risks, phase mapping, recovery strategies.
- OpenVerse API documentation - image search endpoint, query parameters, response fields, anonymous client behavior.
- MDN canvas CORS documentation - tainted canvas behavior and readback failure modes.

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/INTEGRATIONS.md` - existing repo conventions and risk map referenced by the research agents.
- Observed OpenVerse anonymous rate-limit headers on 2026-05-06 - useful planning signal, but should be revalidated during implementation.

### Tertiary (LOW confidence)
- Classroom content-safety assumptions - best-effort filtering is possible, but no client-only OpenVerse integration can guarantee safe results.

---
*Research completed: 2026-05-06*
*Ready for roadmap: yes*
