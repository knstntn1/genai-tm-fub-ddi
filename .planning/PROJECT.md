# GenAI Teachable Machine OpenVerse Image Search

## What This Is

This is an extension of the existing GenAI Teachable Machine for students. In the image training workflow, students can already add class examples from the device camera or local files; this project adds a third, very simple option: search OpenVerse for an image and add a selected result directly as training data for the current class.

The feature is aimed at classroom use, where students should be able to enrich image classes quickly without dealing with complex search tools, licensing details, or file management. The search experience should show only image results, reveal a simple "Dieses Bild nutzen" action on hover, and add the clicked image to the selected class as a normal trainable sample.

## Core Value

Students can add useful image examples to a class through a trivial OpenVerse search flow without leaving the training-data workflow.

## Requirements

### Validated

- ✓ Students can create and train image classification projects with class-based examples — existing
- ✓ Students can add image samples from the device camera — existing
- ✓ Students can add image samples from local files or dropped/imported image sources — existing
- ✓ The app stores training samples in class state and trains browser-side classifier models from those samples — existing
- ✓ The app is a browser-based React/Vite SPA using Jotai state and the `@genai-fi/classifier` model layer — existing
- ✓ The workflow is localized and already supports German classroom-facing UI text — existing

### Active

- [ ] Add an OpenVerse image-search entry point to the image class training workflow alongside the existing camera and file options.
- [ ] Let students enter a simple search term and browse image-only OpenVerse results for the current class.
- [ ] Render search results as a clean image grid with no visible metadata, licensing details, or advanced filters in v1.
- [ ] On hover, show a short German action label such as "Dieses Bild nutzen" for each result.
- [ ] On click, import the selected OpenVerse image into the current class as a normal trainable image sample.
- [ ] Keep the import flow robust enough for classroom use: failed image loads or blocked remote images must not break the training-data screen.
- [ ] Add focused tests for OpenVerse search, result rendering, and adding a selected result to class training data.

### Out of Scope

- Visible license or attribution handling in v1 — the user explicitly chose "Einfacher Import" for the first version.
- Advanced search filters such as license, creator, source, file type, aspect ratio, or safe-search configuration — these add UI complexity beyond the student-facing v1 goal.
- A backend proxy for OpenVerse in v1 unless browser/CORS behavior makes direct client usage impossible — this repo is currently a static browser SPA.
- Full content moderation guarantees — v1 should be simple, but cannot promise perfect classroom-safe search results without a dedicated filtering strategy.
- Persisting OpenVerse attribution metadata in the UI — attribution may be revisited later if product or legal requirements change.

## Context

The existing codebase is a TypeScript React 19 SPA built with Vite, Material UI, Jotai, `@genai-fi/base`, `@genai-fi/classifier`, and TensorFlow.js. The core authoring workflow is composed in `src/workflow/ImageWorkspace/Workspace.tsx`, with training-data UI in `src/workflow/TrainingData/TrainingData.tsx`, class cards and sample handling under `src/workflow/ClassEntry`, and shared sample/model state in `src/state.ts`.

The current image-training path already supports camera capture, file import, drag/drop, sample movement/deletion, and browser-side model training. OpenVerse should therefore be integrated as another image sample source rather than as a separate dataset system or model feature.

The app already uses browser `fetch` for external resources such as the Generation AI dataset catalog in `src/util/datasets.ts` and model sharing APIs in `src/workflow/ImageWorkspace/ShareProtocol.tsx`. OpenVerse will become a new external browser API integration and should be isolated behind a small local API/client module so UI components do not depend directly on response shapes.

This project follows a brownfield path. The `.planning/codebase/` map was created before initialization and should be treated as the current reference for stack, architecture, conventions, testing, integrations, and concerns.

## Constraints

- **User experience**: The feature must be trivial for students; result browsing should show images first and avoid explanatory or administrative UI in v1.
- **Scope**: v1 uses "Einfacher Import"; no visible license or attribution layer should be added.
- **Architecture**: Use existing React, Material UI, Jotai, and workflow-component patterns rather than introducing a new state or UI framework.
- **Integration**: Use the OpenVerse API for image search and keep API handling isolated from presentation components.
- **Static SPA**: The current project has no backend. Prefer direct browser integration unless OpenVerse access requires a proxy.
- **Training data compatibility**: Imported OpenVerse images must enter the same class sample pipeline as existing image samples so training, save/load, and sample management continue to work.
- **Reliability**: Remote image failures, CORS issues, slow results, or empty searches must produce recoverable UI states and must not corrupt class state.
- **Testing**: Add focused tests around the new search client/component and the sample-add behavior because this touches a student-facing training workflow.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Add OpenVerse image search as a third image-sample source | Students need an easier way to add class examples without taking photos or managing local files | — Pending |
| Keep v1 as "Einfacher Import" without visible attribution UI | The user prioritized a trivial classroom workflow over licensing/metadata complexity for v1 | — Pending |
| Integrate selected results into existing class sample state | Training, sample management, and save/load should treat OpenVerse images like normal image examples | — Pending |
| Keep the feature inside the existing browser SPA | The current app is static and already uses browser-side external integrations | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after initialization*
