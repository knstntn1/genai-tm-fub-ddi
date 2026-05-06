# Requirements: GenAI Teachable Machine OpenVerse Image Search

**Defined:** 2026-05-06
**Core Value:** Students can add useful image examples to a class through a trivial OpenVerse search flow without leaving the training-data workflow.

## v1 Requirements

Requirements for the initial OpenVerse image-search import feature. Each maps to roadmap phases.

### OpenVerse API Client

- [ ] **OVAPI-01**: The app can search OpenVerse images from the browser using a student-entered query.
- [ ] **OVAPI-02**: The OpenVerse search request uses image-only results and applies `mature=false` by default.
- [ ] **OVAPI-03**: The app normalizes OpenVerse responses into a local TypeScript result model that includes image URL, thumbnail URL, ID, title, dimensions, and provenance fields for future use.
- [ ] **OVAPI-04**: The OpenVerse client exposes typed recoverable errors for network failure, invalid responses, empty results, and rate limiting.
- [ ] **OVAPI-05**: The app does not expose OpenVerse client secrets or authenticated credentials in browser code.

### Remote Image Import

- [ ] **IMPORT-01**: The app can load a selected OpenVerse image and convert it into the same canvas/sample representation used by existing image training samples.
- [ ] **IMPORT-02**: The app verifies that a remote image is readable as canvas data before adding it to class state.
- [ ] **IMPORT-03**: Failed remote image loads, CORS/canvas-taint failures, decode failures, and timeouts leave class sample state unchanged.
- [ ] **IMPORT-04**: Imported OpenVerse images are bounded or resized so oversized remote images do not exhaust classroom browser memory.
- [ ] **IMPORT-05**: While an image import is pending, duplicate clicks on the same result cannot add duplicate partial samples.

### Student Search UI

- [ ] **UI-01**: Each image class training area offers an OpenVerse image-search entry point alongside existing camera/file sample options.
- [ ] **UI-02**: The search flow is scoped to the current class so the student can tell which class will receive the selected image.
- [ ] **UI-03**: Students can enter a single search term and submit it explicitly.
- [ ] **UI-04**: Search results render as an image-only grid without visible license, attribution, creator, source, or advanced filter metadata in v1.
- [ ] **UI-05**: Each result exposes the German action label `Dieses Bild nutzen` on hover and an equivalent focus/tap interaction for keyboard and touch users.
- [ ] **UI-06**: The UI shows concise German loading, empty-result, retryable-error, rate-limit, and failed-import states.
- [ ] **UI-07**: Students can load additional results with a simple next-page or `Mehr Ergebnisse` action when OpenVerse returns more pages.
- [ ] **UI-08**: The UI does not expose advanced OpenVerse filters such as license, source, creator, file type, aspect ratio, or mature-content controls in v1.

### Training Data Integration

- [ ] **TRAIN-01**: Clicking a usable OpenVerse result adds the converted image to the selected class as a normal trainable image sample.
- [ ] **TRAIN-02**: Imported OpenVerse samples appear in the existing class sample list/count immediately after successful import.
- [ ] **TRAIN-03**: Existing sample deletion, movement, project save/load, and model training continue to work with OpenVerse-imported samples.
- [ ] **TRAIN-04**: A stale or slow OpenVerse search/import cannot add an image to the wrong class after class state changes.
- [ ] **TRAIN-05**: OpenVerse search is only available for image-class training workflows and does not appear in non-image variants unless explicitly enabled later.

### Validation and Tests

- [ ] **TEST-01**: Unit tests cover OpenVerse client request construction, response normalization, empty results, invalid responses, and rate-limit errors.
- [ ] **TEST-02**: Unit tests cover remote image import success and failure without mutating class state on failure.
- [ ] **TEST-03**: Component tests cover the search dialog/grid loading, empty, error, result, hover/focus action, and pagination states.
- [ ] **TEST-04**: Integration tests cover adding a selected OpenVerse result to the intended class while leaving other classes unchanged.
- [ ] **TEST-05**: Browser/manual validation checks real OpenVerse searches, real image imports, CORS/canvas behavior, save/load, and training with imported samples.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Usability Enhancements

- **UX2-01**: The search dialog can prefill the query from the class name if classroom testing shows this helps students.
- **UX2-02**: The app can prevent importing the same OpenVerse result into the same class more than once.
- **UX2-03**: The app can show per-result import progress for slow remote image conversions.
- **UX2-04**: The app can remember recent search terms for the current browser session.

### Safety and Policy

- **SAFE2-01**: Teachers can configure or disable OpenVerse search per variant or deployment if classroom policy requires it.
- **SAFE2-02**: The app can add teacher-facing safety/filter controls if classroom pilots show result quality problems.
- **SAFE2-03**: The app can persist invisible OpenVerse provenance metadata if legal or product requirements later require attribution support.

### Infrastructure

- **INFRA2-01**: A backend proxy/cache can be added if direct browser OpenVerse image import is unreliable because of CORS, hotlink blocking, rate limits, or school-network constraints.
- **INFRA2-02**: The app can support cached or curated image collections if the product goal expands beyond interactive sample picking.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Visible license/attribution UI | The user explicitly selected "Einfacher Import" for v1; metadata would add complexity for students. |
| Advanced OpenVerse filters | Filters for license, source, creator, file type, aspect ratio, or mature content conflict with the trivial classroom UX. |
| Bulk import | Bulk selection can flood classes with low-quality or duplicate examples and undermines the learning-by-sampling workflow. |
| Full-screen media browser | A separate browser pulls students away from the current class and training workflow. |
| Image editing/cropping | Adds an image-editor scope that is not needed for the first OpenVerse sample import. |
| Persisted search history | Shared classroom devices and project-file compatibility make persistent history a poor v1 fit. |
| Backend proxy by default | The current app is a static SPA; proxy/cache work should only be added if validation proves direct browser import insufficient. |
| Complete content moderation guarantee | Client-only OpenVerse use with `mature=false` can reduce risk but cannot guarantee classroom-safe results. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OVAPI-01 | TBD | Pending |
| OVAPI-02 | TBD | Pending |
| OVAPI-03 | TBD | Pending |
| OVAPI-04 | TBD | Pending |
| OVAPI-05 | TBD | Pending |
| IMPORT-01 | TBD | Pending |
| IMPORT-02 | TBD | Pending |
| IMPORT-03 | TBD | Pending |
| IMPORT-04 | TBD | Pending |
| IMPORT-05 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| UI-05 | TBD | Pending |
| UI-06 | TBD | Pending |
| UI-07 | TBD | Pending |
| UI-08 | TBD | Pending |
| TRAIN-01 | TBD | Pending |
| TRAIN-02 | TBD | Pending |
| TRAIN-03 | TBD | Pending |
| TRAIN-04 | TBD | Pending |
| TRAIN-05 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| TEST-04 | TBD | Pending |
| TEST-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28

---
*Requirements defined: 2026-05-06*
*Last updated: 2026-05-06 after initial definition*
