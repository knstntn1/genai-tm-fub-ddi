# Architecture Research

**Domain:** OpenVerse image search/import for a browser-based React/Jotai teachable-machine workflow
**Researched:** 2026-05-06
**Confidence:** HIGH for in-repo integration shape; MEDIUM for direct browser import reliability until CORS/canvas tainting is spiked against live OpenVerse result origins.

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ Existing Training Data Workflow                             │
│ src/workflow/TrainingData/TrainingData.tsx                  │
│   owns class list and setDataIx adapter                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ props
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Existing Class Card + New Search Entry Point                │
│ src/workflow/ClassEntry/Classification.tsx                  │
│   camera/file/dataset/OpenVerse source buttons              │
└──────────────────────────────┬──────────────────────────────┘
                               │ open dialog + onCanvasSelected
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ New OpenVerse UI Components                                 │
│ src/components/OpenVerseImageSearch/                        │
│   dialog, search form, result grid, result tile             │
└──────────────────────────────┬──────────────────────────────┘
                               │ typed calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ New Client/Import Utilities                                 │
│ src/util/openverse.ts          searchImages()               │
│ src/util/openverseImageImport.ts resultToCanvas()           │
└──────────────────────────────┬──────────────────────────────┘
                               │ fetch + Image/canvas APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ External OpenVerse API + Remote Image Hosts                 │
│ https://api.openverse.org/v1/images/                        │
│ result thumbnail/full image URLs                            │
└─────────────────────────────────────────────────────────────┘
```

OpenVerse should be a third image sample source inside the existing class card, equivalent in role to webcam capture and file upload. It should not become a route, a model feature, or a Jotai-backed dataset subsystem in v1.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `Classification` | Owns the per-class entry point and inserts imported canvases into the selected class. | Add `showOpenVerseSearch` local state, an image-only source button, and an `onImageSelected(canvas)` callback that prepends `{ data: canvas, id: '' }` through existing `setData`. |
| `OpenVerseImageSearchDialog` | Owns dialog visibility, query input, loading/error/empty states, pagination trigger, and selection lock while importing. | MUI dialog component under `src/components/OpenVerseImageSearch/`; local `useState` is enough because no sibling widget needs search state. |
| `OpenVerseResultGrid` | Presents image-only results with hover action text `Dieses Bild nutzen` and no v1 metadata chrome. | Pure-ish presentational component receiving results, import status, and `onSelect(result)`. |
| `openverse.ts` | Shields UI from OpenVerse response shape and normalizes results. | `searchOpenVerseImages({ q, page, pageSize, signal })` using `fetch` or `@openverse/api-client`; return `OpenVerseImageResult[]`. |
| `openverseImageImport.ts` | Converts a selected remote image into a trainable `HTMLCanvasElement`. | Prefer existing `@genai-fi/base` `canvasFromURL`; wrap with timeout, fallback URL order, thumbnail/full-size choice, canvas sizing, and normalized errors. |
| Tests | Protect the remote boundary, UI state transitions, and class-state insertion. | Co-located Vitest tests for utility and component files; mock `fetch`, mock conversion, and use a real Jotai store via `TestWrapper` where class state is involved. |

## Recommended Project Structure

```text
src/
├── components/
│   └── OpenVerseImageSearch/
│       ├── OpenVerseImageSearchDialog.tsx
│       ├── OpenVerseImageSearchDialog.test.tsx
│       ├── OpenVerseResultGrid.tsx
│       ├── OpenVerseResultGrid.test.tsx
│       └── OpenVerseImageSearch.module.css
├── util/
│   ├── openverse.ts
│   ├── openverse.test.ts
│   ├── openverseImageImport.ts
│   └── openverseImageImport.test.ts
└── workflow/
    └── ClassEntry/
        ├── Classification.tsx
        └── Classification.test.tsx
