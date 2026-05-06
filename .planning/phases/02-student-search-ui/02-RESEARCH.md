# Phase 2: Student Search UI - Research

**Researched:** 2026-05-06 [VERIFIED: system date]
**Domain:** React/MUI student-facing OpenVerse search dialog in existing workflow UI [VERIFIED: .planning/ROADMAP.md]
**Confidence:** HIGH [VERIFIED: local codebase + Context7 + npm registry]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Search UI Shape
- OpenVerse search opens in a compact dialog/modal scoped to the class, not as a separate browser or full workflow page.
- The dialog title or header names the current class so students can tell which class receives the future selected image.
- Search uses one text field and an explicit submit button; do not search continuously while typing.
- Results render as a pure image grid with no visible title, license, attribution, creator, source, or advanced metadata in v1.

#### Result Interaction
- The German action `Dieses Bild nutzen` appears on hover, focus, and touch-equivalent interaction as an overlay.
- Clicking or activating a result calls a neutral `onUseImage` callback; Phase 2 does not import into class state.
- Each result is keyboard focusable and Enter/Space triggers the same use action.
- The Phase 2 component API should avoid implying import completion; actual sample insertion remains Phase 3.

#### States and Pagination
- Use concise German states for loading, no results, retryable errors, rate limits, and failed search states.
- Pagination uses a simple `Mehr Ergebnisse` action when additional OpenVerse pages are available.
- Valid OpenVerse `results: []` responses render an empty-result state, not an error state.
- Retry keeps the current search term and class context.

### the agent's Discretion
No additional discretion requested beyond using existing React, Material UI, CSS module, i18n, and test patterns conservatively.

