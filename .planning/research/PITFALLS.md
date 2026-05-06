# Pitfalls Research

**Domain:** OpenVerse remote image search/import for a browser-based GenAI Teachable Machine classroom workflow
**Researched:** 2026-05-06
**Confidence:** HIGH for browser/CORS and OpenVerse API behavior; MEDIUM for classroom content-safety effectiveness because no client-only filter can guarantee safe results.

## Critical Pitfalls

### Pitfall 1: Treating Search Results as Trainable Images Before Canvas Import Succeeds

**What goes wrong:**
The UI shows an OpenVerse result, the student clicks "Dieses Bild nutzen", and the app adds a sample that later cannot be trained, saved, previewed, cloned, or shared. The project stores image samples as `HTMLCanvasElement` objects, and existing save/share/image-grid paths call canvas APIs such as `toDataURL()`. If a remote image is drawn into a canvas without CORS approval from the image host, the canvas becomes tainted and readback operations throw `SecurityError`.

**Why it happens:**
OpenVerse returns metadata and URLs from many third-party providers. An image may display in an `<img>` element but still be unusable for canvas-backed ML import. The difference is easy to miss because visual display and canvas pixel readback have different browser security requirements.

**How to avoid:**
Import must be a two-step operation: first fetch/load the selected image with `crossOrigin = "anonymous"` or equivalent helper behavior; then draw it into a fresh bounded canvas and immediately prove the canvas is readable with a small `getImageData()` or `toBlob()` check. Only after that check passes should `classState` be updated. Use thumbnails only for the search grid; use a known import URL field for the selected image, and reject results that cannot become readable canvases. If direct browser import fails often for real OpenVerse providers, add a later backend/proxy phase rather than weakening sample-state guarantees.

**Warning signs:**
Images render in the result grid but disappear or fail when saving the project; browser console shows `SecurityError` near `toDataURL`, `toBlob`, or `getImageData`; Vitest tests only mock successful canvas creation; imported OpenVerse samples use raw URLs instead of canvas data in class state.

**Phase to address:**
Phase 1, before UI polish: build and test a dedicated `openverseImportToCanvas()` boundary that returns either a readable canvas or a typed failure. Phase 2 should decide whether a proxy is required based on real provider import success rates.

---

### Pitfall 2: Mutating Class Sample State Before Slow or Failed Remote Loads Finish

**What goes wrong:**
A student clicks a result, navigates away, changes the active class, deletes a class, or searches again while the image is still loading. When the request eventually resolves, the app inserts the sample into the wrong class, resurrects deleted state, duplicates a sample, or leaves a half-imported blank sample in the grid. In a classroom, many students can also trigger flaky networks and provider timeouts at once.

**Why it happens:**
Existing sample mutation patterns are synchronous and local-file oriented. Remote import introduces latency, cancellation, stale closures, and retry behavior. It is tempting to reuse the current "add sample" callback directly from a click handler without modeling pending/importing/error states.

**How to avoid:**
Keep remote import state separate from `classState` until import succeeds. Capture the target class identity at click time, but revalidate that the class still exists before committing. Use `AbortController` for search and image import, ignore stale responses by request ID, disable or show per-result importing state while one import is pending, and make duplicate clicks idempotent. Commit with functional Jotai updates so the latest state wins.

**Warning signs:**
OpenVerse code calls `setData([...data])` from a stale closure after `await`; import tests do not cover deleting/moving classes during load; a failed image leaves an empty tile; search cancellation is absent; loading indicators are global rather than per-result.

**Phase to address:**
Phase 1 must define the atomic import contract and stale-response behavior. Phase 3 should add regression tests for class deletion, active-class changes, duplicate clicks, and failed loads.

---

### Pitfall 3: Assuming OpenVerse Search Is Classroom-Safe Enough by Default

**What goes wrong:**
Students see or import inappropriate, violent, adult, hateful, or otherwise distracting images during a classroom exercise. Even if OpenVerse excludes mature results by default, the catalog is third-party metadata and sensitive material can be mislabeled or newly indexed.

**Why it happens:**
Search integrations often treat "openly licensed" as equivalent to "school safe." OpenVerse itself exposes fields such as `mature` and has reporting paths for mature or sensitive content, which means unsuitable content can exist in the ecosystem. The project also intentionally keeps v1 simple and avoids advanced filters, so safety decisions can become invisible or untested.

**How to avoid:**
Always send `mature=false` explicitly, even if it is the current default. Restrict v1 to image categories and source/license choices that are least likely to produce problematic material if product scope allows it. Add a local denylist for obvious risky classroom terms in German and English, handle empty/blocked queries as normal UI states, and keep the feature easy for teachers to disable via config if needed. Do not claim full content moderation in product copy or tests.

