# Research: OpenVerse Stack and API Integration

**Date:** 2026-05-06
**Project:** GenAI Teachable Machine OpenVerse Image Search
**Focus:** Stack/API integration for a simple student-facing image search importer

## Executive Recommendation

Use the public OpenVerse image search endpoint through a small project-local TypeScript client, not a broad UI dependency or a generic search abstraction.

Recommended v1 shape:

- Client module: `src/util/openverse.ts` or `src/workflow/TrainingData/openverseClient.ts`
- Endpoint: `GET https://api.openverse.org/v1/images/`
- Required query: `q`
- Initial query params: `q`, `page`, `page_size`, `mature=false`
- Optional internal-only params: `extension=jpg,png`, `size=medium,large` if result quality needs tightening
- Result fields to keep: `id`, `title`, `url`, `thumbnail`, `width`, `height`, `foreign_landing_url`, `license`, `license_url`, `creator`, `source`, `mature`
- UI fields to display in v1: image only; title only as accessible label if needed
- Import target: existing class sample state, after loading the selected remote image into the same canvas/sample representation used by local image imports

Confidence: Medium-high. The endpoint and response shape are documented, but browser/CORS behavior for API calls and especially provider image URLs must be verified in implementation because imported image URLs come from many third-party hosts.

## Sources Checked

- OpenVerse JavaScript API client documentation: https://docs.openverse.org/packages/js/api_client/index.html
- OpenVerse API image search developer docs: https://wordpress.github.io/openverse-api/reference/api/docs.html
- OpenVerse media property documentation: https://docs.openverse.org/meta/media_properties/frontend.html
- OpenVerse search algorithm documentation: https://docs.openverse.org/api/reference/search_algorithm.html
- Project codebase map: `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`

## Current API Surface

OpenVerse exposes an image search route at `/v1/images/`. The official JavaScript client examples call this route with query params such as `q`, `license`, and `source`, and the client defaults to the public OpenVerse API when no `baseUrl` is supplied.

The lower-level REST route supports image search by query string. Documented optional filters include:

- `q`
- `license`
- `license_type`
- `creator`
- `tags`
- `title`
- `filter_dead`
- `extension`
- `mature`
- `qa`
- `page`
- `page_size`
- `source`
- `excluded_source`
- `category`
- `aspect_ratio`
- `size`

Search results are relevance-ranked and paginated. The API is designed for retrieving the most relevant results, not exhaustive bulk download.

## Response Fields Relevant to v1

The documented image search response includes pagination metadata:

- `page`
- `page_count`
- `page_size`
- `result_count`
- `results`

Each image result can include:

- `id`: OpenVerse identifier
- `title`: display/accessibility label
- `url`: direct media file URL from the provider
- `thumbnail`: OpenVerse thumbnail URL
- `foreign_landing_url`: original provider page
- `creator`, `creator_url`
- `license`, `license_version`, `license_url`
- `provider`, `source`
- `category`
- `filesize`, `filetype`
- `width`, `height`
- `tags`
- `attribution`
- `mature`
- `detail_url`
- `related_url`

For the v1 product decision, do not display license/attribution in the UI. Still keep the fields in the client result type because they are useful for future attribution, debugging, and safe filtering.

## Authentication and Rate Limits

The official `@openverse/api-client` documentation says unauthenticated requests are supported when credentials are not passed. It also supports authenticated requests with `clientId` and `clientSecret`.

Recommendation for this static SPA:

- Start with unauthenticated requests.
- Do not put client secrets in the browser.
- Do not add authenticated OpenVerse credentials unless a backend/proxy exists.
- Read rate-limit headers when available and surface a friendly retry state if the API returns throttling errors.

The official client does not automatically handle rate-limit backoff. A local `fetch` client should similarly treat 429 as a recoverable UI state, not as a hard app failure.

## Client Implementation Guidance

Prefer a tiny local client over adding `@openverse/api-client` for v1.

Rationale:

