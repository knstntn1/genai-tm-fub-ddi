# Phase 1: OpenVerse Client & Import Boundary - Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/util/openverse.ts` | utility/client | request-response | `src/util/datasets.ts` | role-match |
| `src/util/openverse.test.ts` | test | request-response | `src/workflow/ImageWorkspace/ShareProtocol.test.tsx` | flow-match |
| `src/util/openverseImageImport.ts` | utility/import boundary | file-I/O, transform | `src/util/datasetLoader.ts` | role-match |
| `src/util/openverseImageImport.test.ts` | test | file-I/O, transform | `src/workflow/ClassEntry/Sample.test.tsx` | partial |

## Pattern Assignments

### `src/util/openverse.ts` (utility/client, request-response)

**Analog:** `src/util/datasets.ts`

**Imports pattern:** no imports are required for browser `fetch` utilities in `src/util/datasets.ts`.

**Typed model and constants pattern** (`src/util/datasets.ts` lines 1-16):
```typescript
export interface DatasetImage {
    url: string;
    thumbnail?: string;
}

export interface Dataset {
    id: string;
    nameKey: string;
    descriptionKey: string;
    images: DatasetImage[];
    categoryKey: string;
}

export let DATASETS: Dataset[] = [];

export const REMOTE_DATASETS_URL = 'https://store.gen-ai.fi/tm/datasets/datasets.json';
```

**Fetch boundary pattern** (`src/util/datasets.ts` lines 18-31):
```typescript
export async function fetchAndCacheDatasets(url: string = REMOTE_DATASETS_URL): Promise<Dataset[]> {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch datasets: ${resp.status}`);
        const json = (await resp.json()) as Dataset[];
        if (Array.isArray(json)) {
            DATASETS = json;
            return DATASETS;
        }
        throw new Error('Invalid datasets format from server');
    } catch (err) {
        console.error('Error fetching datasets:', err);
        return DATASETS;
    }
}
```

**Additional response/error analog:** `src/workflow/ImageWorkspace/ShareProtocol.tsx`

**Non-OK handling** (`src/workflow/ImageWorkspace/ShareProtocol.tsx` lines 38-44):
```typescript
const response = await fetch(`${import.meta.env.VITE_APP_API || 'http://localhost:9001'}/model/${code}/`, {
    method: 'POST',
    body: blob.zip,
});
if (!response.ok) {
    throw new Error(`Failed to upload model: ${response.statusText}`);
}
```

**Apply to OpenVerse client:**
- Keep all OpenVerse API response typing in `src/util/openverse.ts`.
- Export constants and interfaces at module top, matching utility module style.
- Use plain browser `fetch(url.toString(), { signal })`.
- Unlike `datasets.ts`, do not swallow failures. Throw `OpenVerseSearchError` with stable codes so later UI can localize recoverable states.
- Validate `json.results` shape before returning; drop malformed entries only when at least one valid result remains.

### `src/util/openverse.test.ts` (test, request-response)

**Analog:** `src/workflow/ImageWorkspace/ShareProtocol.test.tsx`

**Imports pattern** (`src/workflow/ImageWorkspace/ShareProtocol.test.tsx` lines 1-8):
```typescript
import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import ShareProtocol from './ShareProtocol';
import TestWrapper from '@genaitm/util/TestWrapper';
import { createStore } from 'jotai';
import { modelShared, modelState, sessionCode, shareModel } from '@genaitm/state';
import { TeachableModel } from '@genai-fi/classifier';
import RecoilObserver from '@genaitm/util/Observer';
```

**Mocked fetch success pattern** (`src/workflow/ImageWorkspace/ShareProtocol.test.tsx` lines 31-39):
```typescript
vi.stubEnv('VITE_APP_API', 'http://localhost:9001');

global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        statusText: 'OK',
    } as Response)
) as unknown as typeof fetch;
```

**Fetch assertion pattern** (`src/workflow/ImageWorkspace/ShareProtocol.test.tsx` lines 49-58):
```typescript
await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:9001/model/test-session/`,
        expect.objectContaining({
            method: 'POST',
            body: expect.any(Blob),
        })
    );
});
```

**Failure mock pattern** (`src/workflow/ImageWorkspace/ShareProtocol.test.tsx` lines 84-91):
```typescript
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: false,
        statusText: 'Internal Server Error',
        status: 500,
    } as Response)
) as unknown as typeof fetch;
```

**Pure utility test style analog:** `src/workflow/Behaviours/patch.test.ts`