**Warning signs:**
No explicit `mature=false` parameter in the client; test fixtures omit `mature: true`; roadmap language promises "safe search"; search terms are sent exactly as typed with no local validation; there is no teacher/admin disable switch planned.

**Phase to address:**
Phase 1 should include explicit safe-search parameters and query validation. Phase 2 should add the disable/config path if classroom pilots show safety concerns. Phase 3 should test mature-result filtering and blocked-query behavior.

---

### Pitfall 4: Hitting Anonymous API Rate Limits During Classroom Use

**What goes wrong:**
The feature works during development but fails during a class where many students search repeatedly from the same school network. OpenVerse currently supports unauthenticated requests, but direct checks on 2026-05-06 showed anonymous response headers of `x-ratelimit-limit-anon_burst: 20/min` and `x-ratelimit-limit-anon_sustained: 200/day`. When limits are reached, students see generic failure states or keep retrying, making the problem worse.

**Why it happens:**
A static SPA cannot safely hold an OAuth client secret. Search-as-you-type, unbounded pagination, automatic retries, and multiple result-image checks multiply calls quickly. The official JavaScript client also does not automatically perform rate-limit backoff.

**How to avoid:**
Use explicit search submission instead of querying every keystroke. Debounce any live validation, cache recent successful query pages in memory, keep `page_size` small, and do not prefetch multiple pages. Read rate-limit headers when available, map HTTP 429 to a German classroom-friendly message, and avoid automatic retry loops. If pilots require heavier usage, roadmap a backend token/proxy phase that owns credentials and shared caching.

**Warning signs:**
Search fires on every keypress; no 429 test; UI says only "Fehler" for all network failures; code ignores rate-limit headers; credentials are proposed for Vite env vars; the feature has no cache or pagination cap.

**Phase to address:**
Phase 1 must include conservative request behavior and typed 429 handling. Phase 2 should decide whether backend proxy/authentication is needed after classroom-scale testing.

---

### Pitfall 5: Hiding Attribution in the UI Without Preserving Attribution Metadata

**What goes wrong:**
The v1 UI correctly follows the "Einfacher Import" decision by showing no visible attribution, but the app permanently loses source, creator, license, and landing-page data. Later export, teacher review, legal review, or attribution UI becomes impossible without re-querying OpenVerse, and saved student projects contain untraceable remote-origin samples.

**Why it happens:**
The existing sample type is canvas-centric and optimized for training, not provenance. Because v1 explicitly avoids visible metadata, developers may omit metadata entirely instead of storing it invisibly beside the sample.

**How to avoid:**
Separate display policy from data retention. Extend imported sample metadata, or add a sidecar map keyed by sample ID, to keep OpenVerse `id`, `title`, `creator`, `creator_url`, `license`, `license_url`, `foreign_landing_url`, `url`, `thumbnail`, `provider/source`, `attribution`, and import timestamp. Do not render it in v1 unless the product decision changes, but preserve enough data for future attribution/export work and debugging. If sample serialization cannot store metadata yet, document that as a deliberate roadmap item rather than silently dropping it.

**Warning signs:**
Only the canvas and generated sample ID are stored; OpenVerse response objects are discarded immediately after import; save/load tests ignore provenance; no migration note exists for sample schema changes; "no visible attribution" is interpreted as "no attribution data."

**Phase to address:**
Phase 1 should decide and implement invisible provenance storage, even if minimal. Phase 2 can add export or review affordances only if needed.

---

### Pitfall 6: Importing Oversized or Unexpected Remote Files Into Browser Memory

**What goes wrong:**
Large remote images stall the browser, exhaust memory, slow TensorFlow training, or make project save/share payloads much larger than expected. Some URLs may point to unsupported file types, redirects, error pages, or images with dimensions far beyond the model's useful input size.

**Why it happens:**
The existing codebase already has concerns around unbounded dataset image loading and URL fetches without status/type/size guards. OpenVerse image URLs are remote provider URLs, not project-controlled static assets, so the app must assume variability.

**How to avoid:**
Bound import dimensions before storing by drawing into the same normalized canvas size expected by the image model. Prefer thumbnails or small variants where usable and readable; otherwise load the full image only after selection. Check content type and decode failure where browser APIs expose them, reject SVG for canvas training unless explicitly supported, cap pixel count and import timeout, and keep per-class sample limits visible in the training workflow.

**Warning signs:**
Canvas dimensions match original image dimensions; no timeout; no max pixel budget; imports accept SVG/GIF/error-page responses; performance tests only use tiny fixtures; project save size grows unexpectedly after a few imports.

**Phase to address:**
Phase 1 should normalize imported canvases and add file/type/timeout guards. Phase 3 should include memory- and save-size regression tests.

---

### Pitfall 7: Letting Search UI Complexity Disrupt the Existing Training Workflow

