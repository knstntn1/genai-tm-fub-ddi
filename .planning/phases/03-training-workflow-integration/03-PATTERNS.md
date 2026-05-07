# Phase 3: Training Workflow Integration - Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 6 new/modified files
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/workflow/ClassEntry/Classification.tsx` | component | event-driven, request-response | `src/workflow/ClassEntry/Classification.tsx` existing webcam/upload/drop handlers | exact |
| `src/workflow/ClassEntry/classification.module.css` | component style | transform | `src/workflow/ClassEntry/classification.module.css` existing sample/action-list styles | exact |
| `src/workflow/TrainingData/TrainingData.tsx` | component | CRUD, event-driven | `src/workflow/TrainingData/TrainingData.tsx` existing `setDataIx`, delete, move handlers | exact |
| `src/workflow/ClassEntry/Classification.test.tsx` | test | event-driven | `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx` and existing `Classification.test.tsx` | role-match |
| `src/workflow/TrainingData/TrainingData.test.tsx` | test | CRUD, event-driven | `src/workflow/TrainingData/TrainingData.test.tsx` and `SamplePreviewModal.test.tsx` | exact |
| `public/locales/de-DE/image_adv.json`, `public/locales/en-GB/image_adv.json` | config | transform | existing `trainingdata.actions` and `trainingdata.openverse` keys | exact |

## Pattern Assignments

### `src/workflow/ClassEntry/Classification.tsx` (component, event-driven/request-response)

**Analog:** `src/workflow/ClassEntry/Classification.tsx`

**Imports pattern** (lines 1-23):
```typescript
import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import style from './classification.module.css';
import { IClassification, fatalWebcam } from '@genaitm/state';
import { VerticalButton } from '@genaitm/components/button/Button';
import Sample from './Sample';
import WebcamCapture from './WebcamCapture';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import UploadFileIcon from '@mui/icons-material/UploadFile';
```

Copy this import style for Phase 3: add `ImageSearchIcon` from `@mui/icons-material/ImageSearch`, `OpenVerseSearchDialog` from the sibling workflow folder, `importOpenVerseImage` from `@genaitm/util/openverseImageImport`, and `type OpenVerseImageResult` from `@genaitm/util/openverse`. Keep CSS module and state/type imports in the existing order.

**Variant/localization guard pattern** (lines 51-64):
```typescript
const { namespace, sampleUploadFile, disableClassNameEdit, showDragTip, modelVariant } = useVariant();
const { t } = useTranslation(namespace);
const fileRef = useRef<HTMLInputElement>(null);
const scrollRef = useRef<HTMLOListElement>(null);
const [loading, setLoading] = useState(false);
const [showTip, setShowTip] = useState(false);
const [showDropError, setShowDropError] = useState(false);
const [showDatasetPicker, setShowDatasetPicker] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const fatal = useAtomValue(fatalWebcam);

const isAudio = modelVariant === 'speech';
```

Add local dialog/import state here, and gate `Bildsuche` with `!isAudio`. Do not add OpenVerse state to `src/state.ts`.

**Button placement pattern** (lines 395-428):
```tsx
<ol
    ref={scrollRef}
    className={active ? style.samplelistLarge : style.samplelistSmall}
>
    <li
        className={style.sample}
        style={{ display: !active ? undefined : 'none' }}
    >
        <VerticalButton
            data-testid="webcambutton"
            variant="outlined"
            startIcon={isAudio ? <MicIcon /> : <VideocamIcon />}
            onClick={doActivate}
            disabled={fatal}
        >
            {t(isAudio ? 'trainingdata.actions.audio' : 'trainingdata.actions.webcam')}
        </VerticalButton>
    </li>

    {sampleUploadFile && (
        <li
            className={style.sample}
            style={{ display: !active ? undefined : 'none' }}
        >
            <VerticalButton
                data-testid="uploadbutton"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={doUploadClick}
            >
                {t('trainingdata.actions.upload')}
            </VerticalButton>
        </li>
    )}