**Direct input/output assertions** (`src/workflow/Behaviours/patch.test.ts` lines 1-13):
```typescript
import { describe, it } from 'vitest';
import { BehaviourType } from './Behaviours';
import { patchBehaviours } from './patch';

describe('Behaviour patch', () => {
    it('can work without labels', async ({ expect }) => {
        const behaviors = [{ text: { text: 'b1' } }, { text: { text: 'b2' } }] as BehaviourType[];
        const classes = ['c1', 'c2'];

        const result = patchBehaviours(behaviors, classes);

        expect(result).toHaveLength(2);
        expect(result[0].label).toBe('c1');
```

**Apply to OpenVerse tests:**
- Co-locate as `src/util/openverse.test.ts`.
- Import `describe`, `it`, and `vi` from `vitest`.
- Assign `global.fetch = vi.fn(...) as unknown as typeof fetch`.
- Assert constructed URL through the first fetch call string or `new URL(String(call[0]))`.
- Test rejected fetches, 429 `Retry-After`, non-OK HTTP, malformed JSON shape, empty result contract, and malformed entry dropping through direct function calls.

### `src/util/openverseImageImport.ts` (utility/import boundary, file-I/O + transform)

**Analog:** `src/util/datasetLoader.ts`

**Imports pattern** (`src/util/datasetLoader.ts` lines 1-2):
```typescript
import { DatasetImage } from './datasets';
import { canvasFromURL } from '@genai-fi/base';
```

**Sequential remote canvas loading pattern** (`src/util/datasetLoader.ts` lines 9-30):
```typescript
export async function loadDatasetImages(
    images: DatasetImage[],
    onProgress?: (progress: LoadProgress) => void
): Promise<HTMLCanvasElement[]> {
    const canvases: HTMLCanvasElement[] = [];
    
    for (let i = 0; i < images.length; i++) {
        try {
            const canvas = await canvasFromURL(images[i].url);
            canvases.push(canvas);
            
            if (onProgress) {
                onProgress({ loaded: i + 1, total: images.length });
            }
        } catch (error) {
            console.error(`Failed to load image ${i}:`, error);
            // Continue loading other images even if one fails
        }
    }
    
    return canvases;
}
```

**Parallel load with null filtering pattern** (`src/util/datasetLoader.ts` lines 32-58):
```typescript
export async function loadDatasetImagesInParallel(
    images: DatasetImage[],
    onProgress?: (progress: LoadProgress) => void
): Promise<HTMLCanvasElement[]> {
    let loaded = 0;
    
    const promises = images.map(async (image) => {
        try {
            const canvas = await canvasFromURL(image.url);
            loaded++;
            if (onProgress) {
                onProgress({ loaded, total: images.length });
            }
            return canvas;
        } catch (error) {
            console.error('Failed to load image:', error);
            loaded++;
            if (onProgress) {
                onProgress({ loaded, total: images.length });
            }
            return null;
        }
    });
    
    const results = await Promise.all(promises);
    return results.filter((canvas): canvas is HTMLCanvasElement => canvas !== null);
}
```

**Sample canvas style and insertion analog:** `src/workflow/ClassEntry/Classification.tsx`

**File import sample style** (`src/workflow/ClassEntry/Classification.tsx` lines 95-107):
```typescript
canvasesFromFiles(Array.from(e.target.files || [])).then((canvases) => {
    if (canvases.length > 0) {
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

**Camera sample style** (`src/workflow/ClassEntry/Classification.tsx` lines 210-221):
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
```

**Canvas display readability dependency:** `src/components/ImageGrid/Sample.tsx`

**Display calls `toDataURL`** (`src/components/ImageGrid/Sample.tsx` lines 43-50):
```typescript
useEffect(() => {
    if (ref.current && image) {
        ref.current.src = image.toDataURL();
        if (image.hasAttribute('data-testid')) {
            ref.current.setAttribute('data-testid', image.getAttribute('data-testid') || '');
        }
    }
}, [image]);
```

**Apply to OpenVerse importer:**
- Return only `HTMLCanvasElement`; do not write to `classState`.
- Set `canvas.style.width = '58px'` and `canvas.style.height = '58px'` before returning.
- Bound drawn dimensions before returning, because existing sample insertion assumes canvases are already usable.
- Validate canvas readability with `getImageData(0, 0, 1, 1)` or `toDataURL('image/png')`; this protects the existing `Sample` display path.
- Prefer dependency injection for `Image` loading/test seams instead of mocking global constructors in every test.
- Throw typed `OpenVerseImageImportError`; do not swallow import errors like dataset bulk loading does.

### `src/util/openverseImageImport.test.ts` (test, file-I/O + transform)

**Analog:** `src/workflow/ClassEntry/Sample.test.tsx`