**What goes wrong:**
The image search feature becomes a separate browsing experience with filters, metadata, side panels, or navigation that pulls students away from the immediate task: adding a sample to the current class. Students lose track of the active class, import into the wrong class, or spend class time exploring search results instead of training and comparing models.

**Why it happens:**
OpenVerse supports rich metadata and filtering, and many image-search integrations expose those controls. This project, however, is a student-facing ML training workflow where the requested v1 is deliberately simple.

**How to avoid:**
Keep the entry point inside the existing class card/training-data flow. Show only image results, a search input, empty/error/loading states, and the hover action "Dieses Bild nutzen." Anchor the dialog or panel to the target class label, and close or confirm clearly after successful import. Defer advanced filters, attribution display, and result-detail pages.

**Warning signs:**
OpenVerse search becomes a top-level route; result cards show license/source metadata in v1; advanced filters appear in the first phase; the import action does not name or preserve the target class; students can change class context mid-dialog without clear feedback.

**Phase to address:**
Phase 1 should enforce the minimal UI contract. Phase 2 can revisit filters only if classroom use shows a concrete need.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only imported canvases | Fastest path into current training pipeline | Loses provenance and makes future attribution/export hard | Never for OpenVerse imports; store at least sidecar metadata |
| Use raw OpenVerse response objects in React components | Avoids writing a client adapter | UI becomes coupled to external schema and harder to test | Only inside a small API-client test fixture |
| Add remote samples optimistically before image decode | Responsive click feedback | Corrupts class state on failed/tainted/slow imports | Never; use pending UI state instead |
| Search on every keypress | Feels modern in demos | Burns anonymous rate limits in classrooms | Avoid for v1; require explicit submit |
| Rely on provider image URLs forever | No storage/proxy work | Saved projects may become unreproducible if URLs break | Acceptable only because current sample pipeline stores canvas pixels after successful import |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenVerse API | Treat anonymous access as unlimited | Cap requests, cache query pages, handle 429, and plan proxy/auth only if classroom testing requires it |
| OpenVerse result metadata | Use `thumbnail` for training without checking quality/readability | Use thumbnails for grid display; import selected images through a tested readable-canvas path |
| Third-party image hosts | Assume a visible `<img>` means canvas import is allowed | Require CORS-enabled load and readback proof before mutating samples |
| Existing Jotai `classState` | Commit from stale async closures | Use functional updates, request IDs, aborts, and target-class revalidation |
| Existing save/share paths | Forget they call `toDataURL()` on samples | Test imported samples through save, image-grid rendering, and training addExample flows |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded result prefetch | Slow search, rate-limit failures, noisy network panel | Fetch one small page per explicit query; no automatic next-page prefetch | A single class repeatedly searches common terms |
| Full-resolution canvas storage | Browser memory spikes, slow save/share, sluggish training | Downscale on import to model-appropriate dimensions | A few high-resolution photos per class |
| Parallel image import checks for every result | Grid loads slowly and consumes provider/API/network capacity | Only validate trainable canvas on selected result | Result grid of 20+ images on school Wi-Fi |
| Retry loops on failed imports | Repeated 429/timeout failures and bad classroom UX | No automatic retry unless user clicks again; surface recoverable messages | Any provider outage or poor network |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Drawing arbitrary remote content into canvas without readback checks | Tainted samples break save/share/training and hide security failures until later | CORS-enabled load plus immediate readback proof |
| Accepting unexpected schemes or file types | `data:` bloat, SVG/script edge cases, or non-image responses enter training path | Accept only `https:` image URLs from OpenVerse fields and supported raster types |
| Putting OpenVerse OAuth secrets in Vite env vars | Secrets ship to every browser | Keep v1 anonymous or add a backend proxy that owns credentials |
| Promising full safe search | Teachers rely on a guarantee the integration cannot provide | Explicitly state and implement best-effort filtering, disable switch, and no guarantee |
| Dropping attribution metadata | Future compliance/export path is blocked | Store provenance invisibly even when v1 hides it |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic network errors | Students cannot recover or know whether to retry | Distinguish no results, blocked image, timeout, and rate limit in short German text |
| Global loading spinner for per-image import | The whole workflow feels frozen | Per-result pending state and disabled duplicate action |
| Importing into an implicit active class | Students add samples to the wrong class | Make the target class explicit in the dialog/panel and revalidate before commit |
| Showing advanced metadata/filter UI in v1 | Students spend time managing search instead of training | Keep result grid minimal; preserve metadata invisibly |
| Leaving failed tiles in sample grid | Students think failed samples are trainable | Do not add a sample until import succeeds; show failure near the search result |

## "Looks Done But Isn't" Checklist