```

Insert the OpenVerse action as a third `li className={style.sample}` in this same `ol`, after upload when `sampleUploadFile` is true. Use `VerticalButton`, `variant="outlined"`, `startIcon={<ImageSearchIcon />}`, a stable test id such as `openversebutton`, and localized text `t('trainingdata.actions.openverse')`.

**Existing successful image sample insertion pattern** (lines 210-224):
```typescript
const onCapture = useCallback(
    (image: HTMLCanvasElement) => {
        image.style.width = '58px';
        image.style.height = '58px';

        setData(
            (data) => ({
                label: name,
                samples: [{ data: image, id: '' }, ...data.samples],
            }),
            index
        );
    },
    [setData, index, name]
);
```

OpenVerse imports should use the same sample shape and front insertion, but prefer `{ ...current, samples: [...] }` to preserve `disabled`.

**File/drop importer pattern to copy for canvas sizing and batch prepend** (lines 95-107, 156-169):
```typescript
canvases.forEach((v) => {
    v.style.width = '58px';
    v.style.height = '58px';
});
setData(
    (data) => ({
        label: data.label,
        samples: [...canvases.map((c) => ({ data: c, id: '' })), ...data.samples],
    }),
    index
);
```

`importOpenVerseImage` already applies the `58px` style, but it is acceptable to set it defensively again in `Classification` before state mutation.

**Dialog state pattern** (lines 58, 271-273, 465-469):
```typescript
const [showDatasetPicker, setShowDatasetPicker] = useState(false);

const doDatasetClick = useCallback(() => setShowDatasetPicker(true), [setShowDatasetPicker]);

const doDatasetPickerClose = useCallback(() => setShowDatasetPicker(false), [setShowDatasetPicker]);

<DatasetPicker
    open={showDatasetPicker}
    onClose={doDatasetPickerClose}
    onDatasetSelected={doDatasetSelected}
/>
```

Copy this for `showOpenVerseSearch`, `doOpenVerseClick`, and `doOpenVerseClose`. Render `OpenVerseSearchDialog` beside `DatasetPicker`, not inside the sample `ol`.

**Async `onUseImage` failure and stale-class guard pattern** (compose from local patterns):
```typescript
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
        setShowOpenVerseSearch(false);
    },
    [data.label, index, setData]
);
```

Do not catch importer/stale errors in `Classification`; rejected `onUseImage` is how the dialog shows the recoverable failure state.

**Audio-only guard source** (lines 350-364 and 414-428):
```tsx
{active ? (
    isAudio ? (
        <AudioExampleRecorder
            className={data.label}
            onExample={onAudioExample}
            onClose={doCloseWebcam}
            blob={audioBlob ?? undefined}
        />
    ) : (
        <WebcamCapture
            visible={true}
            onCapture={onCapture}
            onClose={doCloseWebcam}
        />
    )
) : null}
```

The OpenVerse button belongs only in the inactive image branch: `{!isAudio && (...)}`. Speech/audio classes must not reserve space.

---

### `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` (existing component, async callback analog)

**Analog:** `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx`

**Reusable dialog API** (lines 32-38):
```typescript
interface Props {
    open: boolean;
    className: string;
    onClose: () => void;
    onUseImage: (result: OpenVerseImageResult) => void | Promise<void>;
    searchClient?: SearchClient;
}
```

`Classification` should consume this API only. Do not add class-state imports, importer calls, or sample mutation inside the dialog.

**Class-scoped title and localized close pattern** (lines 196-205):
```tsx
<DialogTitle className={styles.dialogTitle}>
    {t('trainingdata.openverse.title', { className })}
    <IconButton
        onClick={handleClose}
        aria-label={t('trainingdata.aria.close')}
        className={styles.closeButton}
    >
        <CloseIcon />
    </IconButton>
</DialogTitle>
```

Pass `className={name}` or `className={data.label}` from the class card so the title renders `OpenVerse: {{className}}`.

**Async failure contract** (lines 162-185):
```typescript
const handleUseImage = useCallback(
    async (result: OpenVerseImageResult) => {
        if (pendingUseIds.has(result.id)) return;

        setPendingUseIds((current) => new Set(current).add(result.id));
        setFailedUseIds((current) => {
            const next = new Set(current);
            next.delete(result.id);
            return next;
        });

        try {
            await onUseImage(result);
        } catch {
            setFailedUseIds((current) => new Set(current).add(result.id));
        } finally {
            setPendingUseIds((current) => {
                const next = new Set(current);
                next.delete(result.id);
                return next;
            });
        }
    },
    [onUseImage, pendingUseIds]
);
```

This is the exact failure pathway Phase 3 should reuse. Import failures, aborted imports, and stale-target discards should reject so the dialog stays open and marks the selected result failed.

**Failed-use UI pattern** (lines 290-310):
```tsx
<button
    key={result.id}
    type="button"
    className={styles.resultButton}
    onClick={() => void handleUseImage(result)}
    disabled={isPending}
    aria-label={`${t('trainingdata.openverse.useImage')}: ${accessibleTitle}`}
