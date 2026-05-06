# Feature Research

**Domain:** Classroom OpenVerse image-search import for browser-based image-classification training
**Researched:** 2026-05-06
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Must Have for Class Use)

Features students and teachers need for a trivial v1. Missing these means the workflow will fail in a classroom even if the API call works.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OpenVerse entry point inside each image class | Students should add examples while thinking about the current class, not navigate to a separate media manager. | LOW | Add alongside existing camera/file options in the class training UI. Label should be short and German-localized. |
| Single search input with explicit submit | A classroom flow needs one obvious action: type a term, search, pick an image. | LOW | Avoid advanced query syntax UI. Preserve the current class context while searching. |
| Image-only result grid | The project requirement is image training data; audio or mixed media results would confuse students. | LOW | Use the OpenVerse image endpoint and render thumbnails first. Keep visible metadata out of v1. |
| Clear loading, empty, and retry states | School networks are slow and students need to know whether the search is working. | MEDIUM | Show compact inline states, not modal errors. Empty results should invite a simpler search term. |
| Hover/focus action: "Dieses Bild nutzen" | Students need a clear import affordance without metadata clutter. | LOW | Hover alone is not enough for touch and keyboard; the same action must be reachable on focus/tap. |
| One-click import into the selected class | The selected image must become a normal training sample without download/upload steps. | MEDIUM | Convert the selected remote image into the same canvas/sample form used by existing file and camera imports. |
| Import confirmation in context | Students need immediate feedback that the sample landed in the right class. | LOW | The class sample count/grid should update immediately; a small success state is enough. |
| Robust failed-image handling | Remote images can fail, be blocked, disappear, or reject canvas conversion. | MEDIUM | Failed thumbnails should not break the grid. Failed imports should leave class state unchanged and allow another choice. |
| Basic pagination or "more results" | One page of results may be too narrow for common class labels. | MEDIUM | Keep it simple: load the next page button, not infinite scroll. Respect OpenVerse pagination. |
| Request throttling/debouncing | Many students may type and retry at once; the app should avoid wasteful request bursts. | LOW | Debounce typing if search-as-you-type is used; simpler v1 should search only on submit. |
| Classroom-safe default behavior | Teachers expect the app not to opt into sensitive or mature content. | LOW | OpenVerse search excludes mature items by default according to current docs; v1 should not expose a mature toggle. |
| Focused tests for search, render, and import | This touches core training-data state and an external API boundary. | MEDIUM | Mock the OpenVerse client, image load success/failure, and class-state insertion. |

### Differentiators (Nice Improvements)

Useful additions after v1 works. These improve classroom polish but are not required for the first simple workflow.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Search term seeded from class name | Reduces typing for students and keeps the search aligned with the class being trained. | LOW | Prefill but let students edit. Avoid auto-search on every class switch. |
| Duplicate prevention within a class | Prevents accidental repeated imports during group work or double-clicks. | MEDIUM | Compare OpenVerse result id/url and disable repeated import for that class. |
| Import progress on the chosen tile | Makes slow image conversion understandable without blocking the full grid. | LOW | Use per-tile busy state instead of a global modal. |
| Lightweight class-balance nudge | Helps students collect enough variety per class without teaching ML theory in the search UI. | MEDIUM | Example: if a class has very few samples, keep the add controls prominent. Do not enforce quotas. |
| Recent search terms per session | Helps students refine common classroom searches without persistent accounts. | LOW | Session-only memory avoids privacy and project-file complexity. |
| Teacher-configured default result count | Lets teachers tune bandwidth and attention span for a lesson. | MEDIUM | Put behind variant/config, not in the student UI. |
| Optional attribution metadata stored invisibly | Keeps future legal/product options open without adding v1 UI. | MEDIUM | Store only if it does not affect the training sample pipeline or saved-project compatibility. |
| Safer import proxy or image cache | Improves reliability when CORS, hotlink blocking, or canvas tainting prevents direct browser import. | HIGH | Defer unless direct client import fails in real browsers. Would change the current static-SPA architecture. |

### Anti-Features (Deliberately Do Not Build in v1)

