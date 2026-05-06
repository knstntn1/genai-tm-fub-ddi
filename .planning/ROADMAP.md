# Roadmap: GenAI Teachable Machine OpenVerse Image Search

## Overview

This roadmap adds OpenVerse image search to the existing brownfield React/Vite teachable-machine image workflow without turning it into a separate media browser. The work first proves the direct browser OpenVerse client and remote-image canvas import boundary, then builds the student-facing class-scoped search UI, integrates successful imports into existing class sample state, and finishes with live browser validation for CORS, save/load, training, and classroom reliability risks.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: OpenVerse Client & Import Boundary** - The app can search OpenVerse and convert selected remote images into safe, bounded canvas samples.
- [ ] **Phase 2: Student Search UI** - Students can search and browse image-only OpenVerse results in a simple class-scoped interface.
- [ ] **Phase 3: Training Workflow Integration** - OpenVerse imports enter the current image class as normal trainable samples without corrupting class state.
- [ ] **Phase 4: Live Browser Validation** - Real OpenVerse searches, remote image imports, save/load, and training are validated in browser conditions.

## Phase Details

### Phase 1: OpenVerse Client & Import Boundary
**Goal**: The app has a reliable browser-side OpenVerse search client and a remote-image import boundary that returns readable, bounded canvas samples only on success.
**Depends on**: Nothing (first phase)
**Requirements**: OVAPI-01, OVAPI-02, OVAPI-03, OVAPI-04, OVAPI-05, IMPORT-01, IMPORT-02, IMPORT-03, IMPORT-04, IMPORT-05, TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. The system can submit a student query to OpenVerse image search with image-only results and `mature=false` without browser-exposed credentials.
  2. The system normalizes successful OpenVerse responses into a local typed result model while preserving fields needed for future provenance use.
  3. The system reports recoverable typed errors for empty results, invalid responses, network failures, and rate limiting.
  4. The system converts a selected remote image into the same readable canvas/sample representation used by existing image training samples, with size bounds applied.
  5. Failed loads, CORS/canvas-taint failures, decode failures, timeouts, and duplicate pending imports do not create partial samples or mutate class sample state.
**Plans**:
- `01-01-PLAN.md` - OpenVerse API Client
- `01-02-PLAN.md` - Remote Image Import Boundary

### Phase 2: Student Search UI
**Goal**: Students can open a simple class-scoped OpenVerse search experience, submit a query, browse image-only results, and understand loading, empty, error, import, and pagination states.
**Depends on**: Phase 1
**Requirements**: UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, TEST-03
**Success Criteria** (what must be TRUE):
  1. Student can tell which class the OpenVerse search flow is currently scoped to.
  2. Student can enter one search term, submit it explicitly, and see concise German loading, empty-result, retryable-error, and rate-limit states.
  3. Student sees results as an image-only grid with no visible license, attribution, creator, source, advanced filter, or metadata chrome in v1.
  4. Student can access the German action `Dieses Bild nutzen` by hover and by equivalent keyboard/touch interactions.
  5. Student can load more results through a simple next-page or `Mehr Ergebnisse` action when more pages are available.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Training Workflow Integration
**Goal**: Students can add an OpenVerse result from an image class card and the imported image behaves like any existing trainable class sample.
**Depends on**: Phase 2
**Requirements**: UI-01, TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TEST-04
**Success Criteria** (what must be TRUE):
  1. Student sees an OpenVerse image-search entry point alongside existing camera and file sample options in image class training areas only.
  2. Student can click a usable OpenVerse result and see it appear immediately in the intended class sample list/count after successful import.
  3. Existing sample deletion, movement, project save/load, and model training continue to work with OpenVerse-imported samples.
  4. Slow or stale searches/imports cannot add an image to the wrong class after class state changes.
  5. Other classes remain unchanged when a result is imported into the selected class.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Live Browser Validation
**Goal**: The v1 feature is proven against real OpenVerse searches and browser image-import behavior, with any proxy/cache or disable-switch need documented for follow-up.
**Depends on**: Phase 3
**Requirements**: TEST-05
**Success Criteria** (what must be TRUE):
  1. A human can run representative real OpenVerse searches in the app and import at least one result into an image class.
  2. Browser validation covers CORS/canvas readability behavior, failed-provider images, and recoverable UI states without breaking the training-data screen.
  3. A project containing OpenVerse-imported samples can be saved, loaded, and trained successfully in the browser.
  4. Validation records whether direct browser import is sufficient for v1 or whether a v2 proxy/cache, disable switch, or additional safety work is needed.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. OpenVerse Client & Import Boundary | 2/2 | Ready to execute | - |
| 2. Student Search UI | 0/TBD | Not started | - |
| 3. Training Workflow Integration | 0/TBD | Not started | - |
| 4. Live Browser Validation | 0/TBD | Not started | - |