>
    <img
        src={result.thumbnailUrl}
        alt={accessibleTitle}
        className={styles.resultImage}
    />
    <span className={styles.resultOverlay}>{t('trainingdata.openverse.useImage')}</span>
    {hasFailed && (
        <span
            className={styles.failedUse}
            role="status"
        >
            {t('trainingdata.openverse.failedUse')}
        </span>
    )}
</button>
```

Planner should keep `Dieses Bild nutzen` behavior in this component and avoid adding extra class-card error UI.

---

### `src/util/openverseImageImport.ts` (existing utility boundary)

**Analog:** `src/util/openverseImageImport.ts`

**Importer API** (lines 4-10, 171-189):
```typescript
export interface ImportOpenVerseImageOptions {
    imageUrl: string;
    fallbackUrl?: string;
    timeoutMs?: number;
    maxSize?: number;
    signal?: AbortSignal;
}

export async function importOpenVerseImage(options: ImportOpenVerseImageOptions): Promise<HTMLCanvasElement> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS;
    const maxSize = options.maxSize ?? DEFAULT_OPENVERSE_IMPORT_MAX_SIZE;
    const loader: ImageLoader = (url, signal) => loadImage(url, timeoutMs, signal);

    try {
        return await importWithLoader(options.imageUrl, loader, maxSize, options.signal);
    } catch (error) {
        if (
            error instanceof OpenVerseImageImportError &&
            (error.code === 'aborted' || error.code === 'unsupported-image')
        ) {
            throw error;
        }
        if (!options.fallbackUrl) {
            throw error;
        }
        return importWithLoader(options.fallbackUrl, loader, maxSize, options.signal);
    }
}
```

Use this as the only remote-image conversion boundary. Call it from `Classification` after `onUseImage` starts and before mutating class state.

**Canvas validation and visual size pattern** (lines 140-155):
```typescript
const context = canvas.getContext('2d');
if (!context) {
    throw toImportError('canvas-unreadable', image.currentSrc || image.src);
}

try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.getImageData(0, 0, 1, 1);
} catch {
    throw toImportError('canvas-unreadable', image.currentSrc || image.src);
}

canvas.style.width = '58px';
canvas.style.height = '58px';

return canvas;
```

This satisfies the requirement to convert and validate before state mutation.

---

### `src/workflow/TrainingData/TrainingData.tsx` (component, CRUD/event-driven)

**Analog:** `src/workflow/TrainingData/TrainingData.tsx`

**Class-scoped update helper to harden** (lines 49-58):
```typescript
const setDataIx = useCallback(
    (samples: (old: IClassification) => IClassification, ix: number) => {
        setData((data) => {
            const newdata = [...data];
            newdata[ix] = samples(data[ix]);
            return newdata;
        });
    },
    [setData]
);
```

Modify this helper to guard invalid stale indexes:
```typescript
if (!data[ix]) return data;
```

Place the guard before copying/mutating the array. This prevents slow OpenVerse imports from creating sparse arrays or throwing if the target class was deleted.

**Classification composition pattern** (lines 181-193):
```tsx
{data.map((c, ix) => (
    <Classification
        onDelete={doDelete}
        key={ix}
        index={ix}
        name={c.label}
        active={ix === activeIndex}
        data={data[ix]}
        setData={setDataIx}
        onActivate={doActivate}
        setActive={doSetActive}
        onSampleClick={handleSampleClick}
    />
))}
```

Keep OpenVerse class mutation behind the same `setDataIx` prop. Do not lift OpenVerse dialog state into `TrainingData` unless implementation needs a global dialog, which current phase context does not.

**Sample delete pattern** (lines 107-129):
```typescript
const handleModalDelete = () => {
    if (modalState) {
        const { classIndex, imageIndex } = modalState;
        setData((oldData) => {
            const newData = [...oldData];
            newData[classIndex] = {
                ...newData[classIndex],
                samples: newData[classIndex].samples.filter((_, idx) => idx !== imageIndex),
            };
            return newData;
        });

        // Adjust modal state after delete
        const remainingCount = data[classIndex].samples.length - 1;
        if (remainingCount > 0) {
            if (imageIndex >= remainingCount) {
                setModalState({ classIndex, imageIndex: remainingCount - 1 });
            }
            // else keep the same index
        } else {
            setModalState(null);
        }
    }
};
```

Imported samples must use the same `ISample` shape so this existing delete path works unchanged.

**Sample move pattern** (lines 132-159):
```typescript
const handleMoveToClass = (toClassIndex: number) => {
    if (modalState && toClassIndex !== modalState.classIndex) {
        const { classIndex: fromClassIndex, imageIndex } = modalState;

        setData((oldData) => {
            const newData = [...oldData];
            const sampleToMove = oldData[fromClassIndex].samples[imageIndex];

            // Remove from source class
            newData[fromClassIndex] = {
                ...newData[fromClassIndex],
                samples: newData[fromClassIndex].samples.filter((_, idx) => idx !== imageIndex),
            };
            // Add to target class
            newData[toClassIndex] = {
                ...newData[toClassIndex],
                samples: [...newData[toClassIndex].samples, sampleToMove],
            };

            // Update modal state synchronously within the same update
            const newImageIndex = newData[toClassIndex].samples.length - 1;
            setModalState({
                classIndex: toClassIndex,
                imageIndex: newImageIndex,
            });

            return newData;
        });
    }
};
```

Regression tests should prove OpenVerse-imported samples can still be previewed, deleted, and moved because they are normal canvas samples.

---

### `src/state.ts` (model reference, no schema change expected)

**Analog:** `src/state.ts`

**Sample/class shape** (lines 6-15):
```typescript
export interface ISample {
    data: HTMLCanvasElement | AudioExample;
    id: string;
}