Features that may sound useful but conflict with the simple classroom import goal.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Visible license and attribution panel | OpenVerse content is openly licensed and attribution matters. | User explicitly excluded visible license/attribution UI for v1; it would dominate the simple student task. | Keep v1 UI metadata-free. Revisit attribution as a separate legal/product phase. |
| Advanced filters for license, source, creator, file type, size, aspect ratio, or category | Power users can narrow results precisely. | Adds decision load for students and turns the feature into a search product. | Use only hidden safe defaults and simple pagination. |
| Safe-search/mature-content toggle | Teachers may ask how content is controlled. | A visible toggle invites students to change it; v1 cannot promise full moderation guarantees. | Do not expose mature search. Rely on OpenVerse default exclusion and document residual risk. |
| Search-as-you-type result fetching | Feels modern and fast. | Creates noisy classroom traffic, flicker, and accidental API bursts. | Search on submit; optionally debounce only if live search is later required. |
| Infinite scroll | Keeps students browsing. | Encourages browsing instead of collecting training data; harder to control focus and request volume. | Use a small page and a clear "Mehr Ergebnisse" action. |
| Full-screen media browser | Gives more space for images. | Pulls students out of the training workflow and hides class context. | Use an inline panel or lightweight dialog tied to the current class. |
| Bulk import many results at once | Speeds up dataset creation. | Students can flood a class with low-quality or near-duplicate images and miss the learning goal. | One-click single import; add duplicate prevention later. |
| Editing/cropping images before import | Improves sample quality. | Introduces an image editor and slows down the v1 workflow. | Import as-is; existing sample management can delete bad examples. |
| Persisted search history across projects/users | Helps resume work. | Raises privacy, save-format, and classroom shared-device concerns. | Session-only recent searches if needed later. |
| Backend proxy by default | Can solve CORS and rate-limit concerns centrally. | Current app is a static browser SPA; backend work increases deployment and operations scope. | Start with direct API/client import; add proxy only if browser validation proves it necessary. |

## Feature Dependencies

```text
OpenVerse entry point inside each image class
    └──requires──> Single search input with explicit submit
                       └──requires──> OpenVerse image-only client
                                           └──requires──> Loading/error/empty states

Image-only result grid
    └──requires──> Normalized result model with thumbnail/url/id
                       └──requires──> Robust failed-image handling

Hover/focus "Dieses Bild nutzen"
    └──requires──> One-click import into selected class
                       └──requires──> Existing class sample pipeline compatibility
                                           └──requires──> Import failure leaves class state unchanged

Basic pagination
    └──requires──> Search query state and page state
                       └──requires──> Request throttling or submit-only search

Duplicate prevention
    └──enhances──> One-click import into selected class

Invisible attribution metadata
    └──conflicts with──> "normal sample only" simplicity unless kept outside visible UI and tested with save/load

Advanced filters
    └──conflicts with──> v1 trivial student UX
```

### Dependency Notes

- **Entry point requires search input:** The feature only makes sense when launched from the class that receives the sample; a global search view creates ambiguity about target class.
- **Result grid requires normalized results:** UI components should not depend directly on OpenVerse response shapes; map API data into the fields needed by v1.
- **Import requires sample-pipeline compatibility:** Training, deletion, movement, save/load, and preview should treat imported images like camera/file samples.
- **Import failure must be atomic:** If image load or canvas conversion fails, do not add a partial sample, do not increment counts, and do not corrupt class state.
- **Pagination depends on query/page state:** Keep state small and reset page results when the query changes.
- **Advanced filters conflict with v1:** OpenVerse supports filters, but the milestone excludes them to preserve classroom simplicity.

## MVP Definition

### Launch With (v1)

- [ ] Add a German-localized OpenVerse/search button in each image class add-sample area.
- [ ] Provide one search field and submit action scoped to the selected class.
- [ ] Query OpenVerse image search and show a thumbnail grid with loading, empty, and error states.
- [ ] Show "Dieses Bild nutzen" on hover/focus/tap for each usable result.
- [ ] Import one selected result into the current class as a normal trainable image sample.
- [ ] Handle failed thumbnail loads, failed imports, empty results, and request errors without breaking the training-data screen.
- [ ] Provide simple next-page loading or "Mehr Ergebnisse" if additional result pages exist.
- [ ] Add tests for API-client mapping, result rendering, import success, and import failure.