```

### Structure Rationale

- **`src/components/OpenVerseImageSearch/`:** The search UI is reusable visual UI, not a workflow widget. Keeping it in `components` matches `DatasetPicker`, which already provides an external image-picking dialog consumed from `Classification`.
- **`src/util/openverse.ts`:** OpenVerse response fields, pagination, HTTP errors, abort handling, and rate-limit mapping belong at the network boundary. UI components should never index raw API objects directly.
- **`src/util/openverseImageImport.ts`:** Image conversion is a browser/domain utility. It is the likely failure point because remote image hosts can block fetches or produce tainted canvases; isolating it makes proxy fallback easier if needed.
- **`src/workflow/ClassEntry/Classification.tsx`:** The selected class is already known here, and current capture/upload/dataset flows already mutate the class sample collection from this file. Adding OpenVerse here avoids prop drilling through `TrainingData`.

## Architectural Patterns

### Pattern 1: Client Boundary With Normalized Domain Types

**What:** Wrap OpenVerse API calls in a small typed module returning only fields the app needs: `id`, `title`, `thumbnailUrl`, `imageUrl`, `foreignLandingUrl`, `creator`, `license`, and maybe `source`.

**When to use:** Always for search. Even though v1 hides metadata, retain attribution/license fields in the normalized type so a later visible-attribution phase does not require another API refactor.

**Trade-offs:** A direct `fetch` wrapper has no new dependency and is enough for v1. The official `@openverse/api-client` provides generated types and uses global `fetch`, but adds package surface. Recommendation: start with a local `fetch` wrapper over `/v1/images/`; switch to `@openverse/api-client` only if type coverage is worth the dependency.

```typescript
export interface OpenVerseImageResult {
    id: string;
    title: string;
    thumbnailUrl: string;
    imageUrl: string;
    creator?: string;
    license?: string;
    source?: string;
}

export async function searchOpenVerseImages({ q, page = 1, pageSize = 20, signal }: SearchParams) {
    const url = new URL('https://api.openverse.org/v1/images/');
    url.searchParams.set('q', q.trim());
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    const response = await fetch(url, { signal });
    if (!response.ok) throw new OpenVerseSearchError(response.status, response.statusText);
    return normalizeOpenVerseResponse(await response.json());
}
```

### Pattern 2: Local UI State, Existing Class State

**What:** Search query/results/loading/importing/error state stays inside the dialog. Only the final converted `HTMLCanvasElement` crosses into workflow state.

**When to use:** v1 search is scoped to one class card and has no need to coordinate with Trainer/Input/Output widgets.

**Trade-offs:** Closing the dialog loses current results, which is acceptable for a simple classroom import. If later UX needs cross-class search reuse, promote only query/result cache to a small hook or atom then.

### Pattern 3: Convert Before Mutating `classState`

**What:** A selected OpenVerse result must be converted to a usable canvas before it is added to `IClassification.samples`.

**When to use:** Always. Existing image samples are `HTMLCanvasElement`s; training, preview, save/load, sample move/delete, and `toDataURL()` paths expect the same shape.

**Trade-offs:** Import click feels slower because conversion happens before insertion, but it prevents broken or non-serializable samples from entering class state.

```typescript
const handleOpenVerseSelected = async (result: OpenVerseImageResult) => {
    const canvas = await importOpenVerseImage(result);
    canvas.style.width = '58px';
    canvas.style.height = '58px';
    setData(
        (data) => ({
            label: data.label,
            samples: [{ data: canvas, id: '' }, ...data.samples],
        }),
        index
    );
};
```

## Data Flow

### Search Result to Training Sample

```text
Student clicks OpenVerse button on class card
    ↓
Classification sets showOpenVerseSearch=true
    ↓
OpenVerseImageSearchDialog renders query form
    ↓
Student submits query
    ↓
searchOpenVerseImages() fetches /v1/images/?q=...&page_size=...
    ↓
openverse.ts normalizes API response to OpenVerseImageResult[]
    ↓
OpenVerseResultGrid renders image tiles
    ↓
Student clicks "Dieses Bild nutzen"
    ↓
openverseImageImport.ts converts result.imageUrl/thumbnailUrl to HTMLCanvasElement
    ↓
Classification prepends { data: canvas, id: '' } into selected IClassification.samples
    ↓