export interface IClassification {
    label: string;
    samples: ISample[];
    disabled?: boolean;
}
```

Do not add OpenVerse-specific sample metadata in Phase 3. Store imported images as `{ data: canvas, id: '' }`.

**Global class atom** (line 36):
```typescript
export const classState = atom<IClassification[]>([]);
```

No new atom is needed. OpenVerse dialog state is local to `Classification`.

---

### `src/workflow/ClassEntry/classification.module.css` (component style, transform)

**Analog:** `src/workflow/ClassEntry/classification.module.css`

**Action-list layout pattern** (lines 76-116):
```css
.samplelist {
    list-style-type: none;
    display: flex;
    flex-direction: row;
    gap: 0.3rem;
    max-width: 400px;
    padding: 1rem;
    justify-content: start;
    align-content: start;
    margin: 0;
    overflow-y: auto;
    overflow-x: scroll;
    box-sizing: border-box;
    height: 100%;
}

.samplelistSmall {
    composes: samplelist;
    flex-wrap: nowrap;
}

.sample {
    overflow: hidden;
    height: 58px;
    border-radius: 5px;
    flex-shrink: 0;
    position: relative;
    display: flex;
}
```

Prefer no CSS change: the new `VerticalButton` should fit the existing `.sample` rhythm. If `Bildsuche` clips, adjust only the minimal action-button sizing needed and keep the `58px` action/sample height.

**Disabled class pattern** (lines 250-259):
```css
.disabledClass {
    position: relative;
    opacity: 0.5;
    pointer-events: none;
    filter: grayscale(100%);
}

.disabledClass .sampleImage {
    filter: grayscale(100%);
}
```

Do not add separate disabled logic for `Bildsuche`; placing it inside the existing disabled wrapper makes it non-interactive.

---

### `src/workflow/ClassEntry/Classification.test.tsx` (test, event-driven)

**Analogs:** `src/workflow/ClassEntry/Classification.test.tsx`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx`, `src/workflow/ClassEntry/SamplePreviewModal.test.tsx`

**Existing smoke render pattern** (lines 1-23):
```typescript
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Classification } from './Classification';
import TestWrapper from '../../util/TestWrapper';

describe('Classification component', () => {
    it('renders with no samples and inactive', async ({ expect }) => {
        render(
            <Classification
                name="TestClass"
                index={0}
                active={false}
                data={{ label: 'TestClass', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        expect(screen.getByTestId('widget-TestClass')).toBeInTheDocument();
        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
    });
});
```

Extend this file for button visibility and basic dialog-opening tests. Use `userEvent.setup()` like the other workflow tests.

**OpenVerse test localization mock pattern** (from `OpenVerseSearchDialog.test.tsx` lines 9-36):
```typescript
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const copy: Record<string, string> = {
                'trainingdata.openverse.title': `OpenVerse: ${values?.className ?? ''}`,
                'trainingdata.openverse.searchLabel': 'Suchbegriff',
                'trainingdata.openverse.searchAction': 'Bilder suchen',
                'trainingdata.openverse.useImage': 'Dieses Bild nutzen',
                'trainingdata.openverse.failedUse': 'Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.',
                'trainingdata.aria.close': 'Schließen',
            };
            return copy[key] ?? key;
        },
    }),
}));
```

