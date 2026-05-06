# Phase 1 Research: OpenVerse Client & Import Boundary

**Phase:** 1 - OpenVerse Client & Import Boundary
**Researched:** 2026-05-06
**Status:** Ready for planning

## RESEARCH COMPLETE

## Phase Goal

Build the non-UI foundation for OpenVerse image search: a typed browser-side OpenVerse client and a remote-image import utility that only returns usable, bounded `HTMLCanvasElement` samples after successful image load and canvas readability validation.

This phase should not add the student search dialog or class-card entry point. It should provide tested boundaries that Phase 2 and Phase 3 can consume.

## Requirements Covered

- `OVAPI-01`: Search OpenVerse images from the browser using a student-entered query.
- `OVAPI-02`: Use image-only results and `mature=false` by default.
- `OVAPI-03`: Normalize OpenVerse responses into a local TypeScript result model.
- `OVAPI-04`: Expose typed recoverable search errors for network, invalid response, empty, and rate-limit cases.
- `OVAPI-05`: Do not expose OpenVerse secrets or authenticated credentials in browser code.
- `IMPORT-01`: Convert a selected OpenVerse image into the existing image sample representation.
- `IMPORT-02`: Verify remote image is readable as canvas data before class-state insertion.
- `IMPORT-03`: Failed loads, taint failures, decode failures, and timeouts leave class state unchanged.
- `IMPORT-04`: Bound or resize imported images to avoid large remote-image memory issues.
- `IMPORT-05`: Provide a contract that lets callers prevent duplicate pending imports.
- `TEST-01`: Unit tests for client request/normalization/error behavior.
- `TEST-02`: Unit tests for image import success/failure without state mutation.

## Existing Patterns to Reuse

### External Fetch Boundary

Use plain browser `fetch`, matching existing external integration style:

- `src/util/datasets.ts` fetches a remote dataset manifest and logs recoverable errors.
- `src/workflow/ImageWorkspace/ShareProtocol.tsx` uses browser fetch for model sharing.

Do not add `@openverse/api-client` in Phase 1. The API surface is one route and a local wrapper is simpler, easier to test, and avoids lockfile/dependency churn.

### Canvas Sample Shape

Existing image samples use:

- `src/state.ts`: `ISample.data: HTMLCanvasElement | AudioExample`
- `src/workflow/ClassEntry/Classification.tsx`: file/camera imports set `canvas.style.width = '58px'` and `canvas.style.height = '58px'` before inserting samples.
- `src/components/ImageGrid/Sample.tsx`: sample display expects readable canvas data via `image.toDataURL()`.
- `src/util/TeachableModel.tsx`: training consumes sample canvases through the classifier.

Phase 1 should return `HTMLCanvasElement`; it should not mutate `classState` directly. Phase 3 will insert `{ data: canvas, id: '' }`.

### Existing Remote Canvas Loading

The repo already uses `canvasFromURL` from `@genai-fi/base`:

- `src/util/datasetLoader.ts`
- `src/components/PeerDeployer/SampleProtocol.tsx`

For OpenVerse, use a project-local import boundary instead of blindly delegating to `canvasFromURL`, because Phase 1 must normalize errors, apply timeouts, bound dimensions, and prove canvas readability. The implementation may use native `Image` + canvas APIs directly, or wrap `canvasFromURL` only if the wrapper can still enforce those guarantees.

## Recommended Files

Create:

- `src/util/openverse.ts`
- `src/util/openverse.test.ts`
- `src/util/openverseImageImport.ts`
- `src/util/openverseImageImport.test.ts`

No UI files should be created in Phase 1.

## OpenVerse Client Contract

### Constants

Use these defaults:

- `OPENVERSE_IMAGES_URL = 'https://api.openverse.org/v1/images/'`
- `DEFAULT_OPENVERSE_PAGE_SIZE = 20`
- `mature=false`

Do not include client ID, client secret, bearer token, or authenticated browser credentials.

### Types

Recommended exported types:

```ts
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

export interface OpenVerseImageSearchResult {
    results: OpenVerseImageResult[];
    page: number;
    pageCount: number;
    pageSize: number;
    resultCount: number;
}

export interface SearchOpenVerseImagesOptions {
    query: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}
```

### Error Taxonomy

Use a typed error with stable codes so UI can map to German messages later:

```ts
export type OpenVerseSearchErrorCode =
    | 'empty-query'
    | 'network'
    | 'rate-limited'
    | 'http'
    | 'invalid-response';
```

