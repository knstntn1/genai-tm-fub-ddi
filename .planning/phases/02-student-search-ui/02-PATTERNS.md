# Phase 2: Student Search UI - Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 6 new/modified files
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` | component | request-response | `src/components/DatasetPicker/DatasetPicker.tsx` | exact |
| `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css` | component styling | request-response | `src/components/DatasetPicker/DatasetPicker.module.css` + `src/workflow/ClassEntry/classification.module.css` | exact |
| `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx` | test | request-response | `src/components/DatasetPicker/DatasetPicker.test.tsx` + `src/util/openverse.test.ts` | role-match |
| `public/locales/de-DE/image_adv.json` | config | request-response | `public/locales/de-DE/image_adv.json` | exact |
| `public/locales/en-GB/image_adv.json` | config | request-response | `public/locales/en-GB/image_adv.json` | exact |
| `src/workflow/ClassEntry/Classification.tsx` | component | CRUD | Phase 3 boundary only: `onUseImage` must not mutate `classState` in Phase 2 | boundary |

## Pattern Assignments

### `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx` (component, request-response)

**Analog:** `src/components/DatasetPicker/DatasetPicker.tsx`

**Imports pattern** (lines 1-18):
```typescript
import { useCallback, useState, useRef, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Button } from '@genaitm/components/button/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { useVariant } from '@genaitm/util/variant';
import styles from './DatasetPicker.module.css';
import { Alert } from '@mui/material';
```

**Dialog API pattern** (lines 20-28):
```typescript
interface DatasetPickerProps {
    open: boolean;
    onClose: () => void;
    onDatasetSelected: (canvases: HTMLCanvasElement[]) => void;
}

export default function DatasetPicker({ open, onClose, onDatasetSelected }: DatasetPickerProps) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
```

Copy this shape with `open`, `className`, `onClose`, `onUseImage`, and an injectable/default search client. Import `OpenVerseImageResult`, `OpenVerseSearchError`, and `searchOpenVerseImages` from `src/util/openverse.ts`; keep result activation neutral.

**Async loading/error pattern** (lines 46-71):
```typescript
const handleUse = useCallback(async () => {
    const images = listRef.current?.getSelectedImages() ?? [];
    if (images.length === 0) return;

    setLoading(true);
    setLoadProgress({ loaded: 0, total: images.length });

    try {
        const canvases = await loadDatasetImagesInParallel(images as DatasetImage[], (progress) => {
            setLoadProgress(progress);
        });

        if (canvases.length > 0) {
            onDatasetSelected(canvases);
            listRef.current?.clearSelection();
            onClose();
        } else {
            setError(t('trainingdata.labels.datasetLoadError'));
        }
    } catch (error) {
        console.error('Error loading images:', error);
        setError(t('trainingdata.labels.datasetLoadError'));
    } finally {
        setLoading(false);
    }
}, [onDatasetSelected, onClose, t]);
```

For OpenVerse, use the same local state pattern: trim query, block empty submit, set loading, call client, append page results for `Mehr Ergebnisse`, map typed `OpenVerseSearchError.code` to localized UI text, and ignore abort/stale responses on close or query changes.

**Dialog structure pattern** (lines 82-157):
```typescript
<Dialog
    open={open}
    onClose={handleClose}
    maxWidth="lg"
    fullWidth
    slotProps={{ paper: { className: styles.dialogPaper } }}
>
    <DialogTitle className={styles.dialogTitle}>
        {t('trainingdata.labels.selectDataset')}
        <IconButton onClick={handleClose} disabled={loading} aria-label="close" className={styles.closeButton}>
            <CloseIcon />
        </IconButton>
    </DialogTitle>
    <DialogContent ref={scrollRootRef}>
        {/* loading/content/error states */}
    </DialogContent>
    <DialogActions className={styles.dialogActions}>
        <Button variant="outlined" onClick={handleClose} disabled={loading}>
            {t('trainingdata.actions.cancel')}
        </Button>
        <Button onClick={handleUse} disabled={loading || selectedCount === 0} variant="contained">
            {loading ? t('trainingdata.labels.loading') : t('trainingdata.actions.use', { count: selectedCount })}
        </Button>
    </DialogActions>
</Dialog>
```

Phase 2 should use `DialogTitle`, close `IconButton`, `DialogContent`, a search row with `TextField` and `Button`, image grid, alert/state text, and optional `Mehr Ergebnisse`. Footer actions are optional; close in title is required by the UI spec.

### `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css` (component styling, request-response)

**Analogs:** `src/components/DatasetPicker/DatasetPicker.module.css`, `src/workflow/ClassEntry/classification.module.css`

**Token/import pattern** (`DatasetPicker.module.css` lines 1-2):
```css
@value primary, primaryLight, primaryHover, textDark, backgroundLight, borderGrey from "@genai-fi/base/css/colours.module.css";
```

**Dialog sizing/title pattern** (`DatasetPicker.module.css` lines 80-97):
```css
.dialogPaper {
    height: 80vh;
    max-width: 700px;
}

