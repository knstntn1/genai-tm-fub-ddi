---
phase: 01-openverse-client-import-boundary
reviewed: 2026-05-06T21:03:45Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/util/openverse.ts
  - src/util/openverse.test.ts
  - src/util/openverseImageImport.ts
  - src/util/openverseImageImport.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-06T21:03:45Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues

## Summary

Reviewed the Phase 1 OpenVerse search client, importer boundary, and focused tests. The implementation keeps credentials and class-state mutation out of the reviewed source, and the focused Vitest suite passes. However, two correctness gaps remain: importer cancellation can be ignored after image load starts, and pagination clamps allow `NaN` request parameters.

## Critical Issues

### CR-01: Abort and Timeout Stop Applying During Decode/Canvas Validation

**Classification:** BLOCKER
**File:** `src/util/openverseImageImport.ts:107`
**Issue:** `loadImage` calls `finish()` as soon as `image.onload` fires, which clears the timeout and removes the abort listener before `image.decode()` resolves. After that point, an abort signal is ignored and the import can still resolve with a canvas. `importWithLoader` also does not re-check `signal.aborted` before `canvasFromImage`, so an aborted or stale import can proceed into draw/readback validation. Later UI can reasonably rely on `signal` to prevent stale imports from adding to the wrong class; this violates the typed abort contract.
**Fix:**
```typescript
image.onload = () => {
    void (async () => {
        try {
            if (image.decode) {
                await image.decode();
            }
            finish(() => resolve(image));
        } catch {
            finish(() => reject(toImportError('decode-failed', sourceUrl)));
        }
    })();
};

async function importWithLoader(
    url: string,
    loader: ImageLoader,
    maxSize: number,
    signal?: AbortSignal
): Promise<HTMLCanvasElement> {
    const image = await loader(url, signal);
    if (signal?.aborted) {
        throw toImportError('aborted', image.currentSrc || image.src || url);
    }
    return canvasFromImage(image, maxSize);
}
```
Add a test where `decode()` remains pending, the controller aborts, and `importOpenVerseImage` rejects with `code === 'aborted'`.

## Warnings

### WR-01: `NaN` Pagination Options Produce Invalid OpenVerse Requests

**Classification:** WARNING
**File:** `src/util/openverse.ts:93`
**Issue:** `Math.max(1, Math.floor(options.page ?? 1))` and the equivalent `pageSize` expression do not handle `NaN`. If a caller passes `page: Number.NaN` or `pageSize: Number.NaN`, the request URL contains `page=NaN` or `page_size=NaN` instead of the documented defaults/clamps. That breaks the Phase 1 request-construction contract and can surface as avoidable HTTP/API errors.
**Fix:**
```typescript
function integerOrFallback(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
}

const page = Math.max(1, integerOrFallback(options.page, 1));
const pageSize = Math.min(
    50,
    Math.max(1, integerOrFallback(options.pageSize, DEFAULT_OPENVERSE_PAGE_SIZE))
);
```
Add tests for `page: Number.NaN` and `pageSize: Number.NaN` to lock the default behavior.

---

_Reviewed: 2026-05-06T21:03:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