Recommended class:

```ts
export class OpenVerseSearchError extends Error {
    readonly code: OpenVerseSearchErrorCode;
    readonly status?: number;
    readonly retryAfter?: string;
}
```

### Request Behavior

`searchOpenVerseImages(options)` should:

1. Trim `query`.
2. Throw `empty-query` for blank queries.
3. Clamp or default `page` to `1`.
4. Clamp or default `pageSize` to a small classroom-safe value, default `20`.
5. Build URL query params:
   - `q`
   - `page`
   - `page_size`
   - `mature=false`
6. Call `fetch(url.toString(), { signal })`.
7. Map `429` to `rate-limited` and preserve `Retry-After` header when present.
8. Map other non-OK responses to `http`.
9. Catch rejected fetches:
   - if `signal?.aborted`, rethrow the abort error or map cleanly so callers can ignore stale searches.
   - otherwise map to `network`.
10. Parse JSON and validate enough shape before normalizing.
11. Return a successful empty `results` array for valid empty responses. Use `invalid-response` only for malformed response shapes.

### Normalization Rules

Accept a result only when it has:

- `id` as string
- `url` as string
- `thumbnail` as string

Map:

- `url` -> `imageUrl`
- `thumbnail` -> `thumbnailUrl`
- `foreign_landing_url` -> `foreignLandingUrl`
- `license_url` -> `licenseUrl`

Drop malformed entries instead of crashing the whole response if at least one valid result exists. If no valid entries remain from a response that claimed results, throw `invalid-response`.

Preserve optional provenance fields internally, but Phase 2 must not display them.

## Remote Image Import Contract

### Types

Recommended exported types:

```ts
export interface ImportOpenVerseImageOptions {
    imageUrl: string;
    fallbackUrl?: string;
    timeoutMs?: number;
    maxSize?: number;
    signal?: AbortSignal;
}

export type OpenVerseImageImportErrorCode =
    | 'load-failed'
    | 'timeout'
    | 'decode-failed'
    | 'canvas-unreadable'
    | 'unsupported-image'
    | 'aborted';
```

Recommended class:

```ts
export class OpenVerseImageImportError extends Error {
    readonly code: OpenVerseImageImportErrorCode;
    readonly sourceUrl?: string;
}
```

### Import Behavior

`importOpenVerseImage(options)` should:

1. Try `imageUrl` first.
2. Set `image.crossOrigin = 'anonymous'` before setting `src`.
3. Load with a timeout, default around `10000` ms.
4. On failure, optionally try `fallbackUrl` such as the thumbnail.
5. Draw into a new canvas.
6. Bound dimensions to a default max, for example `512` px on the longest side, while preserving aspect ratio.
7. Validate readability before returning:
   - call `canvas.getContext('2d')`
   - after draw, call a readback operation such as `context.getImageData(0, 0, 1, 1)` or `canvas.toDataURL('image/png')`
   - catch `SecurityError` or other DOM exceptions and throw `canvas-unreadable`
8. Set display sizing consistent with existing samples:
   - `canvas.style.width = '58px'`
   - `canvas.style.height = '58px'`
9. Return the canvas.

Do not mutate class state in this utility. That is the guard that satisfies `IMPORT-03`: failures cannot corrupt class samples if callers only insert after the promise resolves.

### Duplicate Pending Import Contract

`IMPORT-05` is mostly a UI/integration concern, but Phase 1 should make it easy:

- Keep import utilities stateless and deterministic.
- Expose a stable `result.id` from the search client.
- Document that Phase 2/3 callers should track `importingResultId` and ignore clicks for the same result while pending.

Do not add global duplicate tracking in Phase 1.

## Tests to Plan

### `src/util/openverse.test.ts`

Use Vitest and mock `global.fetch`.

Required cases:

1. Blank query throws `OpenVerseSearchError` with `code === 'empty-query'`.
2. Request URL includes:
   - `https://api.openverse.org/v1/images/`
   - `q=<query>`
   - `page=1` by default
   - `page_size=20` by default
   - `mature=false`
3. Successful response normalizes `url`, `thumbnail`, `foreign_landing_url`, and `license_url`.
4. Optional provenance fields are preserved in returned type.
5. `429` response throws `code === 'rate-limited'` and keeps `Retry-After` if present.
6. Non-OK non-429 response throws `code === 'http'` with status.
7. Rejected fetch throws `code === 'network'`.
8. Missing or malformed `results` throws `code === 'invalid-response'`.
9. Empty `results` returns a successful `OpenVerseImageSearchResult` with `results.length === 0`.
10. Malformed entries are dropped, but all-malformed result arrays throw `invalid-response`.