- The app already uses plain browser `fetch` for external JSON APIs in `src/util/datasets.ts` and model sharing in `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
- The v1 endpoint usage is narrow: one image search route and a small result projection.
- Avoid adding a dependency and lockfile churn until the integration needs typed coverage of many routes.
- A local client can normalize OpenVerse response shape into the app's own minimal type.

Suggested type shape:

```ts
export type OpenVerseImageResult = {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl: string
  width?: number
  height?: number
  source?: string
  foreignLandingUrl?: string
  license?: string
  licenseUrl?: string
  creator?: string
  mature?: boolean
}
```

Suggested request:

```ts
const params = new URLSearchParams({
  q: query,
  page: String(page),
  page_size: String(pageSize),
  mature: "false",
})

const response = await fetch(`https://api.openverse.org/v1/images/?${params}`)
```

Default `page_size` should be classroom-friendly, for example 20 or 24. Avoid very large pages because image grids and remote thumbnails can become slow on school devices.

## Image Loading and Training Sample Conversion

Search results should render `thumbnail` for browsing. On click, import the real image from `url` if possible.

Implementation should:

- Create an `HTMLImageElement`.
- Set `crossOrigin = "anonymous"` before assigning `src`.
- Load with timeout/error handling.
- Draw onto a bounded canvas using the app's existing sample sizing conventions.
- Add the canvas to the selected class using the same path used by existing local image/file samples.
- If the provider image fails due to CORS, network, format, or decode error, show a recoverable German message and leave class state unchanged.

Important distinction:

- The OpenVerse API JSON may be reachable from the browser.
- The actual provider image URL may still fail to load into a canvas without tainting, because `url` points to third-party hosts.

This risk must be tested with real OpenVerse results during implementation.

## UI Integration Stack

Use existing stack:

- React 19 components
- Material UI for dialog/search input/loading/errors
- Existing CSS/module style conventions in the workflow area
- Existing localization via `react-i18next` and `public/locales/**`
- Jotai/class state only where needed to add the selected sample

Likely component placement:

- `src/workflow/ClassEntry/` if the search action is per class card
- or `src/workflow/TrainingData/` if the search UI is owned by the training-data panel

Keep the search component local to image workflows. Do not expose it in speech/pose/hand variants unless the variant config explicitly supports image classes.

## What Not To Use

- Do not expose advanced OpenVerse filters in v1. They conflict with the "trivial for students" requirement.
- Do not display license, attribution, source, or creator metadata in the result grid for v1.
- Do not store secrets or OAuth credentials in Vite env vars for browser use.
- Do not add a backend proxy before proving it is required.
- Do not import huge original images directly into sample state without resizing.
- Do not mutate class state before the remote image has loaded and converted successfully.
- Do not use OpenVerse as a bulk dataset loader; this feature is an interactive sample picker.

## Recommended Build Order

1. Add local OpenVerse client with response normalization and tests.
2. Add remote image-to-canvas importer with timeout, CORS/error handling, and tests.
3. Add class-level search UI entry point and image-grid dialog.
4. Wire selected result into class sample insertion.
5. Add German and English localization strings.
6. Verify with real OpenVerse searches in browser.
7. Add regression tests for empty results, failed API, failed image load, and successful sample add.

## Open Questions for Implementation

- Does `https://api.openverse.org/v1/images/` allow direct requests from the deployed app origin in current production browsers?
- How often do common provider `url` images load into an untainted canvas with `crossOrigin="anonymous"`?
- Should v1 import thumbnails as fallback when full-size image URLs fail, or should it show an error and ask the student to choose another image?
- Should the app cap imported OpenVerse image dimensions to the same limits as local file imports?
- Should search default to the class name as the initial query, or start empty and require a student-entered term?

## Final Recommendation

Proceed with a direct browser `fetch` OpenVerse client and a carefully isolated remote-image importer. Keep v1 deliberately small: simple query, image grid, hover action, click-to-add, robust error states. Treat CORS/image-taint behavior as the highest technical uncertainty and validate it in the first implementation phase.