**Canvas fixture pattern** (`src/workflow/ClassEntry/Sample.test.tsx` lines 7-25):
```typescript
function SampleWrapper() {
    const iCanvas = document.createElement('canvas');
    iCanvas.setAttribute('data-testid', 'sample');
    const [image, setImage] = useState(iCanvas);

    return (
        <div>
            <Sample
                index={0}
                image={image}
                onDelete={() => {}}
            />
            <button
                data-testid="newimage"
                onClick={() => {
                    const nCanvas = document.createElement('canvas');
                    nCanvas.setAttribute('data-testid', 'sample');
                    setImage(nCanvas);
                }}
            >
```

**Assertion style** (`src/workflow/ClassEntry/Sample.test.tsx` lines 33-41):
```typescript
describe('Sample image component', () => {
    it('always shows a single canvas', async ({ expect }) => {
        const user = userEvent.setup();
        render(<SampleWrapper />);
        expect(screen.getAllByTestId('sample')).toHaveLength(1);
        const buttonElement = screen.getByTestId('newimage');
        await user.click(buttonElement);
        expect(screen.getAllByTestId('sample')).toHaveLength(1);
    });
});
```

**Global browser mock pattern:** `src/setupTests.ts`

**Browser API classes assigned to globals** (`src/setupTests.ts` lines 59-79):
```typescript
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

global.ResizeObserver = ResizeObserver;

class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    root = null;
    rootMargin = '';
    thresholds = [];
    takeRecords() {
        return [];
    }
}

global.IntersectionObserver = IntersectionObserver;
```

**Utility async assertion pattern:** `src/workflow/Behaviours/patch.test.ts`

**Direct result assertions** (`src/workflow/Behaviours/patch.test.ts` lines 19-30):
```typescript
it('keeps perfect order if no name changes', async ({ expect }) => {
    const behaviors = [
        { label: 'c1', text: { text: 'b1' } },
        { label: 'c2', text: { text: 'b2' } },
    ] as BehaviourType[];
    const classes = ['c1', 'c2'];

    const result = patchBehaviours(behaviors, classes);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(behaviors[0]);
```

**Apply to importer tests:**
- Co-locate as `src/util/openverseImageImport.test.ts`.
- Create canvases with `document.createElement('canvas')`.
- Mock `getContext`, `drawImage`, and readback behavior locally where jsdom lacks a real canvas implementation.
- Use injected loader helpers to simulate load success, load failure, timeout, abort, primary failure plus fallback success, and taint/readback failure.
- Assert returned canvas dimensions do not exceed `maxSize` and style dimensions are exactly `58px`.

## Shared Patterns

### Browser Fetch Boundaries

**Source:** `src/util/datasets.ts`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`
**Apply to:** `src/util/openverse.ts`, `src/util/openverse.test.ts`

```typescript
const resp = await fetch(url);
if (!resp.ok) throw new Error(`Failed to fetch datasets: ${resp.status}`);
const json = (await resp.json()) as Dataset[];
```

```typescript
const response = await fetch(`${import.meta.env.VITE_APP_API || 'http://localhost:9001'}/model/${code}/`, {
    method: 'POST',
    body: blob.zip,
});
if (!response.ok) {
    throw new Error(`Failed to upload model: ${response.statusText}`);
}
```

### Canvas Sample Contract

**Source:** `src/workflow/ClassEntry/Classification.tsx`, `src/components/ImageGrid/Sample.tsx`
**Apply to:** `src/util/openverseImageImport.ts`

```typescript
image.style.width = '58px';
image.style.height = '58px';

setData(
    (data) => ({
        label: name,
        samples: [{ data: image, id: '' }, ...data.samples],
    }),
    index
);
```

```typescript
ref.current.src = image.toDataURL();
```

### Test Style

**Source:** `src/workflow/ImageWorkspace/ShareProtocol.test.tsx`, `src/workflow/Behaviours/patch.test.ts`
**Apply to:** all Phase 1 tests

```typescript
import { describe, it, vi } from 'vitest';
```

```typescript
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: false,
        statusText: 'Internal Server Error',
        status: 500,
    } as Response)
) as unknown as typeof fetch;
```

```typescript
it('can work without labels', async ({ expect }) => {
    const behaviors = [{ text: { text: 'b1' } }, { text: { text: 'b2' } }] as BehaviourType[];
    const classes = ['c1', 'c2'];

    const result = patchBehaviours(behaviors, classes);

    expect(result).toHaveLength(2);
});
```

## No Analog Found

No Phase 1 file lacks an analog. The only gap is exact canvas-taint/timeout testing; use local dependency injection in `src/util/openverseImageImport.ts` because existing tests do not cover mocked image loading.

## Metadata

**Analog search scope:** `src/util`, `src/workflow/ImageWorkspace`, `src/workflow/ClassEntry`, `src/components/PeerDeployer`, `src/components/ImageGrid`, `src/components/DatasetPicker`, `src/setupTests.ts`
**Files scanned:** 14
**Pattern extraction date:** 2026-05-06