If `Classification.test.tsx` needs human-readable copy, expand the mock or rely on the global setup's key-returning behavior and query by test id.

**Async selected-result failure test pattern** (from `OpenVerseSearchDialog.test.tsx` lines 350-362):
```typescript
const searchClient = vi.fn().mockResolvedValue(searchResponse([catResult]));
const onUseImage = vi.fn().mockRejectedValue(new Error('future import failed'));
renderDialog(searchClient, onUseImage);

await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
await user.click(await screen.findByRole('button', { name: /Dieses Bild nutzen/ }));

expect(
    await screen.findByText('Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.')
).toBeInTheDocument();
```

For `Classification`, mock `importOpenVerseImage` to reject, drive the integrated dialog, and assert samples/setData are unchanged while the dialog remains open and shows failed-use.

**Sample order/index regression pattern** (from `SamplePreviewModal.test.tsx` lines 646-672):
```typescript
currentSamples = [
    { data: createCanvas(), id: '2' },
    { data: createCanvas(), id: '0' },
    { data: createCanvas(), id: '1' },
];

rerender(
    <Classification
        name="TestClass"
        index={0}
        active={false}
        data={{ label: 'TestClass', samples: currentSamples }}
        setData={() => {}}
        setActive={() => {}}
        onActivate={() => {}}
        onDelete={() => {}}
        onSampleClick={onSampleClick}
    />
);
```

Use the same expectation that a new sample appears at the front and index math still maps visual order to array order.

---

### `src/workflow/TrainingData/TrainingData.test.tsx` (test, CRUD/event-driven)

**Analog:** `src/workflow/TrainingData/TrainingData.test.tsx`

**Existing multi-class render pattern** (lines 39-55):
```typescript
it('renders with multiple data items but no samples', async ({ expect }) => {
    const testData = [
        { label: 'Class1', samples: [] },
        { label: 'Class2', samples: [] },
    ];
    render(
        <TrainingData
            active={true}
            data={testData}
            setData={() => {}}
            onFocused={() => {}}
        />,
        { wrapper: TestWrapper }
    );
    expect(screen.getByTestId('widget-Class1')).toBeInTheDocument();
    expect(screen.getByTestId('widget-Class2')).toBeInTheDocument();
});
```

Use this shape for intended-class integration tests: render two classes, select an OpenVerse result from class 2, and assert class 1 remains unchanged while class 2 prepends the imported sample.

**Existing sample render pattern** (lines 57-72):
```typescript
const canvas = document.createElement('canvas');
canvas.setAttribute('data-testid', 'testcanvas');
const testData = [{ label: 'Class1', samples: [{ data: canvas, id: '' }] }];
render(
    <TrainingData
        active={true}
        data={testData}
        setData={() => {}}
        onFocused={() => {}}
    />,
    { wrapper: TestWrapper }
);
expect(screen.getByTestId('widget-Class1')).toBeInTheDocument();
expect(screen.getByTestId('testcanvas')).toBeInTheDocument();
```

For imported samples, give the mocked canvas a `data-testid` and assert it appears in the intended class after the state wrapper applies `setData`.

**Sample modal delete/move analogs** (from `TrainingData.tsx` lines 107-159):
Use tests that open the preview by clicking the imported sample and then invoke delete/move controls. Assertions should focus on unchanged generic sample behavior, not OpenVerse-specific metadata.

**Stale guard test recommendation:**
Implement a controlled wrapper that applies `setData` callbacks to local state. Mock `importOpenVerseImage` with a manually resolved promise, delete or rename the target class before resolving, then assert:
- no class receives the imported canvas
- no sparse array is created
- the dialog failure state appears by rejected `onUseImage`

---

### `public/locales/de-DE/image_adv.json` and `public/locales/en-GB/image_adv.json` (config, transform)

**Analog:** existing `trainingdata.actions` and `trainingdata.openverse` keys.

**Action keys source** (`de-DE`, lines 58-62):
```json
"actions": {
    "addClass": "Eine Klasse hinzufügen",
    "webcam": "Webcam",
    "audio": "Mikrofon",
    "upload": "Hochladen",
```