### `src/util/openverseImageImport.test.ts`

JSDOM image loading is limited. Keep tests mostly at boundary behavior with controlled mocks:

1. Successful load creates an `HTMLCanvasElement`, applies max-size bounds, and sets 58px style dimensions.
2. Timeout rejects with `code === 'timeout'`.
3. Image load error rejects with `code === 'load-failed'`.
4. Canvas readback throwing `SecurityError` rejects with `code === 'canvas-unreadable'`.
5. Fallback URL is attempted when primary URL fails.
6. Abort signal rejects with `code === 'aborted'`.

Testing strategy may require injecting helper seams, for example:

```ts
type ImageLoader = (url: string, signal?: AbortSignal) => Promise<HTMLImageElement>;
```

or exporting small internal helpers only if needed. Prefer dependency injection through an optional test-only parameter over mocking browser constructors globally in many tests.

## Threat Model Notes

Phase 1 plans must include a `<threat_model>` block. Threats to account for:

- Third-party image URLs can taint canvases or fail unpredictably.
- Oversized remote images can consume memory.
- Browser-exposed OpenVerse credentials would leak; no secrets should be shipped.
- Network/rate-limit failures should not cascade into broken class state.
- `mature=false` is a best-effort client-side filter, not a moderation guarantee.

Mitigation in Phase 1:

- no browser credentials
- small page sizes
- typed recoverable errors
- image timeout
- max canvas size
- readback validation
- no state mutation in import utility

## Validation Architecture

Nyquist dimensions for Phase 1:

1. API contract sampling: mock representative OpenVerse success, empty, malformed, 429, 500, and network failure responses.
2. Import boundary sampling: mock success, timeout, load failure, canvas unreadability, fallback success, and abort.
3. Safety invariant: utilities never mutate class state; only return values/errors.
4. Resource invariant: returned canvases never exceed the configured max dimension.
5. Credential invariant: no client secret, bearer token, or authenticated OpenVerse config appears in source or tests.

Recommended validation commands:

- `npm test -- src/util/openverse.test.ts src/util/openverseImageImport.test.ts --run`
- `npm run lint`
- `npm run build`

## Plan Decomposition Recommendation

Use two plans in Phase 1:

1. **OpenVerse API Client**
   - Create `src/util/openverse.ts`
   - Create `src/util/openverse.test.ts`
   - Cover `OVAPI-01` through `OVAPI-05` and `TEST-01`

2. **OpenVerse Image Import Boundary**
   - Create `src/util/openverseImageImport.ts`
   - Create `src/util/openverseImageImport.test.ts`
   - Cover `IMPORT-01` through `IMPORT-05` and `TEST-02`

These can be Wave 1 parallel plans because the importer can accept raw URLs and does not need the API client implementation to exist. If planner wants stricter integration, Plan 2 can read `OpenVerseImageResult` type from `openverse.ts`, but that creates a dependency. Prefer avoiding that dependency in Phase 1.

## Files Likely Modified

- `src/util/openverse.ts` - new
- `src/util/openverse.test.ts` - new
- `src/util/openverseImageImport.ts` - new
- `src/util/openverseImageImport.test.ts` - new

No expected changes to:

- `src/workflow/ClassEntry/Classification.tsx`
- `src/components/OpenVerseImageSearch/**`
- `public/locales/**`
- `src/state.ts`

Those belong to later phases.

## Open Questions (RESOLVED)

- RESOLVED: Valid empty OpenVerse responses return a successful empty `results` array. The `OpenVerseSearchErrorCode` union does not include `no-results`; malformed response shapes throw `OpenVerseSearchError` with `code === 'invalid-response'`.
- RESOLVED: The importer supports an optional `fallbackUrl`, but it does not automatically invent a thumbnail fallback. Later UI/integration phases decide whether to pass the OpenVerse thumbnail as fallback.
- RESOLVED: Phase 1 uses `DEFAULT_OPENVERSE_IMPORT_MAX_SIZE = 512` as the maximum longest-edge canvas size unless a later implementation finding requires a documented change.

## Summary

Phase 1 should produce a narrow, tested foundation: `openverse.ts` for API search and `openverseImageImport.ts` for safe remote canvas conversion. Keep both modules UI-free, avoid credentials, validate canvas readability, and make all failure modes typed so later student-facing UI can stay simple and recoverable.