### Deferred Ideas (OUT OF SCOPE)
- Phase 3 adds the class-card entry point and wires `onUseImage` to remote image import plus class sample state.
- Phase 4 validates real OpenVerse searches, CORS/canvas readability, save/load, and training in browser conditions.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-02 | The search flow is scoped to the current class so the student can tell which class will receive the selected image. [VERIFIED: .planning/REQUIREMENTS.md] | Require `className` prop and title `OpenVerse: {{className}}`. [VERIFIED: 02-UI-SPEC.md] |
| UI-03 | Students can enter a single search term and submit it explicitly. [VERIFIED: .planning/REQUIREMENTS.md] | Use one controlled `TextField`, explicit submit button, and Enter submit; no typing effect search. [VERIFIED: 02-CONTEXT.md] |
| UI-04 | Search results render as an image-only grid without visible license, attribution, creator, source, or advanced filter metadata in v1. [VERIFIED: .planning/REQUIREMENTS.md] | Render only thumbnails plus hidden accessible names; preserve metadata only in `OpenVerseImageResult`. [VERIFIED: src/util/openverse.ts] |
| UI-05 | Each result exposes `Dieses Bild nutzen` on hover and equivalent focus/tap interaction. [VERIFIED: .planning/REQUIREMENTS.md] | Use focusable button tiles, overlay revealed by `:hover`, `:focus-visible`, and `:focus-within`; keyboard Enter/Space is native if tile is a button. [CITED: https://mui.com/material-ui/react-button/] |
| UI-06 | The UI shows concise German loading, empty-result, retryable-error, rate-limit, and failed-import states. [VERIFIED: .planning/REQUIREMENTS.md] | Map `OpenVerseSearchError.code` to localized state; failed-use is local to `onUseImage` rejection and must not claim import success. [VERIFIED: src/util/openverse.ts] |
| UI-07 | Students can load additional results with `Mehr Ergebnisse` when OpenVerse returns more pages. [VERIFIED: .planning/REQUIREMENTS.md] | Show pagination when `page < pageCount`; append next page to existing results. [VERIFIED: src/util/openverse.ts] |
| UI-08 | The UI does not expose advanced OpenVerse filters. [VERIFIED: .planning/REQUIREMENTS.md] | Do not add props or controls for license/source/creator/file type/aspect ratio/mature filters. [VERIFIED: 02-CONTEXT.md] |
| TEST-03 | Component tests cover loading, empty, error, result, hover/focus action, and pagination states. [VERIFIED: .planning/REQUIREMENTS.md] | Add co-located Testing Library tests for the new workflow component. [VERIFIED: .planning/codebase/TESTING.md] |
</phase_requirements>

## Summary

Build Phase 2 as `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` with a co-located CSS module and test file. [VERIFIED: .planning/codebase/STRUCTURE.md] The component should consume the Phase 1 `searchOpenVerseImages` client through an injectable `searchClient` prop for tests, expose `onUseImage(result)` for selection intent only, and keep all search/pagination/selection UI state local to the dialog. [VERIFIED: src/util/openverse.ts]

The component must not import `classState`, `setData`, `importOpenVerseImage`, or any sample-mutation helper in Phase 2. [VERIFIED: .planning/phases/02-student-search-ui/02-CONTEXT.md] Phase 3 owns the class-card entry point and the actual remote-image import/class-state mutation path. [VERIFIED: .planning/ROADMAP.md]

**Primary recommendation:** Use a local workflow dialog with typed local state, abort/ignore stale searches, image-only button tiles, `Mehr Ergebnisse` append pagination, and localized German state copy. [VERIFIED: 02-UI-SPEC.md]

## Project Constraints (from AGENTS.md)

- Preserve v1 product decisions: no visible license/attribution UI and no advanced OpenVerse filters. [VERIFIED: AGENTS.md]
- Prefer existing React, Material UI, Jotai, Vite, Vitest, and workflow-component patterns. [VERIFIED: AGENTS.md]
- Keep OpenVerse API handling isolated behind the existing typed local client. [VERIFIED: AGENTS.md]
- Make failed API/image/CORS/rate-limit cases recoverable and leave class state unchanged. [VERIFIED: AGENTS.md]
- Add focused tests for the UI and class-state integration behavior; Phase 2 covers UI tests only. [VERIFIED: AGENTS.md + .planning/ROADMAP.md]
- Keep German classroom-facing strings concise and localized through the existing i18n setup. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Class-scoped search dialog | Browser / Client | — | The app is a React/Vite SPA and workflow widgets live under `src/workflow`. [VERIFIED: .planning/codebase/ARCHITECTURE.md] |
| OpenVerse search request | Browser / Client | External OpenVerse API | Phase 1 client calls OpenVerse directly with browser `fetch`. [VERIFIED: src/util/openverse.ts] |
| Result selection | Browser / Client | Phase 3 class-state integration | Phase 2 emits `onUseImage(result)` only; Phase 3 mutates training data. [VERIFIED: 02-CONTEXT.md] |
| i18n copy | Browser / Client | Static locale JSON | i18next loads runtime locale JSON from `public/locales`. [VERIFIED: src/i18n.ts + .planning/codebase/ARCHITECTURE.md] |
| Tests | Local test runner | jsdom | Vitest uses jsdom and setup file `src/setupTests.ts`. [VERIFIED: vite.config.ts] |

## Standard Stack

### Core

| Library | Project Version | Current Registry Version | Purpose | Why Standard |
|---------|-----------------|--------------------------|---------|--------------|
| React | `^19.1.1` [VERIFIED: package.json] | `19.2.6`, modified 2026-05-06 [VERIFIED: npm registry] | Component state, events, effects | Existing app stack and official docs cover cleanup for stale async effects. [CITED: https://react.dev/reference/react/useEffect] |
| `@mui/material` | `^7.3.1` [VERIFIED: package.json] | `9.0.0`, modified 2026-04-08 [VERIFIED: npm registry] | Dialog, TextField, Alert, progress, IconButton | Existing app uses MUI dialogs and controls; MUI Dialog provides title/content/actions composition and scroll behavior. [VERIFIED: src/components/DatasetPicker/DatasetPicker.tsx] [CITED: https://mui.com/material-ui/react-dialog/] |
| `@mui/icons-material` | `^7.3.1` [VERIFIED: package.json] | `9.0.0`, modified 2026-04-08 [VERIFIED: npm registry] | Close/search icons if needed | Existing DatasetPicker uses MUI `CloseIcon` with `IconButton`. [VERIFIED: src/components/DatasetPicker/DatasetPicker.tsx] |
| `react-i18next` | `^15.5.1` [VERIFIED: package.json] | `17.0.6`, modified 2026-04-27 [VERIFIED: npm registry] | Locale lookup through `useTranslation(namespace)` | Existing workflow components use `useVariant().namespace` with `useTranslation(namespace)`. [VERIFIED: src/workflow/ClassEntry/Classification.tsx] [CITED: Context7 /i18next/react-i18next] |
| `src/util/openverse.ts` | local Phase 1 module [VERIFIED: src/util/openverse.ts] | local [VERIFIED: src/util/openverse.ts] | Search client, result model, typed errors | Existing typed boundary keeps OpenVerse response shape out of UI. [VERIFIED: src/util/openverse.ts] |

### Supporting

| Library | Project Version | Current Registry Version | Purpose | When to Use |
|---------|-----------------|--------------------------|---------|-------------|
| Vitest | `^3.1.1` [VERIFIED: package.json] | `4.1.5`, modified 2026-05-05 [VERIFIED: npm registry] | Component/unit tests | Use for co-located `OpenVerseSearchDialog.test.tsx`. [VERIFIED: .planning/codebase/TESTING.md] |
| `@testing-library/react` | `^16.3.0` [VERIFIED: package.json] | `16.3.2`, modified 2026-01-19 [VERIFIED: npm registry] | DOM rendering/assertions | Use user-facing queries for dialog text, buttons, and result tiles. [VERIFIED: .planning/codebase/TESTING.md] |
| `@testing-library/user-event` | `^14.6.1` [VERIFIED: package.json] | `14.6.1`, modified 2025-12-13 [VERIFIED: npm registry] | Realistic typing, click, hover, keyboard, tab | Use for explicit search submit, hover/focus, Enter/Space, retry, and pagination tests. [CITED: https://testing-library.com/docs/user-event/intro/] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Workflow-local component | Shared `src/components/OpenVerseSearch` | Workflow-local is better because this is an image-training workflow surface and Phase 3 integration point is `ClassEntry`. [VERIFIED: .planning/codebase/STRUCTURE.md] |
| MUI `ImageList` | Plain CSS grid | Plain CSS grid gives stable square tile sizing and overlay behavior without adding MUI list semantics that may expose captions or layout constraints. [VERIFIED: 02-UI-SPEC.md] |
| Global Jotai atom for search state | Local component state | Search state is dialog-local and not shared across widgets in Phase 2, so global atom state would add unnecessary cross-widget surface. [VERIFIED: .planning/codebase/ARCHITECTURE.md] |

**Installation:** No new packages are required for Phase 2. [VERIFIED: package.json]

```bash
npm install
```

## Architecture Patterns

### System Architecture Diagram

```text
Student opens future class-scoped dialog (Phase 3)
        |
        v
OpenVerseSearchDialog(open, className, onClose, onUseImage)
        |
        v
Search form: one query + explicit submit
        |
        v
Abort previous request + searchOpenVerseImages({ query, page, signal })
        |
        +--> success with results[] ----------> append/replace local results -> image-only grid
        |                                            |
        |                                            v
        |                                      result button activation
        |                                            |
        |                                            v
        |                                      onUseImage(result)
        |                                      (Phase 2 stops here)
        |
        +--> success with results: [] --------> localized empty state
        |
        +--> OpenVerseSearchError.code -------> localized retry/rate-limit/invalid state
        |
        +--> AbortError/stale response --------> ignore; do not update UI
```

### Recommended Project Structure

```text
src/
├── workflow/
│   └── OpenVerseSearch/
│       ├── OpenVerseSearchDialog.tsx        # Dialog, form, state, search calls
│       ├── OpenVerseSearchDialog.module.css # Grid, tile, overlay, responsive layout
│       └── OpenVerseSearchDialog.test.tsx   # Phase 2 component coverage
└── util/
    └── openverse.ts                         # Existing client and result/error types
```

This location matches the codebase rule that new workflow widgets belong under `src/workflow/<WidgetName>/`. [VERIFIED: .planning/codebase/STRUCTURE.md]

### Component API

```typescript
import type { OpenVerseImageResult, OpenVerseImageSearchResult, SearchOpenVerseImagesOptions } from '@genaitm/util/openverse';

type SearchClient = (options: SearchOpenVerseImagesOptions) => Promise<OpenVerseImageSearchResult>;

interface Props {
    open: boolean;
    className: string;
    onClose: () => void;
    onUseImage: (result: OpenVerseImageResult) => void | Promise<void>;
    searchClient?: SearchClient;
}
```

Use `searchOpenVerseImages` as the default `searchClient`. [VERIFIED: src/util/openverse.ts] The test-injected `searchClient` should make component tests deterministic without mocking `global.fetch`. [VERIFIED: src/components/DatasetPicker/DatasetPicker.test.tsx]

Do not include props for `license`, `source`, `creator`, `filetype`, `aspectRatio`, or `mature` controls. [VERIFIED: 02-CONTEXT.md]

### State Model

| State | Type | Owner | Notes |
|-------|------|-------|-------|
| `query` | `string` | local component | Controlled field value; does not trigger search while typing. [VERIFIED: 02-CONTEXT.md] |
| `submittedQuery` | `string` | local component | Last explicit submitted term; retry and pagination reuse this. [VERIFIED: 02-CONTEXT.md] |
| `results` | `OpenVerseImageResult[]` | local component | Replace on page 1 search; append on `Mehr Ergebnisse`. [VERIFIED: src/util/openverse.ts] |
| `page` / `pageCount` | `number` | local component | Read from `OpenVerseImageSearchResult`. [VERIFIED: src/util/openverse.ts] |
| `status` | discriminated union | local component | Use `idle`, `loading`, `loading-more`, `results`, `empty`, `error`, `rate-limited`. [VERIFIED: 02-UI-SPEC.md] |
| `errorCode` | `OpenVerseSearchErrorCode \| null` | local component | Map known client errors to localized copy. [VERIFIED: src/util/openverse.ts] |
| `useErrorsById` | `Record<string, boolean>` or `Set<string>` | local component | Only for rejected `onUseImage`; do not claim import success. [VERIFIED: 02-UI-SPEC.md] |
| `pendingUseIds` | `Set<string>` | local component | Optional local duplicate activation guard while callback promise is pending. [VERIFIED: IMPORT-05 in .planning/REQUIREMENTS.md] |

Do not add a Jotai atom for this state in Phase 2. [VERIFIED: .planning/codebase/ARCHITECTURE.md]

### Async Search And Cancellation

Use an `AbortController` per explicit request and abort the previous request before starting a new search or when closing the dialog. [VERIFIED: src/util/openverse.ts] React official docs recommend effect cleanup/ignore guards to prevent stale async responses from updating state after dependencies change. [CITED: https://react.dev/reference/react/useEffect]

Recommended pattern:

```typescript
// Source: React docs + local OpenVerse client
const activeSearch = useRef<AbortController | null>(null);
const requestId = useRef(0);

async function runSearch(nextQuery: string, nextPage: number): Promise<void> {
    activeSearch.current?.abort();
    const controller = new AbortController();
    activeSearch.current = controller;
    const id = requestId.current + 1;
    requestId.current = id;

    try {
        const response = await searchClient({ query: nextQuery, page: nextPage, signal: controller.signal });
        if (controller.signal.aborted || id !== requestId.current) return;
        setResults((current) => (nextPage === 1 ? response.results : [...current, ...response.results]));
    } catch (error) {
        if (controller.signal.aborted || id !== requestId.current) return;
        // Map OpenVerseSearchError.code to UI state.
    }
}
```

Use both abort and request-id/ignore protection because aborted fetches can reject and stale promises may still resolve through mocked clients in tests. [CITED: https://react.dev/learn/synchronizing-with-effects] [VERIFIED: src/util/openverse.test.ts]

### Error Mapping

| Source Error | UI State | Copy Key | Severity | Retry |
|--------------|----------|----------|----------|-------|
| `empty-query` | field helper, not dialog alert | `trainingdata.openverse.emptyQuery` | none | no |
| `network` | retryable error | `trainingdata.openverse.retryableError` | MUI `Alert` error | yes |
| `http` | retryable error | `trainingdata.openverse.retryableError` | MUI `Alert` error | yes |
| `invalid-response` | retryable error | `trainingdata.openverse.retryableError` | MUI `Alert` error | yes |
| `rate-limited` | rate-limit state | `trainingdata.openverse.rateLimit` | MUI `Alert` warning | yes, but copy says later |
| successful `results: []` | empty state | `trainingdata.openverse.emptyTitle` + `emptyBody` | neutral | new query |
| `onUseImage` rejection | result-level failed-use state | `trainingdata.openverse.failedUse` | local tile text | retry same result |

`OpenVerseSearchError` currently exposes `code`, `status`, and `retryAfter`. [VERIFIED: src/util/openverse.ts] Valid empty results are a successful response and must not be converted into an error. [VERIFIED: 01-VERIFICATION.md]

### Result Grid Hover/Focus/Touch Behavior

Use real `<button type="button">` tiles rather than clickable `<div>` tiles. [CITED: https://mui.com/material-ui/react-button/] Existing dataset tiles use clickable `Box`, but Phase 2 has a stronger keyboard/touch requirement. [VERIFIED: src/components/DatasetPicker/ImageTile.tsx]

CSS requirements:

```css
.resultButton {
    position: relative;
    aspect-ratio: 1 / 1;
    min-width: 96px;
    border: 1px solid borderGrey;
    border-radius: 6px;
    overflow: hidden;
}

.resultOverlay {
    opacity: 0;
}

.resultButton:hover .resultOverlay,
.resultButton:focus-visible .resultOverlay,
.resultButton:focus-within .resultOverlay,
.resultButton.touchActive .resultOverlay {
    opacity: 1;
}
```

Touch implementation should either activate on tap directly through the button or set a temporary `touchActiveId` on `onPointerDown` for coarse pointers; touch must not depend on hover. [VERIFIED: 02-UI-SPEC.md]

Use `aria-label` from the hidden result title, falling back to `OpenVerse Bild`. [VERIFIED: 02-UI-SPEC.md] Do not render title, creator, source, license, dimensions, URL, or attribution visibly. [VERIFIED: .planning/REQUIREMENTS.md]

### Pagination

Use `page < pageCount` as the only condition for showing `Mehr Ergebnisse`. [VERIFIED: src/util/openverse.ts] Calling `searchClient({ query: submittedQuery, page: page + 1, signal })` should append to `results`, not replace. [VERIFIED: 02-UI-SPEC.md]

Disable `Mehr Ergebnisse` while `loading-more` is active. [VERIFIED: 02-UI-SPEC.md] Do not implement infinite scroll in Phase 2. [VERIFIED: 02-UI-SPEC.md]

### i18n Additions

Add keys under `trainingdata.openverse` in each `public/locales/*/image_adv.json` file if the current image workflow namespace is `image_adv`. [VERIFIED: public/locales/de-DE/image_adv.json] At minimum, German must match the UI spec; other locales may use English fallback-style direct translations if no localized copy is available. [ASSUMED]

Recommended German keys:

```json
{
  "trainingdata": {
    "openverse": {
      "title": "OpenVerse: {{className}}",
      "searchLabel": "Suchbegriff",
      "searchPlaceholder": "z. B. Katze",
      "searchAction": "Bilder suchen",
      "useImage": "Dieses Bild nutzen",
      "initial": "Suche nach Bildern für diese Klasse.",
      "loading": "Suche Bilder...",
      "loadingMore": "Weitere Bilder werden geladen...",
      "emptyTitle": "Keine Bilder gefunden.",
      "emptyBody": "Versuche einen anderen Suchbegriff.",
      "retryableError": "Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.",
      "rateLimit": "Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.",
      "retry": "Erneut versuchen",
      "more": "Mehr Ergebnisse",
      "failedUse": "Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.",
      "fallbackAlt": "OpenVerse Bild"
    }
  }
}
```

The component should call `const { namespace } = useVariant(); const { t } = useTranslation(namespace);`, matching existing workflow components. [VERIFIED: src/workflow/ClassEntry/Classification.tsx] [CITED: Context7 /i18next/react-i18next]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal behavior | Custom overlay/focus trap | MUI `Dialog` | Existing app uses MUI dialogs and MUI Dialog is designed as a modal window with title/content/actions and scrolling support. [VERIFIED: src/components/DatasetPicker/DatasetPicker.tsx] [CITED: https://mui.com/material-ui/react-dialog/] |
| HTTP client/normalization | New OpenVerse fetch parser in UI | `searchOpenVerseImages` | Phase 1 already handles safe defaults, pagination, normalization, and typed errors. [VERIFIED: src/util/openverse.ts] |
| Async race handling | Untracked promise state | `AbortController` plus request-id/ignore guard | React docs require cleanup/ignore patterns to prevent stale effects from updating state. [CITED: https://react.dev/learn/synchronizing-with-effects] |
| Keyboard interaction | Clickable `div` with ad hoc key handling | Native `button` tile | Native buttons provide keyboard activation semantics and simplify UI tests. [CITED: https://mui.com/material-ui/react-button/] |
| Test interaction events | Manual `fireEvent` sequences | `userEvent` | Testing Library user-event simulates interactions as a browser user would. [CITED: https://testing-library.com/docs/user-event/intro/] |
| Class sample mutation | UI-local canvas import and `setData` | Phase 3 integration | Phase 2 boundary requires only `onUseImage(result)`. [VERIFIED: 02-CONTEXT.md] |

**Key insight:** Phase 2 is a selection UI and search-state boundary, not an import pipeline. [VERIFIED: .planning/ROADMAP.md]

## Common Pitfalls

### Pitfall 1: Mutating Class State In Phase 2
**What goes wrong:** The dialog imports the remote image or calls `setData`, collapsing Phase 2 and Phase 3. [VERIFIED: .planning/ROADMAP.md]
**Why it happens:** Existing `Classification.tsx` sample sources mutate class samples directly. [VERIFIED: src/workflow/ClassEntry/Classification.tsx]
**How to avoid:** Keep the new module free of `classState`, `setData`, `importOpenVerseImage`, and sample object creation. [VERIFIED: 02-CONTEXT.md]
**Warning signs:** Imports from `@genaitm/state` or `@genaitm/util/openverseImageImport` in `OpenVerseSearchDialog.tsx`. [VERIFIED: src/util/openverseImageImport.ts exists from Phase 1 verification]

### Pitfall 2: Stale Searches Updating The Wrong UI
**What goes wrong:** A slow first query overwrites a newer query or updates after close. [CITED: https://react.dev/learn/synchronizing-with-effects]
**Why it happens:** Async responses resolve out of order. [CITED: https://react.dev/reference/react/useEffect]
**How to avoid:** Abort previous requests and ignore stale request IDs. [VERIFIED: src/util/openverse.ts] [CITED: https://react.dev/reference/react/useEffect]
**Warning signs:** No cleanup in effects or handlers and no request identity check. [ASSUMED]

### Pitfall 3: Metadata Leaks Into V1 UI
**What goes wrong:** Visible title/license/source/creator text appears in result cards. [VERIFIED: .planning/REQUIREMENTS.md]
**Why it happens:** `OpenVerseImageResult` preserves provenance fields for future use. [VERIFIED: src/util/openverse.ts]
**How to avoid:** Render only image and action overlay; use title only for `alt`/`aria-label`. [VERIFIED: 02-UI-SPEC.md]
**Warning signs:** JSX includes `result.license`, `result.creator`, `result.source`, `result.foreignLandingUrl`, or visible `result.title`. [VERIFIED: src/util/openverse.ts]

### Pitfall 4: Hover-Only Action
**What goes wrong:** Touch and keyboard users cannot discover or activate `Dieses Bild nutzen`. [VERIFIED: 02-UI-SPEC.md]
**Why it happens:** CSS `:hover` is mouse-specific. [ASSUMED]
**How to avoid:** Reveal overlay on hover, focus-visible/focus-within, and touch activation; use button semantics. [VERIFIED: 02-UI-SPEC.md]
**Warning signs:** Overlay CSS has `:hover` only or result tile is not focusable. [ASSUMED]

### Pitfall 5: Treating Empty Results As Error
**What goes wrong:** A valid zero-result OpenVerse response shows an error alert. [VERIFIED: 01-VERIFICATION.md]
**Why it happens:** Phase 1 initially had wording ambiguity around empty results. [VERIFIED: 01-VERIFICATION.md]
**How to avoid:** `response.results.length === 0` maps to empty UI, not `OpenVerseSearchError`. [VERIFIED: src/util/openverse.test.ts]
**Warning signs:** Empty search test expects `Alert` severity error. [ASSUMED]

## Code Examples

### Search Submit Handler

```typescript
// Source: src/util/openverse.ts + React cleanup guidance
function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextQuery = query.trim();
    if (nextQuery.length === 0 || status === 'loading') return;
    setSubmittedQuery(nextQuery);
    setResults([]);
    void runSearch(nextQuery, 1);
}
```

### Result Button

```tsx
// Source: MUI/Button accessibility docs and UI spec
<button
    type="button"
    className={styles.resultButton}
    aria-label={t('trainingdata.openverse.useImageFor', {
        title: result.title || t('trainingdata.openverse.fallbackAlt'),
    })}
    onClick={() => void handleUse(result)}
>
    <img
        src={result.thumbnailUrl}
        alt={result.title || t('trainingdata.openverse.fallbackAlt')}
        className={styles.resultImage}
        loading="lazy"
    />
    <span className={styles.resultOverlay}>{t('trainingdata.openverse.useImage')}</span>
</button>
```

### Test Pattern

```typescript
// Source: Testing Library user-event docs + local Vitest setup
it('calls onUseImage from keyboard activation', async ({ expect }) => {
    const user = userEvent.setup();
    const onUseImage = vi.fn();
    render(<OpenVerseSearchDialog open className="Klasse 1" onClose={vi.fn()} onUseImage={onUseImage} searchClient={searchClient} />, {
        wrapper: TestWrapper,
    });

    await user.type(screen.getByLabelText('trainingdata.openverse.searchLabel'), 'Katze');
    await user.click(screen.getByRole('button', { name: 'trainingdata.openverse.searchAction' }));
    const tile = await screen.findByRole('button', { name: /Katze/i });
    tile.focus();
    await user.keyboard('{Enter}');

    expect(onUseImage).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-1' }));
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Search-as-you-type for media pickers | Explicit submit for classroom control | Locked in Phase 2 context on 2026-05-06 [VERIFIED: 02-CONTEXT.md] | Reduces accidental API calls and rate-limit risk. [VERIFIED: 02-CONTEXT.md] |
| Error for empty OpenVerse results | Successful empty response with neutral empty UI | Phase 1 verification accepted override on 2026-05-06 [VERIFIED: 01-VERIFICATION.md] | Phase 2 must test empty state separately from errors. [VERIFIED: 01-VERIFICATION.md] |
| Direct sample-source mutation inside `Classification.tsx` | Phase 2 selection callback, Phase 3 mutation | Roadmap split on 2026-05-06 [VERIFIED: .planning/ROADMAP.md] | Keeps UI testable before import integration. [VERIFIED: .planning/ROADMAP.md] |

**Deprecated/outdated:**
- Adding visible attribution/license UI in v1 is out of scope. [VERIFIED: .planning/REQUIREMENTS.md]
- Adding advanced OpenVerse filters in v1 is out of scope. [VERIFIED: .planning/REQUIREMENTS.md]
- Adding backend proxy/cache in Phase 2 is out of scope unless Phase 4 validation later proves it necessary. [VERIFIED: .planning/ROADMAP.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Non-German locale additions may use direct English fallback-style translations if localized copy is unavailable. | i18n Additions | Product may require fully localized strings for every supported locale before merge. |
| A2 | Hover-only CSS is insufficient for touch devices because hover is mouse-specific. | Common Pitfalls | Planner may under-spec touch activation tests. |
| A3 | Missing request identity checks are a warning sign for stale async UI state. | Common Pitfalls | Planner may rely on abort alone and miss stale mocked-client behavior. |

## Open Questions

1. **Should Phase 2 add all locale files or only German/English?**
   - What we know: Existing locale files are runtime JSON files under `public/locales/*/image_adv.json`. [VERIFIED: find public/locales]
   - What's unclear: The project has no explicit fallback policy for newly introduced copy across all existing locales. [ASSUMED]
   - Recommendation: Add keys to all locale files to avoid missing runtime keys, using German for `de-DE` and English fallback wording elsewhere unless product localization is available. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node/npm | npm scripts and package checks | ✓ [VERIFIED: npm view commands ran] | npm available [VERIFIED: npm registry checks] | none |
| Vitest/jsdom | Component tests | ✓ [VERIFIED: package.json + vite.config.ts] | Vitest `^3.1.1` project, current `4.1.5` registry [VERIFIED: npm registry] | none |
| Network access | OpenVerse live search not required for Phase 2 tests | ✓ [VERIFIED: npm registry and web queries succeeded] | — | Mock/injected `searchClient` for tests |

**Missing dependencies with no fallback:** None found for Phase 2 planning. [VERIFIED: package.json]

**Missing dependencies with fallback:** Real OpenVerse availability is not required for Phase 2 automated tests because `searchClient` can be injected. [VERIFIED: 02-UI-SPEC.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^3.1.1` in project, jsdom environment. [VERIFIED: package.json + vite.config.ts] |
| Config file | `vite.config.ts` with `test.environment = 'jsdom'` and `setupFiles = './src/setupTests.ts'`. [VERIFIED: vite.config.ts] |
| Quick run command | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` [VERIFIED: .planning/codebase/TESTING.md] |
| Full suite command | `npm run ci:test` [VERIFIED: package.json + .planning/codebase/TESTING.md] |

### Phase Requirements To Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| UI-02 | Dialog title includes class name. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-03 | Typing does not search until submit or Enter. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-04 | Result grid is image-only with no visible metadata. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-05 | Hover/focus/keyboard activation exposes and triggers `Dieses Bild nutzen`. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-06 | Loading, empty, retryable error, rate-limit, and failed-use states render localized copy. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-07 | `Mehr Ergebnisse` loads next page and appends results. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| UI-08 | No advanced filter controls are rendered. [VERIFIED: .planning/REQUIREMENTS.md] | component | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |
| TEST-03 | Component test file covers required UI states. [VERIFIED: .planning/REQUIREMENTS.md] | test coverage | `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` [VERIFIED: .planning/codebase/TESTING.md]
- **Per wave merge:** `npm run lint && npm test -- src/util/openverse.test.ts src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` [VERIFIED: package.json]
- **Phase gate:** `npm run lint && npm run build && npm run ci:test` before `$gsd-verify-work`. [VERIFIED: 01-VERIFICATION.md]

### Wave 0 Gaps

- [ ] `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx` - covers UI-02 through UI-08 and TEST-03. [VERIFIED: .planning/REQUIREMENTS.md]
- [ ] `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` - component under test does not exist yet. [VERIFIED: rg/find source tree]
- [ ] `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css` - grid/overlay styling does not exist yet. [VERIFIED: rg/find source tree]
- [ ] Locale keys under `trainingdata.openverse` - not present in `de-DE/image_adv.json`. [VERIFIED: public/locales/de-DE/image_adv.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No authentication is introduced by Phase 2. [VERIFIED: .planning/codebase/ARCHITECTURE.md] |
| V3 Session Management | no | No session management is introduced by Phase 2. [VERIFIED: .planning/codebase/ARCHITECTURE.md] |
| V4 Access Control | no | No protected resources are introduced by Phase 2. [VERIFIED: .planning/ROADMAP.md] |
| V5 Input Validation | yes | Trim and block empty query in UI; rely on `searchOpenVerseImages` for request construction. [VERIFIED: src/util/openverse.ts] |
| V6 Cryptography | no | No cryptography is introduced by Phase 2. [VERIFIED: .planning/ROADMAP.md] |

### Known Threat Patterns for React/OpenVerse UI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted result metadata rendered as visible text | Tampering / Information Disclosure | Do not render provenance metadata visibly; React text escaping applies to any hidden accessible string. [VERIFIED: .planning/REQUIREMENTS.md] [ASSUMED] |
| Excess API calls causing rate limits | Denial of Service | Explicit submit, disabled duplicate submit, and rate-limit UI. [VERIFIED: 02-CONTEXT.md] |
| Stale async response changing UI after close/new query | Tampering | Abort and ignore stale requests. [CITED: https://react.dev/reference/react/useEffect] |
| Unexpected OpenVerse response shape | Tampering | Use Phase 1 typed client invalid-response handling. [VERIFIED: src/util/openverse.ts] |

## Sources

### Primary (HIGH Confidence)

- `AGENTS.md` - project workflow, architecture, UX, and testing constraints. [VERIFIED: local read]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` - product scope, requirements, phase boundary, and current status. [VERIFIED: local read]
- `.planning/phases/02-student-search-ui/02-CONTEXT.md` - locked Phase 2 implementation decisions. [VERIFIED: local read]
- `.planning/phases/02-student-search-ui/02-UI-SPEC.md` - UI contract, copy, interaction, accessibility, and testable acceptance criteria. [VERIFIED: local read]
- `.planning/phases/01-openverse-client-import-boundary/01-VERIFICATION.md` - Phase 1 empty-results and typed-error contract. [VERIFIED: local read]
- `.planning/codebase/STRUCTURE.md`, `CONVENTIONS.md`, `ARCHITECTURE.md`, `TESTING.md` - codebase patterns and test infrastructure. [VERIFIED: local read]
- `src/util/openverse.ts`, `src/util/openverse.test.ts` - local client API, result model, pagination, and error behavior. [VERIFIED: local read]
- `src/components/DatasetPicker/DatasetPicker.tsx`, `DatasetPicker.module.css`, `DatasetPicker.test.tsx` - existing dialog/i18n/test patterns. [VERIFIED: local read]
- `src/workflow/ClassEntry/Classification.tsx`, `classification.module.css` - future Phase 3 integration point and sample-source mutation patterns to avoid in Phase 2. [VERIFIED: local read]
- npm registry checks for React, MUI, react-i18next, Vitest, and Testing Library package versions. [VERIFIED: npm registry]
- Context7 `/reactjs/react.dev` - effect cleanup/stale async request guidance. [CITED: Context7 /reactjs/react.dev]
- Context7 `/i18next/react-i18next` - `useTranslation(namespace)` API. [CITED: Context7 /i18next/react-i18next]
- Context7 `/testing-library/user-event` - keyboard, tab, click, and hover testing APIs. [CITED: Context7 /testing-library/user-event]

### Secondary (MEDIUM Confidence)

- MUI Dialog documentation - dialog composition, max width/fullWidth, scroll behavior, accessibility handoff to Modal. [CITED: https://mui.com/material-ui/react-dialog/]
- MUI Button documentation - buttons as tap/click actions and native button accessibility note. [CITED: https://mui.com/material-ui/react-button/]
- Testing Library user-event introduction - realistic user interactions. [CITED: https://testing-library.com/docs/user-event/intro/]
- OpenVerse API search snippets for paginated image results and response fields. [CITED: https://docs.openverse.org/]

### Tertiary (LOW Confidence)

- Locale fallback strategy for non-German locales. [ASSUMED]
- Touch hover limitation wording. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions verified in `package.json` and npm registry. [VERIFIED: package.json + npm registry]
- Architecture: HIGH - phase boundaries and component location are explicit in local planning docs and codebase map. [VERIFIED: .planning/ROADMAP.md + .planning/codebase/STRUCTURE.md]
- Pitfalls: HIGH for phase-boundary, empty-results, metadata, and async issues; MEDIUM for locale fallback because policy is not explicit. [VERIFIED: local docs] [ASSUMED]

**Research date:** 2026-05-06 [VERIFIED: system date]
**Valid until:** 2026-06-05 for local architecture; recheck npm/docs before dependency upgrades. [ASSUMED]