.dialogTitle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1.8rem;
    margin-bottom: 0;
}

.closeButton {
    margin-left: auto;
    margin-right: -0.5rem;
}
```

**Search field/sticky content pattern** (`DatasetPicker.module.css` lines 109-127):
```css
.searchField {
    padding: 28px 8px 0px 8px;
    margin-bottom: 8px;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    box-sizing: border-box;
}

.searchField :global(.MuiOutlinedInput-root) {
    border-radius: 6px;
    overflow: hidden;
}
```

**Image tile dimensions and border pattern** (`DatasetPicker.module.css` lines 3-35):
```css
.imageContainer {
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid borderGrey;
    width: 80px;
    height: 80px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.datasetImage {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 5px;
    display: block;
    box-sizing: border-box;
}
```

For Phase 2, convert this to a responsive CSS grid with square `aspect-ratio: 1 / 1`, `object-fit: cover`, 5-6px radius, and no visible metadata.

**Hover/focus reveal pattern** (`classification.module.css` lines 127-143):
```css
.sampleImage {
    composes: sample;
    width: 58px;
    height: 58px;
}

.sampleImage > button {
    opacity: 0;
}

.sampleImage:hover > button {
    opacity: 1;
}

.sampleImage > button:focus {
    opacity: 1;
}
```

Copy the reveal behavior but improve it for Phase 2 with `.tile:hover .overlay`, `.tile:focus-visible .overlay`, and `.tile:focus-within .overlay`. The overlay text must be `Dieses Bild nutzen` through i18n and the tile should be a button or equivalent keyboard-activatable control.

### `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx` (test, request-response)

**Analogs:** `src/components/DatasetPicker/DatasetPicker.test.tsx`, `src/util/openverse.test.ts`, `src/util/TestWrapper.tsx`, `src/setupTests.ts`

**Component test/mock pattern** (`DatasetPicker.test.tsx` lines 1-17):
```typescript
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DatasetPicker from './DatasetPicker';

vi.mock('@genaitm/util/datasets', () => ({
    DATASETS: [],
    fetchAndCacheDatasets: vi.fn().mockResolvedValue([
        {
            id: 'dataset1',
            nameKey: 'dataset.name',
            descriptionKey: 'dataset.description',
            categoryKey: 'dataset.category',
            images: [{ url: 'https://example.com/image1.jpg' }, { url: 'https://example.com/image2.jpg' }],
        },
    ]),
}));
```

Mock `searchOpenVerseImages` or inject a `searchClient` prop. Tests should cover no client call before submit, loading, empty results, retryable errors, rate limit, result tiles, hover/focus/keyboard activation, pagination append, and failed `onUseImage`.

**Async client test pattern** (`openverse.test.ts` lines 18-49):
```typescript
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ page: 1, page_count: 3, page_size: 20, result_count: 45, results: [] }),
    } as Response)
) as unknown as typeof fetch;

await searchOpenVerseImages({ query: ' Katze ' });

const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
expect(requestUrl.searchParams.get('mature')).toBe('false');
```

Use `vi.fn().mockResolvedValue(...)` for UI tests rather than real network. Use `userEvent.setup()` and `waitFor`/`findBy*` for async state changes.

**Wrapper pattern** (`TestWrapper.tsx` lines 15-24):
```typescript
export default function TestWrapper({ initializeState, children }: Props) {
    return (
        <Provider store={initializeState}>
            <BrowserRouter>
                <WorkflowLayout connections={[]}>
                    <VariantContext.Provider value={settings.base}>{children}</VariantContext.Provider>
                </WorkflowLayout>
            </BrowserRouter>
        </Provider>
    );
}
```

Render the dialog with `{ wrapper: TestWrapper }` when it uses `useVariant()`/i18n/MUI workflow context.

**Global test mocks available** (`setupTests.ts` lines 38-57 and 67-79):
```typescript
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (str: string, opt?: { returnObjects: boolean }) => (opt?.returnObjects ? [str] : str),
        i18n: { changeLanguage: () => new Promise(() => {}) },
    }),
    Trans: function Trans({ i18nKey }: { i18nKey: string }) {
        return i18nKey;
    },
}));

