# Phase 3: Training Workflow Integration - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the Phase 2 `OpenVerseSearchDialog` into the existing image class training workflow so a selected OpenVerse result becomes a normal trainable sample in the intended class. This phase owns the class-card entry point, successful import-to-state wiring, stale/import failure handling, and integration tests. It does not perform real-provider browser/CORS validation; Phase 4 owns that live validation.

</domain>

<decisions>
## Implementation Decisions

### Entry Point and Placement
- Show OpenVerse search as a third image-class action beside Webcam and Upload.
- Use an image/search-oriented Material UI icon with the short German label `Bildsuche`.
- Show the entry point only for image workflows; do not show it for speech/audio classes.
- Open the search dialog with the current class label so the class context is visible.

### Import Behavior
- Mutate class sample state only after `importOpenVerseImage` successfully returns a readable canvas.
- Insert imported OpenVerse samples at the front of the target class, matching webcam/upload behavior.
- On import failure, keep the dialog open, show a short German failure state, and leave class sample state unchanged.
- Capture class index and request/import identity when selection starts; discard stale imports if class state changed or the target class is no longer valid.

### Integration Tests and Compatibility
- Primary test: selecting an OpenVerse result adds a canvas sample only to the intended class.
- Regression tests should cover other classes unchanged, sample counts updated, and existing delete/move logic remaining usable with imported samples.
- Phase 3 should verify imported samples have the normal sample shape used by save/load/training; full browser save/load/training validation stays in Phase 4.
- The deferred Phase 2 browser visual/touch check should be carried into Phase 3/4 after the dialog is reachable from the integrated workflow.

### the agent's Discretion
Implementation should reuse existing React, MUI, CSS module, i18n, and Jotai/controlled-state patterns conservatively.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` exposes the reusable search UI and calls `onUseImage(result)`.
- `src/util/openverseImageImport.ts` converts a remote OpenVerse image URL to a bounded, readable `HTMLCanvasElement`.
- `src/workflow/ClassEntry/Classification.tsx` already owns webcam/upload/dataset sample insertion for one class.
- `src/workflow/TrainingData/TrainingData.tsx` owns the class list, sample modal, move/delete operations, and `setDataIx` class-state update helper.

### Established Patterns
- Image samples are inserted as `{ data: canvas, id: '' }` at the front of the class sample array.
- Existing sample canvases use `58px` width/height styles before entering state.
- Audio/speech branches are guarded through `useVariant().modelVariant === 'speech'`.
- Focused integration tests use React Testing Library, `TestWrapper`, mocked utilities, and direct component rendering.

### Integration Points
- The new `Bildsuche` action belongs in `Classification.tsx` beside webcam/upload actions for image workflows only.
- `Classification` can own the dialog open/import state for its class and call `setData` after `importOpenVerseImage` succeeds.
- Integration tests should mock the OpenVerse search client/importer boundary or drive the dialog through injected behavior if the component API is extended.

</code_context>

<specifics>
## Specific Ideas

The user wants the OpenVerse option alongside existing photo capture and file selection, with trivial student behavior. The visible result grid remains image-only; clicking `Dieses Bild nutzen` should ultimately add a normal training sample to the respective class.

</specifics>

<deferred>
## Deferred Ideas

- Phase 4 validates real OpenVerse searches, real remote image CORS/canvas readability, project save/load, and browser training with imported samples.
- Product-reviewed translations beyond German/English fallback copy remain outside this phase.

</deferred>
