# Phase 3: Training Workflow Integration - Research

**Researched:** 2026-05-07  
**Domain:** React/Jotai training-data workflow integration  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- Phase 4 validates real OpenVerse searches, real remote image CORS/canvas readability, project save/load, and browser training with imported samples.
- Product-reviewed translations beyond German/English fallback copy remain outside this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Each image class training area offers an OpenVerse image-search entry point alongside existing camera/file sample options. | Wire a `VerticalButton` into the existing inactive sample action list in `Classification.tsx` beside webcam/upload, and guard it with `!isAudio`. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:399] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:414] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:62] |
| TRAIN-01 | Clicking a usable OpenVerse result adds the converted image to the selected class as a normal trainable image sample. | Call `importOpenVerseImage`, then prepend `{ data: canvas, id: '' }` through the existing class updater only after import resolves. [VERIFIED: src/util/openverseImageImport.ts:171] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:215] |
| TRAIN-02 | Imported OpenVerse samples appear in the existing class sample list/count immediately after successful import. | Existing rendering derives both the count text and sample list from `data.samples`, so prepending through `setData` updates both surfaces. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:386] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:445] |
| TRAIN-03 | Existing sample deletion, movement, project save/load, and model training continue to work with OpenVerse-imported samples. | Existing delete/move/save/load/train paths operate on generic `samples` entries and do not inspect sample source metadata. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:244] [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:132] [VERIFIED: src/workflow/ImageWorkspace/loader.ts:17] [VERIFIED: src/util/TeachableModel.tsx:262] |
| TRAIN-04 | A stale or slow OpenVerse search/import cannot add an image to the wrong class after class state changes. | Guard the functional class update by captured class index plus captured label, and harden `setDataIx` so invalid indexes return old state unchanged. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:28] |
| TRAIN-05 | OpenVerse search is only available for image-class training workflows and does not appear in non-image variants unless explicitly enabled later. | `Classification` already computes `isAudio` from `modelVariant === 'speech'`; use that existing branch to hide the OpenVerse button for speech/audio. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:51] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:62] |
| TEST-04 | Integration tests cover adding a selected OpenVerse result to the intended class while leaving other classes unchanged. | Add focused RTL tests around `Classification` and/or `TrainingData`, mocking the OpenVerse search/import boundaries and asserting class-specific sample mutation. [VERIFIED: src/workflow/ClassEntry/Classification.test.tsx:1] [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:1] |
</phase_requirements>

## Summary

Phase 3 should be implemented in the existing `Classification` class card, not in `OpenVerseSearchDialog`, because Phase 2 deliberately stops at `onUseImage(result)` and contains no class-state or import mutation code. [VERIFIED: .planning/phases/02-student-search-ui/02-01-SUMMARY.md] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:32] The class card already owns webcam, upload, drag/drop, dataset insertion, sample deletion, class disable state, and per-class `setData` calls, making it the narrowest integration boundary for a class-scoped image-source action. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:72] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:117] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:210] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:284]

The success path should be: student clicks `Bildsuche`, `Classification` opens `OpenVerseSearchDialog` with the current class label, dialog calls `onUseImage(result)`, parent awaits `importOpenVerseImage({ imageUrl: result.imageUrl, fallbackUrl: result.thumbnailUrl, signal })`, then parent prepends `{ data: canvas, id: '' }` to the target class. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:162] [VERIFIED: src/util/openverseImageImport.ts:4] [VERIFIED: src/util/openverseImageImport.ts:171] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:215] On import failure or stale target detection, the parent must reject `onUseImage`; the dialog already catches rejected `onUseImage` and renders the localized failed-use state while staying open. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:304] [VERIFIED: public/locales/de-DE/image_adv.json:126]

**Primary recommendation:** Add the `Bildsuche` button and import handler in `Classification.tsx`, keep `OpenVerseSearchDialog` as the reusable UI boundary, and add a small stale-target guard to `TrainingData.setDataIx`. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:399] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:32] [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49]

## Project Constraints (from AGENTS.md)

