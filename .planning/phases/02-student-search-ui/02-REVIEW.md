---
phase: 02-student-search-ui
reviewed: 2026-05-06T21:52:50Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx
  - src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css
  - src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx
  - scripts/addOpenVerseLocaleKeys.cjs
  - public/locales/de-DE/image_adv.json
  - public/locales/en-GB/image_adv.json
  - public/locales/fi-FI/image_adv.json
  - public/locales/fr-FR/image_adv.json
  - public/locales/it-IT/image_adv.json
  - public/locales/ja-JP/image_adv.json
  - public/locales/kr-KR/image_adv.json
  - public/locales/krl-FI/image_adv.json
  - public/locales/pt-BR/image_adv.json
  - public/locales/ru-RU/image_adv.json
  - public/locales/si-LK/image_adv.json
  - public/locales/sv/image_adv.json
  - public/locales/sw/image_adv.json
  - public/locales/tr-TR/image_adv.json
  - public/locales/ua-UA/image_adv.json
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-06T21:52:50Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the Phase 2 OpenVerse dialog, CSS, focused component tests, locale propagation script, and all `trainingdata.openverse` locale additions. The implementation keeps result rendering image-only, does not import class-state/import mutation boundaries, and the locale key set is present across the reviewed bundles. One retry-state bug remains: retry can repeat the last successful query/page instead of the request that actually failed.

Verification run during review:

- `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` - passed, 7 tests.
- `node scripts/addOpenVerseLocaleKeys.cjs --check` - passed, validated 15 locale files.

## Critical Issues

### CR-01: BLOCKER - Retry Uses Stale Successful Query/Page Instead Of The Failed Request

**File:** `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:90`

**Issue:** The component records `submittedQuery` only after a successful response, then `handleRetry` reuses `submittedQuery || query.trim()` and `page > 0 ? page : 1`. If a student has successful results for "katze", changes the field to "hund", submits, and that request fails, retry searches "katze" because `submittedQuery` still contains the previous successful term. The same state shape breaks failed pagination retries: a failed page-2 load leaves `page` at 1, so retry fetches page 1 and can replace the already-rendered results instead of retrying and appending page 2. This violates the UI spec's recoverable retry behavior and the Phase 2 pagination contract.

**Fix:**
```tsx
const [retryRequest, setRetryRequest] = useState<{ query: string; page: number } | null>(null);

const runSearch = useCallback(async (nextQuery: string, nextPage: number) => {
    abortActiveSearch();
    const controller = new AbortController();
    activeSearch.current = controller;
    const currentRequestId = requestId.current;

    setRetryRequest({ query: nextQuery, page: nextPage });
    setShowEmptyQuery(false);
    setStatus(nextPage === 1 ? 'loading' : 'loading-more');

    try {
        const response = await searchClient({ query: nextQuery, page: nextPage, signal: controller.signal });
        if (controller.signal.aborted || currentRequestId !== requestId.current) return;

        setResults((currentResults) => nextPage === 1 ? response.results : [...currentResults, ...response.results]);
        setPage(response.page);
        setPageCount(response.pageCount);
        setSubmittedQuery(nextQuery);
        setRetryRequest(null);
        setStatus(response.results.length === 0 && nextPage === 1 ? 'empty' : 'results');
    } catch (error) {
        if (controller.signal.aborted || currentRequestId !== requestId.current) return;
        setStatus(error instanceof OpenVerseSearchError && error.code === 'rate-limited' ? 'rate-limited' : 'error');
    }
}, [abortActiveSearch, searchClient]);

const handleRetry = useCallback(() => {
    if (!retryRequest || isSearching) return;
    void runSearch(retryRequest.query, retryRequest.page);
}, [isSearching, retryRequest, runSearch]);
```

Clear or update `retryRequest` deliberately on new searches, successful retries, and empty-query handling so retry always targets the failed request.

## Warnings

### WR-01: WARNING - Retry Tests Only Assert Button Presence, Not Retry Behavior

**File:** `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:182`

**Issue:** The test suite checks that retry text and the `Erneut versuchen` button render, but it never clicks the retry action. As a result, the stale retry bug above passes the focused suite. The tests also do not cover retry after a failed `Mehr Ergebnisse` request, which is one of the high-risk async/pagination paths called out by the phase contract.

**Fix:** Add coverage that first creates successful results, then submits a different query that fails, clicks `Erneut versuchen`, and asserts the failed query is retried. Add a second case where page 2 fails, retry is clicked, and page 2 is fetched and appended without replacing page 1.

---

_Reviewed: 2026-05-06T21:52:50Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