### Add After Validation (v1.x)

- [ ] Seed search from class name once teachers confirm this helps more than it surprises.
- [ ] Prevent duplicate imports after double-clicks or repeated result selection become visible in testing.
- [ ] Add per-tile import progress if real network/image conversion feels slow.
- [ ] Store invisible attribution metadata only if legal/product follow-up requires future attribution support.
- [ ] Add teacher/variant-level result count configuration if bandwidth or attention-span issues appear in class.

### Future Consideration (v2+)

- [ ] Backend proxy/cache if direct browser image import is unreliable because of CORS, hotlink blocking, rate limits, or canvas tainting.
- [ ] Teacher-facing safety/filter configuration if classroom pilots show unacceptable result quality.
- [ ] Visible license/attribution UI if project policy changes from "Einfacher Import" to publication-ready reuse.
- [ ] Bulk import or curated collections only if the product goal shifts from learning-by-sampling to dataset assembly.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Class-scoped OpenVerse entry point | HIGH | LOW | P1 |
| Single search input and submit | HIGH | LOW | P1 |
| Image-only result grid | HIGH | LOW | P1 |
| Loading/empty/error states | HIGH | MEDIUM | P1 |
| Hover/focus "Dieses Bild nutzen" | HIGH | LOW | P1 |
| One-click import into selected class | HIGH | MEDIUM | P1 |
| Robust failed-image handling | HIGH | MEDIUM | P1 |
| Basic pagination / more results | MEDIUM | MEDIUM | P1 |
| Focused tests | HIGH | MEDIUM | P1 |
| Class-name search seed | MEDIUM | LOW | P2 |
| Duplicate prevention | MEDIUM | MEDIUM | P2 |
| Per-tile import progress | MEDIUM | LOW | P2 |
| Session recent searches | LOW | LOW | P3 |
| Invisible attribution metadata | LOW | MEDIUM | P3 |
| Backend proxy/cache | MEDIUM | HIGH | P3 unless direct import fails |

**Priority key:**
- P1: Must have for v1 launch
- P2: Should have after classroom validation
- P3: Nice to have or conditional on later constraints

## Classroom UX Guidance

- Keep the student path to four actions: choose class, search term, pick image, train.
- Make result tiles visual-first. Do not show title, license, creator, source, or advanced filter controls in v1.
- Preserve context: students should always know which class receives the imported image.
- Prefer recoverable inline states over blocking dialogs. A failed image should be something students can skip.
- Optimize for touch, keyboard, and shared classroom devices. Hover affordances need focus/tap equivalents.
- Keep browser/network load modest. Submit-only search plus explicit next-page loading is better for classrooms than live search and infinite scroll.

## Sources

- Local project context: `.planning/PROJECT.md` (validated scope, out-of-scope decisions, architecture constraints)
- Local architecture map: `.planning/codebase/ARCHITECTURE.md` (React/Vite SPA, Jotai state, training-data workflow boundaries)
- Local concerns map: `.planning/codebase/CONCERNS.md` (remote ingest reliability, untrusted input, in-browser memory limits)
- OpenVerse API client docs: https://docs.openverse.org/packages/js/api_client/index.html (image query example, unauthenticated client option, rate-limit header responsibility)
- OpenVerse media properties docs: https://docs.openverse.org/meta/media_properties/frontend.html (thumbnail, url, foreign landing URL, sensitivity, source, title fields)
- OpenVerse image search docs via current API documentation index: https://wordpress.github.io/openverse-api/reference/api/docs.html (image endpoint supports q, page, page_size, filters; results are ranked and paginated)
- OpenVerse search algorithm docs: https://wordpress.github.io/openverse-api/reference/search_algorithm.html (general query search, filters, mature items excluded by default)
- OpenVerse terms: https://docs.openverse.org/terms_of_service.html (rate-limit compliance, content hosted by third parties, license/attribution obligations and accuracy caveat)

---
*Feature research for: OpenVerse image search import into student image-classification training*
*Researched: 2026-05-06*