- Prefer existing React, Material UI, Jotai, Vite, Vitest, and workflow-component patterns. [CITED: AGENTS.md]
- Keep OpenVerse API handling isolated behind a small typed local client. [CITED: AGENTS.md]
- Keep remote image loading/conversion isolated behind a testable import boundary. [CITED: AGENTS.md]
- Convert and validate remote images before mutating class sample state. [CITED: AGENTS.md]
- Make failed API/image/CORS/rate-limit cases recoverable and leave class state unchanged. [CITED: AGENTS.md]
- Add focused tests for new client, importer, UI, and class-state integration behavior. [CITED: AGENTS.md]
- Keep the search flow class-scoped and visually simple. [CITED: AGENTS.md]
- Show image results first; do not show license, attribution, creator, source, or advanced filter controls in v1. [CITED: AGENTS.md]
- Use the action label `Dieses Bild nutzen` for selected images, with hover plus keyboard/touch access. [CITED: AGENTS.md]
- Keep German classroom-facing strings concise and localized through the existing i18n setup. [CITED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| OpenVerse entry point | Browser / Client | — | The class-card action is local React UI inside the existing SPA workflow. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:314] |
| Search dialog state | Browser / Client | OpenVerse API | The dialog owns query, results, pagination, search errors, and neutral `onUseImage`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:49] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:71] |
| Remote image conversion | Browser / Client | Remote image host | `importOpenVerseImage` loads an image, draws it into canvas, validates readback, and returns only a canvas. [VERIFIED: src/util/openverseImageImport.ts:76] [VERIFIED: src/util/openverseImageImport.ts:133] |
| Class sample mutation | Browser / Client | Jotai state | `TrainingData` receives `data` and `setData`, passes a class-scoped updater to `Classification`, and the workspace binds those props to `classState`. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:12] [VERIFIED: src/workflow/ImageWorkspace/Workspace.tsx:62] [VERIFIED: src/workflow/ImageWorkspace/Workspace.tsx:201] |
| Save/load/training compatibility | Browser / Client | `@genai-fi/classifier` | Save/load/training consume the existing sample arrays and sample `data` values, so OpenVerse samples must use that existing shape. [VERIFIED: src/workflow/ImageWorkspace/ShareProtocol.tsx:25] [VERIFIED: src/workflow/ImageWorkspace/loader.ts:17] [VERIFIED: src/util/TeachableModel.tsx:262] |

## Standard Stack

### Core

| Library | Installed Version | Registry Version Checked | Purpose | Why Standard |
|---------|-------------------|--------------------------|---------|--------------|
| React | 19.2.4 | 19.2.6, modified 2026-05-06 | Component state and event handling. [VERIFIED: npm ls] [VERIFIED: npm registry] | Existing app framework; no phase need to upgrade. [VERIFIED: package.json] |
| Material UI | 7.3.8 | 9.0.1, modified 2026-05-07 | Dialog/button/icon UI primitives. [VERIFIED: npm ls] [VERIFIED: npm registry] | Existing UI stack; `Classification` and dialog already use MUI icons/components. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:7] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:2] |
| Jotai | 2.18.0 | 2.20.0, modified 2026-05-06 | Global class/model state. [VERIFIED: npm ls] [VERIFIED: npm registry] | Existing `classState` atom backs the training data workflow. [VERIFIED: src/state.ts:36] |
| react-i18next | 15.7.4 | 17.0.6, modified 2026-04-27 | Localized workflow copy. [VERIFIED: npm ls] [VERIFIED: npm registry] | Existing components use `useTranslation(namespace)`, and Phase 2 added `trainingdata.openverse.*` keys. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:52] [VERIFIED: public/locales/de-DE/image_adv.json:110] |
| Vitest + React Testing Library | Vitest 3.2.4, RTL 16.3.2 | Vitest 4.1.5, RTL 16.3.2 | Component/unit tests. [VERIFIED: npm ls] [VERIFIED: npm registry] | Existing tests and `vite.config.ts` use Vitest with jsdom and Testing Library. [VERIFIED: vite.config.ts:15] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:1] |

### Supporting

