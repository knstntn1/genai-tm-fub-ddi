# Agent Guide

## Project

GenAI Teachable Machine OpenVerse Image Search extends the existing browser-based GenAI Teachable Machine for students. The current milestone adds a simple class-scoped OpenVerse image search so students can pick a result and add it as training data for the current image class.

Core value: students can add useful image examples to a class through a trivial OpenVerse search flow without leaving the training-data workflow.

## Planning Context

Read these files before planning or implementing project work:

- `.planning/PROJECT.md` - product context, active requirements, constraints, decisions.
- `.planning/REQUIREMENTS.md` - v1 requirements and traceability.
- `.planning/ROADMAP.md` - phase order, goals, success criteria.
- `.planning/STATE.md` - current phase and accumulated context.
- `.planning/codebase/` - brownfield codebase map.
- `.planning/research/` - OpenVerse/API, feature, architecture, pitfall research.

Current next step: `$gsd-plan-phase 1`.

## Workflow Rules

- Follow the roadmap phase order unless the user explicitly changes it.
- Do not implement a later phase before its dependencies are planned and completed.
- Keep planning docs committed atomically when they change.
- Update requirement traceability when roadmap or scope changes.
- Preserve the v1 product decision: no visible license/attribution UI and no advanced OpenVerse filters.
- Treat direct browser OpenVerse import reliability as a known risk until Phase 4 validation is complete.

## Codebase Rules

- Prefer existing React, Material UI, Jotai, Vite, Vitest, and workflow-component patterns.
- Keep OpenVerse API handling isolated behind a small typed local client.
- Keep remote image loading/conversion isolated behind a testable import boundary.
- Convert and validate remote images before mutating class sample state.
- Make failed API/image/CORS/rate-limit cases recoverable and leave class state unchanged.
- Add focused tests for new client, importer, UI, and class-state integration behavior.

## UX Rules

- Optimize for students in classroom use.
- Keep the search flow class-scoped and visually simple.
- Show image results first; do not show license, attribution, creator, source, or advanced filter controls in v1.
- Use the action label `Dieses Bild nutzen` for selected images, with hover plus keyboard/touch access.
- Keep German classroom-facing strings concise and localized through the existing i18n setup.
