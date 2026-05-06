# Phase 2: Student Search UI - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the student-facing, class-scoped OpenVerse search experience. This phase owns the search dialog/component, result grid, German student-facing states, pagination, and result-use interaction contract. It does not add the OpenVerse entry point to class cards or mutate training sample state; those are Phase 3 responsibilities.

</domain>

<decisions>
## Implementation Decisions

### Search UI Shape
- OpenVerse search opens in a compact dialog/modal scoped to the class, not as a separate browser or full workflow page.
- The dialog title or header names the current class so students can tell which class receives the future selected image.
- Search uses one text field and an explicit submit button; do not search continuously while typing.
- Results render as a pure image grid with no visible title, license, attribution, creator, source, or advanced metadata in v1.

### Result Interaction
- The German action `Dieses Bild nutzen` appears on hover, focus, and touch-equivalent interaction as an overlay.
- Clicking or activating a result calls a neutral `onUseImage` callback; Phase 2 does not import into class state.
- Each result is keyboard focusable and Enter/Space triggers the same use action.
- The Phase 2 component API should avoid implying import completion; actual sample insertion remains Phase 3.

### States and Pagination
- Use concise German states for loading, no results, retryable errors, rate limits, and failed search states.
- Pagination uses a simple `Mehr Ergebnisse` action when additional OpenVerse pages are available.
- Valid OpenVerse `results: []` responses render an empty-result state, not an error state.
- Retry keeps the current search term and class context.

### the agent's Discretion
No additional discretion requested beyond using existing React, Material UI, CSS module, i18n, and test patterns conservatively.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/util/openverse.ts` exposes the typed OpenVerse client, result model, pagination metadata, and stable error codes.
- `src/workflow/ClassEntry/Classification.tsx` is the later Phase 3 integration point for adding a third image-sample source beside camera/upload/dataset actions.
- `src/components/button/Button.tsx` and Material UI components are already used for workflow actions.
- `public/locales/*/translation.json` and `public/locales/*/image_adv.json` provide runtime-loaded German and English copy.

### Established Patterns
- React component files use PascalCase and co-located CSS modules/tests.
- Component tests use Vitest and Testing Library with repository setup from `src/setupTests.ts`.
- Workflow UI uses CSS modules, Material UI controls/icons, and `useTranslation(namespace)` from the active variant.
- Async browser operations should surface recoverable UI state rather than throwing from effects.

### Integration Points
- Create a focused Phase 2 search UI module under `src/workflow/OpenVerseSearch/` or an equivalent workflow-level folder.
- Consume `searchOpenVerseImages` directly in the UI boundary and expose selected `OpenVerseImageResult` through `onUseImage`.
- Keep the component reusable for Phase 3 by accepting `open`, `className`, `onClose`, and `onUseImage` props.

</code_context>

<specifics>
## Specific Ideas

The user explicitly wants a trivial classroom experience: only images are visible, and `Dieses Bild nutzen` appears when hovering. Clicking uses the image for the respective class, but in the roadmap this actual class-state insertion is Phase 3.

</specifics>

<deferred>
## Deferred Ideas

- Phase 3 adds the class-card entry point and wires `onUseImage` to remote image import plus class sample state.
- Phase 4 validates real OpenVerse searches, CORS/canvas readability, save/load, and training in browser conditions.

</deferred>