| Library / Module | Version | Purpose | When to Use |
|------------------|---------|---------|-------------|
| `src/util/openverse.ts` | Local Phase 1 module | OpenVerse image search and normalized result type. [VERIFIED: .planning/phases/01-openverse-client-import-boundary/01-openverse-client-import-boundary-01-SUMMARY.md] | Use only through `OpenVerseSearchDialog`'s existing default `searchClient`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:45] |
| `src/util/openverseImageImport.ts` | Local Phase 1 module | Remote image-to-canvas import with timeout, fallback, bounds, and readback validation. [VERIFIED: src/util/openverseImageImport.ts:1] [VERIFIED: src/util/openverseImageImport.ts:145] | Use in Phase 3 parent handler before any class-state mutation. [CITED: AGENTS.md] |
| `@mui/icons-material/ImageSearch` | 7.3.8 installed | Image/search icon for the `Bildsuche` action. [VERIFIED: node_modules/@mui/icons-material/ImageSearch.js] | Use for the new class-card `VerticalButton`; package is already installed. [VERIFIED: npm ls] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Classification` owns dialog/import state | `TrainingData` owns one global dialog | Global ownership makes stale class routing harder because `OpenVerseSearchDialog` is launched from a specific card and `Classification` already owns per-class insertion patterns. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:210] [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:181] |
| `importOpenVerseImage` | Directly create sample from result thumbnail URL | Direct URL storage would not match existing trainable sample shape; training calls `tm.addExample(i, s.data)` with the sample `data` value. [VERIFIED: src/state.ts:7] [VERIFIED: src/util/TeachableModel.tsx:262] |
| Parent rejection for failure UX | Add new failure UI in `Classification` | The dialog already maps rejected `onUseImage` to a per-result German failed-use state and keeps the dialog open. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:304] |

**Installation:** No new packages should be installed for Phase 3. [VERIFIED: package.json] [VERIFIED: npm ls]

**Version verification:** Current installed and registry versions were checked with `npm ls react @mui/material @mui/icons-material vitest @testing-library/react react-i18next jotai --depth=0` and `npm view ... version time.modified`. [VERIFIED: terminal command]

## Architecture Patterns

### System Architecture Diagram

```text
Student clicks Bildsuche
        |
        v
Classification.tsx opens OpenVerseSearchDialog for captured class label
        |
        v
OpenVerseSearchDialog submits query -> searchOpenVerseImages -> OpenVerse API
        |
        v
Student activates "Dieses Bild nutzen"
        |
        v
Classification.tsx onUseImage handler
        |
        +--> importOpenVerseImage(imageUrl, fallbackUrl, signal)
        |        |
        |        +--> success: readable bounded HTMLCanvasElement
        |        |        |
        |        |        v
        |        |   stale guard checks captured class index/label
        |        |        |
        |        |        +--> valid target: prepend { data: canvas, id: '' }
        |        |        +--> invalid/stale target: reject, no state mutation
        |        |
        |        +--> failure: reject typed/import error
        |
        v
OpenVerseSearchDialog either clears pending state or shows failed-use state
```

All arrows above are derived from existing component boundaries and Phase 3 decisions. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:36] [VERIFIED: src/util/openverseImageImport.ts:171] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:34] [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]

### Recommended Project Structure

```text
src/
├── workflow/
│   ├── ClassEntry/
│   │   ├── Classification.tsx              # add button, dialog state, import-to-sample handler
│   │   ├── Classification.test.tsx         # button visibility, success/failure/stale class tests
│   │   └── classification.module.css       # only add spacing/states if current button layout needs it
│   ├── TrainingData/
│   │   ├── TrainingData.tsx                # harden setDataIx for missing stale index
│   │   └── TrainingData.test.tsx           # intended-class/other-class integration tests if easier here
│   └── OpenVerseSearch/
│       └── OpenVerseSearchDialog.tsx       # reuse, avoid class-state imports
├── util/
│   └── openverseImageImport.ts             # reuse existing importer unchanged unless tests expose a gap
└── state.ts                                # no schema change expected
```

This structure follows existing files and ownership boundaries. [VERIFIED: rg --files src/workflow/ClassEntry src/workflow/TrainingData src/workflow/OpenVerseSearch src/util] [VERIFIED: .planning/phases/02-student-search-ui/02-VERIFICATION.md]

### Pattern 1: Class-Local Dialog Ownership

**What:** Add local `showOpenVerseDialog` state to `Classification`, render `OpenVerseSearchDialog` near the existing `DatasetPicker`, and pass `className={name}` plus a class-local `onUseImage`. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:58] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:465] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:32]

**When to use:** Use this because the button belongs in one class card and the selected result should mutate one class. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]

**Example:**

```tsx
// Source: src/workflow/ClassEntry/Classification.tsx existing insertion pattern
setData(
    (data) => ({
        label: data.label,
        samples: [{ data: canvas, id: '' }, ...data.samples],
    }),
    index
);
```

The example mirrors the existing webcam/upload/dataset sample shape. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:215] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:101] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:287]

### Pattern 2: Reject to Reuse Dialog Failure UX

**What:** Let `OpenVerseSearchDialog` handle failed imports by rejecting `onUseImage`; do not add a second error modal for OpenVerse imports. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:304]

**When to use:** Use this for importer failures, aborts, and stale-target discards so the dialog stays open and the selected tile shows the concise German failure. [VERIFIED: public/locales/de-DE/image_adv.json:126] [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]

**Example:**

```tsx
// Source: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx onUseImage contract
try {
    await onUseImage(result);
} catch {
    setFailedUseIds((current) => new Set(current).add(result.id));
}
```

This is already implemented in the dialog. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]

### Pattern 3: Stale Target Guard

**What:** Capture the class index and class label when `onUseImage` starts, then validate that the class slot still exists and still has the same label inside the functional update. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:28] [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49]

**When to use:** Use this before prepending the sample so deleted or shifted classes cannot receive a slow import. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]

**Example:**

```tsx
// Source: Phase 3 research recommendation based on existing setDataIx shape
const targetIndex = index;
const targetLabel = data.label;
const canvas = await importOpenVerseImage({
    imageUrl: result.imageUrl,
    fallbackUrl: result.thumbnailUrl,
    signal: controller.signal,
});