TrainingData receives updated class data through existing setData flow
    ↓
Trainer/model save/preview/sample modal use the sample exactly like webcam/file samples
```

### Error Flow

```text
Search failure
    → openverse.ts throws normalized OpenVerseSearchError
    → dialog shows recoverable German error text and keeps query editable

Empty result
    → dialog shows empty state, no class state mutation

Image load/conversion failure
    → import utility throws OpenVerseImageImportError
    → tile/dialog clears importing state and shows "Bild konnte nicht geladen werden"
    → no sample is inserted

Abort/stale query
    → AbortController cancels previous fetch
    → stale responses ignored
    → current results remain coherent
```

### State Ownership

| State | Owner | Why |
|-------|-------|-----|
| Query text | `OpenVerseImageSearchDialog` | UI-only and scoped to one dialog session. |
| Results/page/loading/error | `OpenVerseImageSearchDialog` or a local `useOpenVerseSearch` hook | Shared only within the dialog subtree. |
| Currently importing result id | `OpenVerseImageSearchDialog` | Prevents duplicate clicks and supports per-tile progress. |
| Selected class index | Existing `Classification` props | The class card already owns index and insertion callback. |
| Imported sample | Existing `classState` through `TrainingData`/`Classification` | Must match webcam/file/dataset samples. |
| OpenVerse metadata | Normalized result type only in v1 | Do not add to `ISample` unless attribution/persistence becomes a requirement. |

## Build Order and Dependencies

1. **Add `openverse.ts` client and tests.**
   - Dependency: official API shape.
   - Output: normalized results and search error taxonomy.
   - Roadmap reason: proves browser search works before UI effort.

2. **Add `openverseImageImport.ts` conversion utility and tests.**
   - Dependency: existing canvas sample contract and `@genai-fi/base` image helpers.
   - Output: reliable `OpenVerseImageResult -> HTMLCanvasElement` path.
   - Roadmap reason: determines whether v1 can stay backend-free. If common OpenVerse result images cannot be fetched/drawn without tainting, add a backend/proxy research flag before UI completion.

3. **Build presentational result grid.**
   - Dependency: normalized result type.
   - Output: image grid with hover action and disabled/importing states.
   - Roadmap reason: isolates visual requirements from API behavior.

4. **Build search dialog.**
   - Dependency: client + grid + import utility.
   - Output: query, loading, empty, error, pagination or "more" behavior, selection callback.
   - Roadmap reason: completes remote search UX without touching training data yet.

5. **Integrate dialog into `Classification`.**
   - Dependency: import callback and existing class sample insertion.
   - Output: OpenVerse button beside existing image source controls and sample insertion into selected class.
   - Roadmap reason: highest blast radius step comes after utility/component tests exist.

6. **Add workflow-level integration tests.**
   - Dependency: final UI integration.
   - Output: selecting an OpenVerse result adds exactly one canvas sample to the active class and leaves other classes unchanged.

## Test Strategy Implications

| Test Target | Test Type | Key Cases |
|-------------|-----------|-----------|
| `openverse.ts` | Unit | Builds `/v1/images/` query with `q`, `page`, `page_size`; normalizes result URLs; maps non-2xx and malformed responses; abort does not show as generic failure. |
| `openverseImageImport.ts` | Unit with mocked image/canvas helper | Prefers usable image URL; falls back to thumbnail if designed; sets stable canvas dimensions/styles; throws typed import error on blocked image. |
| `OpenVerseResultGrid` | Component | Renders images only, shows hover/click action, disables duplicate import while selected result is importing, calls `onSelect` with normalized result. |
| `OpenVerseImageSearchDialog` | Component | Search submit calls client, loading/error/empty states render, stale searches do not overwrite newer results, selected result calls import callback. |
| `Classification` integration | Component with real store or controlled props | Clicking source button opens dialog; successful result prepends `{ data: canvas, id: '' }`; failed import does not mutate samples; speech/audio variants do not show image search. |

Use existing Vitest/jsdom and React Testing Library patterns. Mock `fetch` at the OpenVerse boundary, mock the image conversion utility in dialog/classification tests, and do not mock Jotai itself when testing real workflow state.

## Anti-Patterns

### Anti-Pattern 1: Adding Raw Remote URLs to `ISample`

**What people do:** Store the OpenVerse image URL in `samples` and let trainer/preview load it later.
**Why it's wrong:** Existing samples are canvases or audio examples. Save/load and preview paths call `toDataURL()`; raw URLs would break training data assumptions and introduce late remote failures.
**Do this instead:** Convert to `HTMLCanvasElement` first, then insert the same sample shape used by webcam and file imports.

### Anti-Pattern 2: Global Jotai Search State for v1

**What people do:** Add atoms for query, results, selected image, and loading state.
**Why it's wrong:** This search state is not shared across workflow widgets and would make transient dialog state look domain-global.
**Do this instead:** Keep search state local. Add atoms only if a later phase needs cross-class cache, persistent search state, or coordinated moderation.

### Anti-Pattern 3: OpenVerse API Calls Inside Result Tiles

**What people do:** Let each component fetch details or import remote images ad hoc.
**Why it's wrong:** Error handling, rate limiting, aborts, and tests become scattered. It also makes it hard to introduce a proxy fallback.
**Do this instead:** Keep API and conversion calls in utilities or a dialog-level hook; tiles remain presentational.

### Anti-Pattern 4: Backend First

**What people do:** Add a proxy service before proving direct API and image import limitations.
**Why it's wrong:** The repo is a static browser SPA, and official OpenVerse client docs support unauthenticated fetch-based usage. A backend adds deployment and classroom reliability burden.
**Do this instead:** Build direct client integration first. Add a proxy only if live tests show API CORS, image-host CORS, canvas tainting, or rate limits make direct import unreliable.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenVerse API | Direct browser `fetch` to `https://api.openverse.org/v1/images/` through `src/util/openverse.ts`. | Official docs show anonymous clients and `/v1/images/` query usage. Handle rate-limit headers if exposed; client library does not back off automatically. |
| Remote image hosts from results | Convert selected image URL to canvas in `src/util/openverseImageImport.ts`. | This is the main uncertainty. Some hosts may block fetch/image loading or taint canvases. Test with live representative results before declaring backend unnecessary. |
| Optional future proxy | Same `openverse.ts`/`openverseImageImport.ts` public functions, different base URL. | Keep utility signatures stable so proxy fallback does not touch UI or workflow state code. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `Classification` ↔ OpenVerse dialog | Props: `open`, `onClose`, `onImageImported(canvas)` or `onResultSelected(result)`. | Prefer passing back the final canvas so `Classification` keeps class mutation ownership. |
| OpenVerse dialog ↔ client utility | Function calls with `AbortSignal`. | Dialog owns request lifecycle; client owns HTTP details. |
| OpenVerse dialog ↔ import utility | Function call returning `HTMLCanvasElement`. | Dialog owns importing UI; import utility owns browser/CORS mechanics. |
| `TrainingData` ↔ `Classification` | Existing `setDataIx` callback. | No change required in `TrainingData` unless source button placement needs layout support. |
| Imported sample ↔ trainer/save/preview | Existing `IClassification.samples` canvas contract. | No metadata persistence in v1; revisit only with attribution requirement. |

## Sources

- Existing project requirements: `.planning/PROJECT.md`
- Existing codebase architecture: `.planning/codebase/ARCHITECTURE.md`
- Existing codebase structure: `.planning/codebase/STRUCTURE.md`
- Existing testing patterns: `.planning/codebase/TESTING.md`
- Existing class/sample contract: `src/state.ts`, `src/workflow/TrainingData/TrainingData.tsx`, `src/workflow/ClassEntry/Classification.tsx`
- Existing dataset picker pattern: `src/components/DatasetPicker/DatasetPicker.tsx`
- Official OpenVerse API client documentation: https://docs.openverse.org/packages/js/api_client/index.html
- Official OpenVerse API location note: https://docs.openverse.org/api/index.html

---
*Architecture research for: OpenVerse image search integration*
*Researched: 2026-05-06*