Add:
```json
"openverse": "Bildsuche"
```

near the existing training-data action labels in each locale namespace. English fallback can be `"Image search"`.

**Existing OpenVerse copy source** (`de-DE`, lines 110-127):
```json
"openverse": {
    "title": "OpenVerse: {{className}}",
    "searchLabel": "Suchbegriff",
    "searchPlaceholder": "z. B. Katze",
    "searchAction": "Bilder suchen",
    "useImage": "Dieses Bild nutzen",
    "initial": "Suche nach Bildern für diese Klasse.",
    "loading": "Suche Bilder...",
    "loadingMore": "Weitere Bilder werden geladen...",
    "emptyQuery": "Gib einen Suchbegriff ein.",
    "emptyTitle": "Keine Bilder gefunden.",
    "emptyBody": "Versuche einen anderen Suchbegriff.",
    "retryableError": "Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.",
    "rateLimit": "Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.",
    "retry": "Erneut versuchen",
    "more": "Mehr Ergebnisse",
    "failedUse": "Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.",
    "fallbackAlt": "OpenVerse Bild"
}
```

Reuse these keys exactly for dialog title, result action, retry, and failure text. Do not add visible license, attribution, creator, source, or filter strings for Phase 3.

## Shared Patterns

### Button Placement
**Source:** `src/workflow/ClassEntry/Classification.tsx` lines 395-428  
**Apply to:** `Classification.tsx`, `Classification.test.tsx`

Use `li className={style.sample}` plus `VerticalButton variant="outlined"` in the inactive sample action row. Place `Bildsuche` after Webcam/Upload and hide it when `active` or `isAudio`.

### Dialog Ownership
**Source:** `src/workflow/ClassEntry/Classification.tsx` lines 58, 271-273, 465-469 and `OpenVerseSearchDialog.tsx` lines 32-38  
**Apply to:** `Classification.tsx`

Use local `useState` and close/open callbacks in `Classification`. Render `OpenVerseSearchDialog` with `open`, `className`, `onClose`, and async `onUseImage`.

### Async Failure
**Source:** `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` lines 162-185 and 304-310  
**Apply to:** `Classification.tsx`, `Classification.test.tsx`, `TrainingData.test.tsx`

Reject `onUseImage` on importer failure or stale discard. The dialog catches the rejection, clears pending state, leaves itself open, and shows `trainingdata.openverse.failedUse`.

### Stale Class Guard
**Source:** `src/workflow/TrainingData/TrainingData.tsx` lines 49-58 and `Classification.tsx` lines 28-36  
**Apply to:** `TrainingData.tsx`, `Classification.tsx`, integration tests

Capture `index` and `data.label` when the selected result starts importing. Harden `setDataIx` with `if (!data[ix]) return data;`. Inside the class update, compare `current.label` to the captured label before prepending.

### Normal Sample Shape
**Source:** `src/state.ts` lines 6-15 and `Classification.tsx` lines 210-224  
**Apply to:** `Classification.tsx`, `TrainingData.test.tsx`

Use `{ data: canvas, id: '' }` and prepend to `samples`. Avoid new OpenVerse sample types or metadata.

### Localization
**Source:** `public/locales/de-DE/image_adv.json` lines 58-62 and 110-127  
**Apply to:** locale JSON files, `Classification.tsx`, tests

Add only the class-card action key. Existing dialog copy already covers title, search, selected-result action, retry, and failure.

### Tests
**Source:** `OpenVerseSearchDialog.test.tsx` lines 70-83, 350-362; `TrainingData.test.tsx` lines 39-72; `SamplePreviewModal.test.tsx` lines 540-613  
**Apply to:** `Classification.test.tsx`, `TrainingData.test.tsx`

Use React Testing Library, `userEvent.setup()`, co-located tests, inline fixtures, and mocked OpenVerse/import boundaries. Assert class-specific mutation through visible DOM and/or applied `setData` callbacks.

## No Analog Found

No Phase 3 file lacks a close local analog. The only new behavior is the combination of existing patterns: class-card action, reusable dialog callback, importer boundary, and class-state update guard.

## Metadata

**Analog search scope:** `src/workflow/ClassEntry`, `src/workflow/TrainingData`, `src/workflow/OpenVerseSearch`, `src/util`, `src/state.ts`, `public/locales/*/image_adv.json`, `.planning/codebase`  
**Files scanned:** 18 source/test/config/planning files plus locale key search results  
**Pattern extraction date:** 2026-05-07