let inserted = false;
setData((current) => {
    if (current.label !== targetLabel) return current;
    inserted = true;
    return {
        label: current.label,
        disabled: current.disabled,
        samples: [{ data: canvas, id: '' }, ...current.samples],
    };
}, targetIndex);

if (!inserted) throw new Error('stale-openverse-import-target');
```

The guard should preserve `disabled` because `IClassification` includes an optional disabled field and existing updates sometimes omit it. [VERIFIED: src/state.ts:11] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:301]

### Anti-Patterns to Avoid

- **Mutating class state before import resolves:** The importer verifies canvas readability before returning, and project constraints require conversion before class mutation. [VERIFIED: src/util/openverseImageImport.ts:145] [CITED: AGENTS.md]
- **Adding OpenVerse state into `state.ts`:** Phase 3 can use component-local pending/dialog state; `state.ts` only needs the existing sample shape. [VERIFIED: src/state.ts:7] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:49]
- **Showing metadata or filters in the class card:** v1 explicitly excludes visible license/attribution/advanced filters. [CITED: AGENTS.md] [VERIFIED: .planning/REQUIREMENTS.md]
- **Adding OpenVerse button to speech/audio classes:** `isAudio` already branches speech behavior; Phase 3 must use the same guard. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:62]
- **Relying on class index alone:** Class deletion can shift indexes; label validation and invalid-index protection are needed for TRAIN-04. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:62] [VERIFIED: .planning/REQUIREMENTS.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenVerse search client | New `fetch` call from `Classification` | `OpenVerseSearchDialog` default `searchOpenVerseImages` path | The client and UI already normalize search, pagination, errors, and stale search responses. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:45] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:71] |
| Remote image conversion | Direct `<img>`/URL sample insertion | `importOpenVerseImage` | The importer applies timeout, CORS mode, fallback URL, bounds, decode, draw, and readback validation. [VERIFIED: src/util/openverseImageImport.ts:76] [VERIFIED: src/util/openverseImageImport.ts:123] [VERIFIED: src/util/openverseImageImport.ts:145] |
| Failure UI | New modal/snackbar for per-result failures | Dialog rejection/failed-use mechanism | The dialog already renders a per-result failed-use status after rejected `onUseImage`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173] |
| Sample shape | New OpenVerse sample type | Existing `ISample` `{ data, id }` | Save/load/training/sample preview paths already consume this shape. [VERIFIED: src/state.ts:7] [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:211] |
| Image/search icon | Custom SVG | `@mui/icons-material/ImageSearch` | The icon exists in the installed MUI icon package and matches the existing icon-button pattern. [VERIFIED: node_modules/@mui/icons-material/ImageSearch.js] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:7] |

**Key insight:** Phase 3 is a wiring and stale-state problem, not a new search/import problem, because Phase 1 already owns validated canvas conversion and Phase 2 already owns the reusable image-only dialog. [VERIFIED: .planning/phases/01-openverse-client-import-boundary/01-VERIFICATION.md] [VERIFIED: .planning/phases/02-student-search-ui/02-VERIFICATION.md]

## Common Pitfalls

### Pitfall 1: Adding to the Wrong Class After Deletion

**What goes wrong:** A slow import resolves after a class was deleted, and the captured index now points at a different class. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:62]  
**Why it happens:** `setDataIx` currently writes `newdata[ix] = samples(data[ix])` without checking that `ix` still exists. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49]  
**How to avoid:** Update `setDataIx` to return old state when `!data[ix]`, and make the Phase 3 updater return the current class unchanged if `current.label !== capturedLabel`. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49]  
**Warning signs:** Tests that delete a class during a pending import either throw or mutate the remaining class. [VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 2: Failure State Disappears Into Parent Component

**What goes wrong:** Parent catches importer errors and only logs them, so the dialog resolves successfully and the tile does not show `failedUse`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]  
**Why it happens:** The dialog treats rejected `onUseImage` as the signal to render failed-use state. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]  
**How to avoid:** Let import errors and stale-target errors reject from `onUseImage`; do not swallow them in `Classification`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]  
**Warning signs:** Test clicks a result with mocked importer rejection and cannot find `trainingdata.openverse.failedUse`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:350]

### Pitfall 3: Losing `disabled` During Sample Insert

**What goes wrong:** A disabled class becomes enabled after OpenVerse import because the class update returns only `{ label, samples }`. [VERIFIED: src/state.ts:11]  
**Why it happens:** Several existing sample insertions omit `disabled`; this was harmless for normal enabled classes but is risky when adding new code near disabled-class support. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:101] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:301]  
**How to avoid:** Preserve `...current` or explicitly include `disabled: current.disabled` in the OpenVerse insert updater. [VERIFIED: src/state.ts:11]  
**Warning signs:** A test disables a class, imports, and finds `disabled` missing from the updated class object. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:301]

### Pitfall 4: Testing Canvas Rendering Without jsdom Canvas Mocks

**What goes wrong:** Existing tests may pass while printing jsdom `HTMLCanvasElement.prototype.getContext` not-implemented errors. [VERIFIED: test run 2026-05-07]  
**Why it happens:** `Sample` calls `getContext('2d')` in an effect when rendering a canvas sample. [VERIFIED: src/workflow/ClassEntry/Sample.tsx:34]  
**How to avoid:** In new integration tests that render sample canvases, spy/mock `HTMLCanvasElement.prototype.getContext` with a minimal `clearRect`/`drawImage` object or assert state updates without rendering `Sample` where possible. [VERIFIED: src/workflow/ClassEntry/Sample.tsx:34] [VERIFIED: src/setupTests.ts:1]  
**Warning signs:** Focused tests pass but stderr includes jsdom not-implemented stack traces. [VERIFIED: test run 2026-05-07]

## Code Examples

### Add the Button Beside Existing Actions

```tsx
// Source: src/workflow/ClassEntry/Classification.tsx action-list pattern
{!isAudio && (
    <li className={style.sample} style={{ display: !active ? undefined : 'none' }}>
        <VerticalButton
            data-testid="openversebutton"
            variant="outlined"
            startIcon={<ImageSearchIcon />}
            onClick={doOpenVerseClick}
        >
            {t('trainingdata.actions.openverse')}
        </VerticalButton>
    </li>
)}
```

The button should sit near existing webcam/upload action tiles. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:399] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:414]

### Parent Import Handler

```tsx
// Source: Phase 3 recommended wiring using Phase 1/2 contracts
const handleUseOpenVerseImage = useCallback(
    async (result: OpenVerseImageResult) => {
        const targetIndex = index;
        const targetLabel = data.label;
        const canvas = await importOpenVerseImage({
            imageUrl: result.imageUrl,
            fallbackUrl: result.thumbnailUrl,
        });

        let inserted = false;
        setData((current) => {
            if (current.label !== targetLabel) return current;
            inserted = true;
            return {
                ...current,
                samples: [{ data: canvas, id: '' }, ...current.samples],
            };
        }, targetIndex);

        if (!inserted) throw new Error('stale-openverse-import-target');
        setShowOpenVerseDialog(false);
    },
    [data.label, index, setData]
);
```

This uses the importer contract and existing sample shape. [VERIFIED: src/util/openverseImageImport.ts:171] [VERIFIED: src/state.ts:7]

### Harden `setDataIx`

```tsx
// Source: src/workflow/TrainingData/TrainingData.tsx existing helper
const setDataIx = useCallback(
    (samples: (old: IClassification) => IClassification, ix: number) => {
        setData((data) => {
            if (!data[ix]) return data;
            const newdata = [...data];
            newdata[ix] = samples(data[ix]);
            return newdata;
        });
    },
    [setData]
);
```

This prevents stale invalid indexes from throwing or creating sparse arrays. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 1 had no UI; only search/import utilities. | Phase 2 added `OpenVerseSearchDialog` with neutral `onUseImage`. | 2026-05-06 Phase 2 | Phase 3 should not duplicate search UI or API state. [VERIFIED: .planning/phases/02-student-search-ui/02-01-SUMMARY.md] |
| Valid empty OpenVerse results could have been modeled as errors. | Valid `results: []` is successful empty state. | 2026-05-06 Phase 1 verification override | Phase 3 only needs to handle selected-result import failures, not empty search results. [VERIFIED: .planning/phases/01-openverse-client-import-boundary/01-VERIFICATION.md] |
| Existing image sample sources are webcam/upload/drop/dataset. | OpenVerse becomes a third visible source beside webcam/upload, while dataset remains in the class menu. | Phase 3 planned | Button placement should be in the sample action list, not the overflow menu. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:399] [VERIFIED: src/workflow/ClassEntry/Classification.tsx:325] |

**Deprecated/outdated:** No deprecated framework feature was found in the Phase 3 path. The app intentionally stays on installed React/MUI/Vitest versions instead of upgrading to registry latest during this integration phase. [VERIFIED: npm ls] [VERIFIED: npm registry]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

All claims in this research were verified from repository files, phase artifacts, test runs, npm registry/version commands, or AGENTS.md. No `[ASSUMED]` claims are intentionally relied on. [VERIFIED: terminal command] [CITED: AGENTS.md]

## Open Questions (RESOLVED)

1. **RESOLVED: Should success close the dialog?**
   - What we know: Failure must keep the dialog open, and the requirement says the sample appears immediately in the existing list/count. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md] [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: The context does not explicitly say whether a successful import should leave the dialog open for repeated single-image imports. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]
   - Decision: Close on success after state mutation so the student sees the updated class card immediately; keep failure open via the dialog's rejected-callback path. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:157] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]

2. **RESOLVED: Should stale detection reject class renames during import?**
   - What we know: Phase context says discard stale imports if class state changed or the target class is no longer valid. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md]
   - What's unclear: A class rename may represent the same visual card, but it changes the class identity visible to the student. [VERIFIED: src/workflow/ClassEntry/Classification.tsx:193]
   - Decision: Treat a changed label at the captured index as stale for v1, because it is safer than adding a slow result into a class with changed visible identity. [VERIFIED: .planning/REQUIREMENTS.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | npm/Vite/Vitest execution | Yes | v22.17.0 | None needed. [VERIFIED: terminal command] |
| npm | Package scripts and version checks | Yes | 10.9.2 | None needed. [VERIFIED: terminal command] |
| Vitest/jsdom | Automated integration tests | Yes | Vitest 3.2.4 installed | Use existing `npm test -- ... --run`. [VERIFIED: npm ls] |
| ripgrep | Source audit/search | Yes | 15.1.0 | Shell alternatives if unavailable. [VERIFIED: terminal command] |
| OpenVerse API | Live search through dialog | Network path not live-validated in this phase | — | Mock in tests; Phase 4 performs real browser validation. [VERIFIED: .planning/ROADMAP.md] |

**Missing dependencies with no fallback:** None found for Phase 3 implementation and automated tests. [VERIFIED: terminal command]

**Missing dependencies with fallback:** Real OpenVerse/provider CORS behavior is not validated by jsdom and is deferred to Phase 4 live browser validation. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/phases/01-openverse-client-import-boundary/01-VERIFICATION.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 with jsdom and React Testing Library 16.3.2. [VERIFIED: npm ls] |
| Config file | `vite.config.ts`, `src/setupTests.ts`. [VERIFIED: vite.config.ts:15] [VERIFIED: src/setupTests.ts:1] |
| Quick run command | `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx src/util/openverseImageImport.test.ts --run`. [VERIFIED: test run 2026-05-07] |
| Full suite command | `npm run ci:test`. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| UI-01 | `Bildsuche` appears beside webcam/upload for image classes and is hidden for speech classes. | component | `npm test -- src/workflow/ClassEntry/Classification.test.tsx --run` | Exists; needs Phase 3 cases. [VERIFIED: src/workflow/ClassEntry/Classification.test.tsx:1] |
| TRAIN-01 | Selecting a result imports a canvas and inserts `{ data: canvas, id: '' }`. | component/integration | `npm test -- src/workflow/ClassEntry/Classification.test.tsx --run` | Exists; needs Phase 3 cases. [VERIFIED: src/workflow/ClassEntry/Classification.test.tsx:1] |
| TRAIN-02 | Sample list/count update after successful import. | component/integration | `npm test -- src/workflow/TrainingData/TrainingData.test.tsx --run` | Exists; needs Phase 3 cases. [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1] |
| TRAIN-03 | Imported sample remains deletable/movable and has compatible shape. | component/integration | `npm test -- src/workflow/TrainingData/TrainingData.test.tsx src/workflow/ClassEntry/Classification.test.tsx --run` | Existing files; add focused coverage. [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1] [VERIFIED: src/workflow/ClassEntry/Classification.test.tsx:1] |
| TRAIN-04 | Stale/deleted/renamed target class does not receive import. | component/integration | `npm test -- src/workflow/TrainingData/TrainingData.test.tsx --run` | Exists; needs Phase 3 cases. [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1] |
| TRAIN-05 | OpenVerse action hidden in speech/audio workflow. | component | `npm test -- src/workflow/ClassEntry/Classification.test.tsx --run` | Exists; needs custom variant wrapper case. [VERIFIED: src/util/variant.ts:6] |
| TEST-04 | Intended class changes; other classes unchanged. | component/integration | `npm test -- src/workflow/TrainingData/TrainingData.test.tsx --run` | Exists; needs Phase 3 cases. [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1] |

### Sampling Rate

- **Per task commit:** Run the focused file(s) touched by the task. [VERIFIED: package.json]
- **Per wave merge:** Run `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx src/util/openverseImageImport.test.ts --run`. [VERIFIED: test run 2026-05-07]
- **Phase gate:** Run `npm run lint && npm run build && npm run ci:test` before verification. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `src/workflow/ClassEntry/Classification.test.tsx` needs tests for button visibility, dialog opening with class label, successful import, failed import, and speech hidden state. [VERIFIED: src/workflow/ClassEntry/Classification.test.tsx:1]
- [ ] `src/workflow/TrainingData/TrainingData.test.tsx` needs intended-class and stale/deleted-class integration tests. [VERIFIED: src/workflow/TrainingData/TrainingData.test.tsx:1]
- [ ] Canvas rendering tests should mock `getContext` to avoid jsdom not-implemented stderr. [VERIFIED: test run 2026-05-07] [VERIFIED: src/workflow/ClassEntry/Sample.tsx:34]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | OpenVerse browser search/import is anonymous and Phase 1 introduced no credentials. [VERIFIED: .planning/phases/01-openverse-client-import-boundary/01-VERIFICATION.md] |
| V3 Session Management | No | Phase 3 does not add sessions or authentication state. [VERIFIED: src/state.ts] |
| V4 Access Control | No | Phase 3 mutates only client-side class state in the current browser session. [VERIFIED: src/state.ts:36] |
| V5 Input Validation | Yes | Use Phase 1 URL support checks and canvas readback validation before state mutation. [VERIFIED: src/util/openverseImageImport.ts:38] [VERIFIED: src/util/openverseImageImport.ts:145] |
| V6 Cryptography | No | Phase 3 does not add encryption, signatures, or secrets. [VERIFIED: .planning/REQUIREMENTS.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Remote image canvas taint or decode failure | Tampering / Denial of Service | Use `importOpenVerseImage`; reject and leave class state unchanged on failure. [VERIFIED: src/util/openverseImageImport.ts:145] [CITED: AGENTS.md] |
| Stale async mutation to wrong class | Tampering | Capture class index/label and verify target before inserting sample. [VERIFIED: .planning/phases/03-training-workflow-integration/03-CONTEXT.md] |
| Metadata leakage into v1 UI | Information Disclosure / Scope creep | Reuse `OpenVerseSearchDialog` image-only rendering and do not add metadata display in `Classification`. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:282] [CITED: AGENTS.md] |
| Excessive repeated clicks | Denial of Service / Integrity | Dialog already blocks duplicate pending use for the same result ID; parent should avoid swallowing promise rejections. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:162] |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Real provider image cannot be read into canvas due to CORS/provider policy. | MEDIUM | Selected images may fail to import in live classroom use. | Keep failure recoverable in Phase 3; validate real browser behavior in Phase 4. [VERIFIED: .planning/STATE.md] [VERIFIED: .planning/ROADMAP.md] |
| Stale class index inserts into wrong class. | MEDIUM | Violates TRAIN-04 and corrupts student training data. | Guard by captured index plus class label; harden invalid index in `setDataIx`. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49] |
| Existing sample insertions omit `disabled`, and new insertion could repeat that omission. | LOW | Disabled class state may be lost after import. | Use `{ ...current, samples: [...] }` for OpenVerse insertion. [VERIFIED: src/state.ts:11] |
| Successful import closes dialog before state update is observable in tests. | LOW | Test flake or poor feedback. | Await importer, perform synchronous state update, then close dialog. [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:157] |
| Touch/hover visual affordance remains unverified in integrated workflow. | MEDIUM | Classroom touch users may not discover `Dieses Bild nutzen`. | Carry deferred Phase 2 browser visual/touch check into Phase 3/4 once button is reachable. [VERIFIED: .planning/phases/02-student-search-ui/02-VERIFICATION.md] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project workflow, architecture, UX, and testing constraints. [CITED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` - product scope, requirements, phase order, and current state. [VERIFIED: codebase]
- `.planning/phases/03-training-workflow-integration/03-CONTEXT.md` - locked Phase 3 decisions and deferred ideas. [VERIFIED: codebase]
- `.planning/phases/01-openverse-client-import-boundary/*SUMMARY.md`, `01-VERIFICATION.md`, `01-VALIDATION.md` - Phase 1 contracts and verification. [VERIFIED: codebase]
- `.planning/phases/02-student-search-ui/*SUMMARY.md`, `02-VERIFICATION.md`, `02-VALIDATION.md` - Phase 2 dialog contract and verification. [VERIFIED: codebase]
- `src/workflow/ClassEntry/Classification.tsx`, `classification.module.css`, `Sample.tsx`, tests - class-card integration surface. [VERIFIED: codebase]
- `src/workflow/TrainingData/TrainingData.tsx`, tests - class list and state updater surface. [VERIFIED: codebase]
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx`, tests - reusable search UI and failure callback behavior. [VERIFIED: codebase]
- `src/util/openverseImageImport.ts`, tests - validated import boundary. [VERIFIED: codebase]
- `src/state.ts` - sample/class state shape. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- npm registry version checks for React, MUI, MUI icons, Jotai, react-i18next, Vitest, and React Testing Library. [VERIFIED: npm registry]
- Focused test run: `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx src/util/openverseImageImport.test.ts --run`, 28 tests passed with jsdom canvas stderr noted. [VERIFIED: test run 2026-05-07]

### Tertiary (LOW confidence)

- None. [VERIFIED: codebase]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions were checked through `npm ls` and npm registry commands, and no new dependency is required. [VERIFIED: npm ls] [VERIFIED: npm registry]
- Architecture: HIGH - integration boundaries are directly visible in existing Phase 1/2 artifacts and source files. [VERIFIED: codebase]
- Pitfalls: HIGH - stale state and failure UX risks are grounded in current updater/dialog code and phase requirements. [VERIFIED: src/workflow/TrainingData/TrainingData.tsx:49] [VERIFIED: src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:173]

**Research date:** 2026-05-07  
**Valid until:** 2026-06-06 for local architecture; re-check npm registry versions before dependency changes. [VERIFIED: npm registry]
