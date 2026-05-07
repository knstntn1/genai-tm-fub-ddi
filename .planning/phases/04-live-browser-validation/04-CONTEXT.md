# Phase 4 Context: Live Browser Validation

## Goal

Prove the integrated OpenVerse image-search import feature against real browser conditions before v1 is considered complete.

## Accepted Defaults

The user accepted these defaults on 2026-05-07:

1. Validate the feature in a local browser with real OpenVerse searches, remote image import behavior, project save/load, and training.
2. Cover desktop, tablet, and mobile viewports.
3. Do not implement a proxy, cache, or disable switch in Phase 4. Document the need for follow-up infrastructure only if direct browser behavior proves unreliable.

## Phase Boundary

In scope:

- Run the local app and exercise the integrated image training workflow in browser conditions.
- Use real OpenVerse API searches and real result image URLs.
- Verify at least one successful OpenVerse result can be imported into an image class.
- Exercise failed-provider or failed-import behavior and confirm it is recoverable.
- Validate that imported samples remain normal samples for save/load and training.
- Check desktop, tablet, and mobile presentation for the `Bildsuche` entry point and the dialog grid/action behavior.
- Record whether direct browser import is sufficient for v1 or whether v2 should add proxy/cache/disable-switch work.

Out of scope:

- Adding a backend proxy/cache.
- Adding teacher/admin feature flags.
- Changing the student-facing v1 UX beyond defect fixes needed to pass validation.
- Adding visible license, attribution, source, creator, or advanced filter UI.

## Required Evidence

- Browser observations for real OpenVerse search and import.
- Viewport notes for desktop, tablet, and mobile.
- Save/load/training result for a project containing an OpenVerse-imported sample.
- Decision note on direct-browser viability.

## Constraints and Risks

- OpenVerse API and provider images are live external dependencies, so individual result availability and CORS headers may vary.
- Anonymous OpenVerse rate limits may affect repeated validation runs.
- `mature=false` is best effort and not a full classroom safety guarantee.
- This phase should distinguish a recoverable per-image provider failure from a product-blocking inability to import any representative result.