- [ ] **Canvas import:** A selected OpenVerse image is added only after a readable canvas is created and `toDataURL()`/`toBlob()` or `getImageData()` succeeds.
- [ ] **Failed loads:** Timeout, 404/provider failure, decode failure, and CORS failure are tested and do not mutate `classState`.
- [ ] **Rate limits:** HTTP 429 and OpenVerse rate-limit headers are handled distinctly from generic network errors.
- [ ] **Content safety:** Requests explicitly include `mature=false`, tests include a mature fixture, and risky queries have a defined blocked/empty state.
- [ ] **Attribution decision:** No attribution is visible in v1, but provenance fields are preserved or a deliberate schema follow-up is documented.
- [ ] **Sample integrity:** Duplicate clicks, class deletion during import, class movement, and active-class changes cannot corrupt samples.
- [ ] **Save/share compatibility:** Imported samples survive image-grid rendering, training, save/load, and any existing share/export path that serializes canvases.
- [ ] **Classroom scale:** Search does not fire on every keystroke and remains usable when anonymous limits or school network failures appear.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tainted canvases stored in class state | HIGH | Add an import validator, reject unreadable samples, and migrate/delete existing OpenVerse samples that fail readback |
| Missing provenance metadata | MEDIUM | Add sidecar metadata keyed by sample ID; future projects can preserve it, older projects remain incomplete |
| Rate limits hit in classroom | MEDIUM | Disable live search, lower page size, cache responses, add 429 messaging, then consider backend proxy/auth |
| Unsafe content appears | MEDIUM | Add explicit filters/denylist, feature flag disable, teacher guidance, and report-link handling; avoid claims of full moderation |
| Async state corruption | HIGH | Refactor import into an atomic service, add request IDs and functional updates, then regression-test stale responses |
| Oversized imports | MEDIUM | Add dimension/type/timeout guards and downscale existing imported canvases where possible |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tainted/unreadable canvas import | Phase 1: Search client and import boundary | Unit tests mock successful, CORS-failed, decode-failed, and unreadable canvas paths; no state mutation on failure |
| Slow/failed load state corruption | Phase 1: Atomic sample import | Tests delete/change target class while import promise is pending and verify no wrong-class insert |
| Classroom content safety | Phase 1: Query and response filtering; Phase 2: teacher/config controls if needed | Client always sends `mature=false`; fixtures with `mature: true` are excluded; disable flag is documented if added |
| API rate limits | Phase 1: Conservative request behavior; Phase 2: proxy/auth decision | Explicit-submit search, small `page_size`, 429 test, visible rate-limit message, no Vite client secret |
| No-visible-attribution decision causing metadata loss | Phase 1: Provenance sidecar or schema extension | Saved/imported sample has invisible OpenVerse metadata while UI remains minimal |
| Oversized or unsupported files | Phase 1: Import normalization | Tests assert bounded canvas dimensions and rejection of unsupported types/timeouts |
| Search UI disrupting training workflow | Phase 1: Minimal class-scoped UI | Component test verifies search opens for a target class and imports into that class only |

## Sources

- Project context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/TESTING.md`.
- MDN, "Use cross-origin images in a canvas" (last modified 2025-09-18): documents tainted canvas behavior and `SecurityError` on `getImageData()`, `toBlob()`, and `toDataURL()`. https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image
- OpenVerse `@openverse/api-client` docs (crawled 2026-04/2026-05): documents anonymous clients, image search usage, authentication options, and that rate-limit backoff is caller responsibility. https://docs.openverse.org/packages/js/api_client/index.html
- OpenVerse API headers observed directly on 2026-05-06 from `https://api.openverse.org/v1/images/?q=cat&page_size=1`: anonymous burst limit `20/min`, anonymous sustained limit `200/day`, and `Vary: Accept, Authorization, origin`.
- OpenVerse API developer docs for image detail/search fields: image detail includes `url`, `thumbnail`, `creator`, `license`, `license_url`, `foreign_landing_url`, `attribution`, `mature`, dimensions, provider/source; image search supports filters including `mature`, `page_size`, `source`, category, aspect ratio, and size. https://wordpress.github.io/openverse-api/reference/api/docs.html
- OpenVerse search algorithm docs: default search behavior, relevance limitations, filtering fields, and mature-result handling. https://wordpress.github.io/openverse-api/reference/search_algorithm.html
- OpenVerse "Made with Openverse" docs: content is Creative Commons/public domain but license accuracy is not guaranteed. https://docs.openverse.org/api/reference/made_with_ov.html
- OpenVerse API Terms of Service, effective 2022-05-05: requires adherence to rate limits, registration requirements, applicable content terms, and proper attribution for CC-licensed works. https://docs.openverse.org/_preview/2205/terms_of_service.html

---
*Pitfalls research for: OpenVerse image search/import in browser ML training*
*Researched: 2026-05-06*