class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
global.IntersectionObserver = IntersectionObserver;
```

Because the i18n mock returns keys, assert translation keys in existing-style tests when using the global mock, or locally mock `useTranslation` only when visible German copy itself is under test.

### `public/locales/de-DE/image_adv.json` and `public/locales/en-GB/image_adv.json` (config, request-response)

**Analog:** existing `trainingdata` namespace entries.

**German action/label placement** (`de-DE/image_adv.json` lines 57-102):
```json
"trainingdata": {
    "actions": {
        "cancel": "Abbrechen",
        "use": "Verwenden ({{count}})",
        "displayMore": "{{count}} Bilder anzeigen"
    },
    "labels": {
        "selectDataset": "Datensatz auswählen",
        "searchDataset": "Datensatz suchen",
        "loading": "Wird geladen...",
        "loadingDataset": "Bilder werden geladen {{loaded}}/{{total}}...",
        "datasetLoadError": "Datensatz konnte nicht geladen werden. Bitte erneut versuchen."
    },
    "aria": {
        "classCard": "Trainingsdaten für {{name}}"
    }
}
```

Add Phase 2 keys under `trainingdata.actions`, `trainingdata.labels`, and `trainingdata.aria`; keep classroom-facing German concise. Required German copy includes `Bilder suchen`, `Dieses Bild nutzen`, `Suche Bilder...`, `Keine Bilder gefunden.`, `Versuche einen anderen Suchbegriff.`, `Erneut versuchen`, `Mehr Ergebnisse`, and rate-limit/failure text.

**English fallback placement** (`en-GB/image_adv.json` lines 58-110):
```json
"trainingdata": {
    "actions": {
        "cancel": "Cancel",
        "use": "Use ({{count}})",
        "displayMore": "Display {{count}} images"
    },
    "labels": {
        "selectDataset": "Select a Dataset",
        "searchDataset": "Search a dataset",
        "loading": "Loading...",
        "loadingDataset": "Loading images {{loaded}}/{{total}}...",
        "datasetLoadError": "Failed to load dataset images. Please try again."
    },
    "aria": {
        "classCard": "Training data for {{name}}"
    }
}
```

Add matching English fallback keys. If planner chooses to update every `public/locales/*/image_adv.json`, use the English fallback strings for locales without translation support rather than leaving missing keys.

### `src/workflow/ClassEntry/Classification.tsx` (boundary only, CRUD)

**Analog:** current sample mutation patterns, deferred to Phase 3.

**Existing sample insertion pattern** (lines 210-223):
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

**Existing dataset insertion pattern** (lines 284-297):
```typescript
const doDatasetSelected = useCallback(
    (canvases: HTMLCanvasElement[]) => {
        if (canvases.length > 0) {
            setData(
                (data) => ({
                    label: data.label,
                    samples: [...canvases.map((c) => ({ data: c, id: '' })), ...data.samples],
                }),
                index
            );
        }
    },
    [setData, index]
);
```

Do not copy these mutations into Phase 2. Phase 2 result activation calls `onUseImage(result)` only. Component tests should assert the callback receives the selected `OpenVerseImageResult`; class sample insertion and entry-point wiring are Phase 3.

## Shared Patterns

### i18n Namespace
**Source:** `src/util/variant.ts` lines 6-9, `src/components/DatasetPicker/DatasetPicker.tsx` lines 26-28
**Apply to:** OpenVerse dialog and tile copy
```typescript
const { namespace } = useVariant();
const { t } = useTranslation(namespace);
```

### OpenVerse Client/Error Boundary
**Source:** `src/util/openverse.ts` lines 4-39 and 85-130
**Apply to:** search submit, pagination, error-state mapping
```typescript
export interface OpenVerseImageResult {
    id: string;
    title: string;
    imageUrl: string;
    thumbnailUrl: string;
    width?: number;
    height?: number;
    source?: string;
    foreignLandingUrl?: string;
    license?: string;
    licenseUrl?: string;
    creator?: string;
    mature?: boolean;
}

export type OpenVerseSearchErrorCode = 'empty-query' | 'network' | 'rate-limited' | 'http' | 'invalid-response';
```

Use these fields for data only; do not visibly render license, creator, source, URL, dimensions, or attribution in Phase 2.

### Recoverable Async Errors
**Source:** `src/components/DatasetPicker/DatasetPicker.tsx` lines 53-70
**Apply to:** search, retry, more-results, failed `onUseImage`
```typescript
try {
    const result = await asyncOperation();
    // update local UI state
} catch (error) {
    console.error('Error loading images:', error);
    setError(t('trainingdata.labels.datasetLoadError'));
} finally {
    setLoading(false);
}
```

Map `rate-limited` to warning UI, `network`/`http`/`invalid-response` to retryable error UI, and valid `results: []` to an empty state.

### Phase Boundary
**Source:** `.planning/phases/02-student-search-ui/02-CONTEXT.md` domain/decisions and `src/util/openverseImageImport.test.ts` lines 243-248
**Apply to:** all Phase 2 components/tests
```typescript
expect(source).not.toMatch(/@genaitm\/state|classState|setData|samples:/);
expect(source).not.toMatch(/Set<|new Set|Map<|new Map|pending|importing/);
```

The exact import-boundary source scan is Phase 1-specific, but copy the intent: Phase 2 search UI must not import `classState`, call `setData`, create `{ data: canvas, id: '' }`, or call `importOpenVerseImage`. It may support a rejected `onUseImage` callback for future integration tests.

## No Analog Found

None. Every planned Phase 2 file has a same-role or boundary analog in the current codebase.

## Metadata

**Analog search scope:** `src/components/DatasetPicker/`, `src/workflow/ClassEntry/`, `src/workflow/TrainingData/`, `src/util/`, `src/setupTests.ts`, `public/locales/*/image_adv.json`, `.planning/phases/02-student-search-ui/`
**Files scanned:** 24 source/config/planning files plus codebase planning docs
**Pattern extraction date:** 2026-05-06
