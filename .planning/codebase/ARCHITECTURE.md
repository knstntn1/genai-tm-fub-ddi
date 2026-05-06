<!-- refreshed: 2026-05-06 -->
# Architecture

**Analysis Date:** 2026-05-06

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Browser SPA Shell / Routing                 │
│        `src/index.tsx`, `src/App.tsx`, `src/i18n.ts`         │
├──────────────────┬──────────────────┬───────────────────────┤
│  Main Workflow   │  Remote Views     │  Static/Config Views  │
│ `src/views/General` │ `src/views/Deployment` │ `src/views/Home` │
│ `src/workflow`   │ `src/views/Collection` │ `src/views/About` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│       Shared State, Model Hooks, Variant Context, UI         │
│ `src/state.ts`, `src/util/TeachableModel.tsx`,               │
│ `src/util/variant.ts`, `src/components`                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Browser APIs, @genai-fi libraries, PeerJS, static assets    │
│  `public/locales`, `public/*.jpg`, `@genai-fi/classifier`    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| React entry point | Initializes i18n, global CSS, smooth scrolling, unhandled video rejection suppression, and renders `App` in `StrictMode`. | `src/index.tsx` |
| App shell | Defines router routes, route-level lazy loading, Jotai provider, React DnD provider, and MUI style injection. | `src/App.tsx` |
| Variant route | Resolves `/:kind/:variant`, merges base/kind/variant/custom settings, and provides `VariantContext`. | `src/views/General/General.tsx` |
| Classifier container | Owns the workflow stepper, save reminder trigger, top app bar, settings dialog, and `Workspace` lifecycle callbacks. | `src/views/General/Classifier.tsx` |
| Workspace orchestrator | Composes training data, trainer, input, preview, behaviours, output, model load/save, deployment wrappers, and under-the-hood side panel. | `src/workflow/ImageWorkspace/Workspace.tsx` |
| Global state | Defines Jotai atoms for samples, behaviours, model, predictions, peer/session state, training metrics, model stats, and UI flags. | `src/state.ts` |
| Model facade | Wraps `@genai-fi/classifier` model creation, prediction, drawing, training, XAI registration, and statistics updates behind React hooks. | `src/util/TeachableModel.tsx` |
| Training data | Manages class cards, class additions, sample modal navigation, and sample movement/deletion through a controlled `classState` collection. | `src/workflow/TrainingData/TrainingData.tsx` |
| Trainer | Computes trainability, starts model training, displays training state, and updates the global `modelTraining` atom. | `src/workflow/Trainer/Trainer.tsx` |
| Input | Chooses webcam/audio/file/remote/dataset input tabs and calls `useTeachableModel().predict` for active inputs. | `src/workflow/Input/Input.tsx` |
| Behaviours | Keeps behaviour definitions aligned to trained labels and renders one behaviour editor per class. | `src/workflow/Behaviours/Behaviours.tsx` |
| Output | Uses the current prediction and behaviours to render output media, serial USB actions, and deploy link. | `src/workflow/Output/Output.tsx` |
| Peer deployer | Hosts PeerJS protocols for sample input, model/project sharing, analysis monitoring, and connection status. | `src/components/PeerDeployer/PeerDeployer.tsx` |
| Deployment view | Downloads/receives a remote model, captures live input, predicts, and renders `RawOutput` outside the authoring workspace. | `src/views/Deployment/PeerDeployment.tsx` |
| Collection view | Lets remote users capture/upload samples into a selected class through PeerJS. | `src/views/Collection/SampleCollector.tsx` |

## Pattern Overview

**Overall:** Client-side feature-folder React SPA with route-level page modules, shared Jotai atom state, context-driven feature variants, and hook-based model/service facades.

**Key Characteristics:**
- Routes live in `src/App.tsx` and load page modules from `src/views/*`; lazy route modules export `Component` for React Router.
- The core teachable-machine workflow is composed in `src/workflow/ImageWorkspace/Workspace.tsx`; workflow widgets are sibling panels connected visually through `@genai-fi/base` `WorkflowLayout`.
- Cross-widget state uses Jotai atoms from `src/state.ts`; local UI state remains in components unless another widget, route, or protocol needs it.
- Model operations are concentrated in `src/util/TeachableModel.tsx`; workflow components call hooks rather than constructing `@genai-fi/classifier` models directly.
- Product variants are data/config driven through `src/views/General/configuration.json` plus `VariantContext` from `src/util/variant.ts`.

## Layers

**Application Shell:**
- Purpose: Start the browser app, initialize global providers, register routes, and handle route errors.
- Location: `src/index.tsx`, `src/App.tsx`, `src/i18n.ts`
- Contains: React root creation, i18next setup, `createBrowserRouter`, global `Provider`, `DndProvider`, `StyledEngineProvider`.
- Depends on: React, React Router, Jotai, React DnD, MUI, i18next.
- Used by: All page modules and workflow components.

**View Routes:**
- Purpose: Own URL-specific page behavior and route parameters.
- Location: `src/views`
- Contains: `src/views/General/General.tsx`, `src/views/Deployment/PeerDeployment.tsx`, `src/views/Collection/Collection.tsx`, `src/views/Input/Input.tsx`, `src/views/Home/Home.tsx`, `src/views/About/About.tsx`, `src/views/SettingsDialog`.
- Depends on: React Router, shared atoms, `src/workflow`, `src/components`, `@genai-fi/base`.
- Used by: `src/App.tsx` route definitions.

**Workflow Widgets:**
- Purpose: Implement the authoring experience: class data collection, training, input prediction, preview, behaviours, output, save/load/export/clone.
- Location: `src/workflow`
- Contains: Feature folders for `TrainingData`, `ClassEntry`, `Trainer`, `Input`, `Preview`, `Behaviour`, `Behaviours`, `Output`, and `ImageWorkspace`.
- Depends on: `src/state.ts`, `src/util`, `src/components`, MUI, `@genai-fi/base`, `@genai-fi/classifier`.
- Used by: `src/views/General/Classifier.tsx` through `src/workflow/ImageWorkspace/Workspace.tsx`.

**Shared Components:**
- Purpose: Provide reusable UI and protocol building blocks across routes and workflow widgets.
- Location: `src/components`
- Contains: App bar, dataset pickers, audio recorders, image grid, connection status, deployers, modals, buttons, and style controls.
- Depends on: MUI, React DnD, `@genai-fi/base`, `src/state.ts`, `src/util`.
- Used by: `src/views/*` and `src/workflow/*`.

**State and Domain Utilities:**
- Purpose: Define global application state, model lifecycle hooks, variant context, dataset loading, XAI canvas handling, prediction statistics, browser/serial helpers.
- Location: `src/state.ts`, `src/util`
- Contains: Jotai atoms, `useTeachableModel`, `useModelCreator`, `useModelTrainer`, `useVariant`, XAI singleton, model stats calculation.
- Depends on: Jotai, React hooks, browser Canvas/Web APIs, `@genai-fi/classifier`.
- Used by: Workflow widgets, route modules, peer protocols, and under-the-hood views.

**External Protocols and Persistence:**
- Purpose: Save/load projects, broadcast models locally, publish models through HTTP, exchange models/samples through PeerJS.
- Location: `src/workflow/ImageWorkspace/saver.ts`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/components/Deployer`, `src/components/PeerDeployer`, `src/views/Deployment`, `src/views/Collection`, `src/views/Input`
- Contains: `ClassifierApp.save/load`, `fetch` upload/delete/load, `BroadcastChannel`, PeerJS data event handlers, QR/deployment routes.
- Depends on: `@genai-fi/classifier`, `@genai-fi/base/hooks/peer`, Vite `import.meta.env`.
- Used by: Workspace, output deploy link, deployment routes, remote collection/test input routes.

## Data Flow

### Primary Training and Prediction Path

1. Browser starts through `src/index.tsx:20`, wraps `App` in `React.StrictMode`, and imports `src/i18n.ts` before rendering.
2. `src/App.tsx:50` builds routes; `/:kind/:variant` lazy-loads `src/views/General/General.tsx` from `src/App.tsx:86`.
3. `src/views/General/General.tsx:25` reads optional compressed custom settings, merges `base`, kind, variant, and custom settings at `src/views/General/General.tsx:28`, then provides `VariantContext` at `src/views/General/General.tsx:36`.
4. `src/views/General/Classifier.tsx:18` owns step state and renders `Workspace` with completion/save callbacks at `src/views/General/Classifier.tsx:68`.
5. `src/workflow/ImageWorkspace/Workspace.tsx:74` ensures a model exists for the current variant through `useModelCreator`; default classes are initialized at `src/workflow/ImageWorkspace/Workspace.tsx:125`.
6. `src/workflow/TrainingData/TrainingData.tsx:181` renders class cards, and edits propagate via `setData` to `classState` from `src/state.ts:36`.
7. `src/workflow/Trainer/Trainer.tsx:56` derives trainability from enabled classes and sample counts; clicking train sets `modelTraining` at `src/workflow/Trainer/Trainer.tsx:99`.
8. `src/util/TeachableModel.tsx:233` trains a fresh `@genai-fi/classifier` model, adds samples sequentially at `src/util/TeachableModel.tsx:260`, trains at `src/util/TeachableModel.tsx:288`, stores stats at `src/util/TeachableModel.tsx:318`, and replaces `modelState` at `src/util/TeachableModel.tsx:324`.
9. `src/workflow/Input/Input.tsx:80` runs predictions from webcam/file/audio/remote/dataset sources through `useTeachableModel().predict`.
10. `src/util/TeachableModel.tsx:72` calls the model, writes `prediction` and `predictedIndex` at `src/util/TeachableModel.tsx:89`, and captures pose/XAI state when needed.
11. `src/workflow/Behaviours/Behaviours.tsx:36` patches behaviours when labels change, and `src/workflow/Output/Output.tsx:67` passes behaviours plus the current `predictedIndex` to `RawOutput`.
12. `src/workflow/Output/RawOutput.tsx:73` selects image/audio/embed/text/serial output for the predicted class.

### Project Save and Load Flow

1. `src/views/General/Classifier.tsx:60` triggers save by setting a callback consumed by `SaveDialog` in `Workspace`.
2. `src/workflow/ImageWorkspace/Workspace.tsx:164` writes `saveState` with `SaveProperties`.
3. `src/workflow/ImageWorkspace/saver.ts:41` observes `saveState`; when present it serializes model, behaviours, and optional samples through `ClassifierApp` at `src/workflow/ImageWorkspace/saver.ts:24`, then downloads the zip at `src/workflow/ImageWorkspace/saver.ts:32`.
4. `src/workflow/ImageWorkspace/loader.ts:52` loads a `project` URL query parameter through HTTP, or `src/workflow/ImageWorkspace/loader.ts:95` loads an uploaded file from `fileData`.
5. `src/workflow/ImageWorkspace/loader.ts:67` decodes the project zip with `ClassifierApp.load`, then updates `classState`, `modelState`, `behaviourState`, and `sessionCode`.

### Peer Deployment Flow

1. The authoring output link is built from session code/password at `src/workflow/Output/Output.tsx:55`; clicking it enables `p2pActive` at `src/workflow/Output/Output.tsx:39`.
2. `src/components/PeerDeployer/PeerDeployer.tsx:13` opens a PeerJS host named `tm-${sessionCode}` and installs `SampleProtocol`, `ShareProtocol`, and `Monitor`.
3. A remote deployment route receives `/deploy/p/:code` in `src/App.tsx:65`; `src/views/Deployment/PeerDeployment.tsx:91` creates `RemoteModel` after webcam activation.
4. `src/views/Deployment/ProjectProtocol.tsx:49` sends a `request` peer event; `src/components/PeerDeployer/ShareProtocol.tsx:31` responds with serialized model/project components.
5. `src/views/Deployment/ProjectProtocol.tsx:20` receives the project payload, calls `loadProject`, and hands model/behaviours back to `PeerDeployment`.
6. `src/views/Deployment/Display.tsx` predicts against remote webcam/file input and renders the shared `RawOutput`.

### Remote Sample Collection Flow

1. Collection route `/collect/:code/:classIndex` is registered at `src/App.tsx:69` and rendered by `src/views/Collection/Collection.tsx`.
2. `src/views/Collection/SampleCollector.tsx:69` captures webcam samples, and `src/views/Collection/SampleCollector.tsx:82` uploads files; each sends an `add_sample` event to the host.
3. `src/components/PeerDeployer/SampleProtocol.tsx:37` receives `add_sample`, converts the data URL to a canvas at `src/components/PeerDeployer/SampleProtocol.tsx:39`, and inserts it into `classState` or `inputImage`.
4. `src/components/PeerDeployer/SampleProtocol.tsx:52` acknowledges added samples; `src/views/Collection/SampleProtocol.tsx:18` receives sample state and class polling updates.
5. `src/views/Collection/SampleProtocol.tsx:36` polls `request_class` every five seconds to keep remote labels and sample IDs synchronized.

**State Management:**
- Use Jotai atoms from `src/state.ts` for state shared between unrelated widgets, route modules, protocols, and dialogs.
- Use local `useState` in components such as `src/views/General/Classifier.tsx` and `src/workflow/Input/Input.tsx` for UI-only state.
- Use React context from `src/util/variant.ts` for variant feature flags and namespace choices.
- Use module-level mutable state sparingly for browser-global side effects such as close-alert registration in `src/workflow/ImageWorkspace/Workspace.tsx` and XAI canvas singleton in `src/util/xaiCanvas.ts`.

## Key Abstractions

**Variant Context:**
- Purpose: Encodes feature flags and model type for each configured route variant.
- Examples: `src/util/variant.ts`, `src/views/General/General.tsx`, `src/views/General/configuration.json`
- Pattern: Route module merges JSON configuration into a typed React context; components call `useVariant()` rather than reading config directly.

**Jotai Atom Store:**
- Purpose: Shares workflow state across panels, dialogs, peer protocols, deployment, and output rendering.
- Examples: `src/state.ts`, `src/workflow/ImageWorkspace/Workspace.tsx`, `src/workflow/Output/Output.tsx`, `src/components/PeerDeployer/SampleProtocol.tsx`
- Pattern: Define atoms centrally in `src/state.ts`; mutate via `useAtom`/`useSetAtom` in owning components and read via `useAtomValue` in consumers.

**Teachable Model Hooks:**
- Purpose: Provide lifecycle and model operations for create, predict, draw, train, stats, and readiness.
- Examples: `src/util/TeachableModel.tsx`, `src/workflow/Trainer/Trainer.tsx`, `src/workflow/Input/Input.tsx`, `src/workflow/ImageWorkspace/Workspace.tsx`
- Pattern: Keep `@genai-fi/classifier` lifecycle logic in `src/util/TeachableModel.tsx`; UI widgets call hook functions.

**Workflow Widgets:**
- Purpose: Represent discrete visual/data-flow nodes in the teachable machine canvas.
- Examples: `src/workflow/TrainingData/TrainingData.tsx`, `src/workflow/Trainer/Trainer.tsx`, `src/workflow/Input/Input.tsx`, `src/workflow/Behaviours/Behaviours.tsx`, `src/workflow/Output/Output.tsx`
- Pattern: Render each node in a `Widget` or `data-widget="container"` and wire layout connections from `Workspace.CONNECTIONS`.

**Peer Event Protocol:**
- Purpose: Type and route model, sample, class, and analysis messages over PeerJS.
- Examples: `src/components/PeerDeployer/events.ts`, `src/components/PeerDeployer/SampleProtocol.tsx`, `src/components/PeerDeployer/ShareProtocol.tsx`, `src/views/Deployment/ProjectProtocol.tsx`, `src/views/Collection/SampleProtocol.tsx`
- Pattern: Define event union types once and implement protocol-specific headless React components that return `null`.

**Project Archive:**
- Purpose: Persist a model, behaviours, and optional samples as a portable zip.
- Examples: `src/workflow/ImageWorkspace/saver.ts`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`
- Pattern: Wrap `ClassifierApp.save`, `saveComponents`, and `load` behind small functions/components; write deserialized project data back into atoms.

## Entry Points

**Main Browser App:**
- Location: `src/index.tsx`
- Triggers: Vite loads `index.html` and executes the React bundle.
- Responsibilities: Initialize i18n, CSS, smooth-scroll polyfill, global video error suppression, and React root rendering.

**SPA Router:**
- Location: `src/App.tsx`
- Triggers: Rendered by `src/index.tsx`.
- Responsibilities: Provide Jotai, React DnD, MUI styling, route definitions, lazy route modules, and route error boundary.

**Variant Workflow Route:**
- Location: `src/views/General/General.tsx`
- Triggers: `/:kind/:variant` routes.
- Responsibilities: Validate route params, merge variant configuration, provide `VariantContext`, render the classifier workflow and privacy widget.

**Deployment Route:**
- Location: `src/views/Deployment/PeerDeployment.tsx`
- Triggers: `/deploy/p/:code`.
- Responsibilities: Retrieve a remote project over PeerJS, capture deployment input, and render output behaviours.

**Collection Route:**
- Location: `src/views/Collection/Collection.tsx`
- Triggers: `/collect/:code/:classIndex`.
- Responsibilities: Join a host peer session and send samples to the selected class.

**Remote Test Input Route:**
- Location: `src/views/Input/Input.tsx`
- Triggers: `/input/:code`.
- Responsibilities: Join a host peer session and send a sample as remote test input.

## Architectural Constraints

- **Threading:** The app runs in the browser main thread. Model training and prediction are asynchronous promises in `src/util/TeachableModel.tsx`; no app-owned Web Workers are present.
- **Global state:** Shared mutable app state is centralized in Jotai atoms in `src/state.ts`. Module-level mutable state also exists in `src/workflow/ImageWorkspace/Workspace.tsx` (`hasAlert`) and `src/util/xaiCanvas.ts` (`_instance`).
- **Circular imports:** No explicit circular dependency chain was validated by tooling. Avoid importing route modules from workflow widgets except existing leaf dependencies such as `src/workflow/ImageWorkspace/Workspace.tsx` importing `src/views/UnderTheHood/UnderTheHood.tsx`.
- **Browser-only APIs:** Canvas, Webcam, FileReader, BroadcastChannel, sessionStorage, Web Serial, and PeerJS code assumes a browser runtime; test or SSR-like code must mock those APIs.
- **Environment configuration:** Runtime endpoints are read from `import.meta.env.VITE_APP_*` in peer/deployment/loading code, for example `src/components/PeerDeployer/PeerDeployer.tsx` and `src/workflow/ImageWorkspace/loader.ts`.
- **Route module contract:** Lazy route files used by React Router export `Component`; keep this pattern for new `src/views/*` route modules.

## Anti-Patterns

### Direct Model Construction in UI Widgets

**What happens:** A widget bypasses `src/util/TeachableModel.tsx` and calls `createModel`, `model.predict`, or model training APIs directly.
**Why it's wrong:** Prediction, XAI registration, readiness, error handling, metrics, and atom updates are already coordinated in `src/util/TeachableModel.tsx`; bypassing it can desynchronize `modelState`, `prediction`, `predictedIndex`, `trainingHistory`, and `modelStats`.
**Do this instead:** Add or extend hooks in `src/util/TeachableModel.tsx` and call them from widgets such as `src/workflow/Input/Input.tsx` and `src/workflow/Trainer/Trainer.tsx`.

### Cross-Widget Prop Drilling for Shared State

**What happens:** State needed by deployment, output, dialogs, and workflow widgets is threaded through many intermediate components.
**Why it's wrong:** The workflow is intentionally composed from sibling widgets in `src/workflow/ImageWorkspace/Workspace.tsx`; prop drilling makes peer protocols and dialogs harder to coordinate.
**Do this instead:** Add central atoms to `src/state.ts` for shared workflow/domain state, and use local component state only for UI state that never leaves the component subtree.

### Reading Variant Configuration Outside Variant Context

**What happens:** A component imports `src/views/General/configuration.json` directly or infers feature availability from route strings.
**Why it's wrong:** `src/views/General/General.tsx` merges base, kind, variant, and custom compressed query configuration; direct reads skip overrides and create inconsistent behaviour.
**Do this instead:** Add properties to `IVariantContext` in `src/util/variant.ts` and consume them with `useVariant()`.

### Mixing Peer Protocol Concerns Into Visual Components

**What happens:** Visual UI components directly open peer connections or handle event protocol state.
**Why it's wrong:** Existing peer behaviours are implemented as headless protocol components that return `null`, keeping UI components focused and testable.
**Do this instead:** Put new host protocols under `src/components/PeerDeployer` and route-specific remote protocols under `src/views/Deployment`, `src/views/Collection`, or `src/views/Input`.

## Error Handling

**Strategy:** Handle recoverable UI/protocol/model errors close to the failing interaction, update visible alerts/snackbars where available, and log diagnostic details to `console` for developer investigation.

**Patterns:**
- Route-level unexpected errors render `ErrorComponent` in `src/App.tsx`.
- Model prediction failures clear predictions, set `predictedIndex` to `-1`, set `predictionError`, and log in `src/util/TeachableModel.tsx`.
- Model load failures are surfaced as a workspace snackbar through `src/workflow/ImageWorkspace/Workspace.tsx`.
- Project load/share protocol errors call `onError` callbacks and log in `src/views/Deployment/ProjectProtocol.tsx` and `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
- Drag/drop and file handling errors show `AlertModal` in components such as `src/workflow/ClassEntry/Classification.tsx` and `src/views/Collection/SampleCollector.tsx`.

## Cross-Cutting Concerns

**Logging:** Use `console.error`, `console.warn`, `console.log`, and `console.debug` directly. There is no centralized logging service in the app code.
**Validation:** Route params and variants are checked in `src/views/General/General.tsx`; model trainability is computed in `src/workflow/Trainer/Trainer.tsx`; file/drop validation is performed locally in input/sample components; TypeScript strict mode enforces compile-time contracts.
**Authentication:** No user identity layer is present. Peer deployment uses session code/password values from `src/state.ts`, URL query params, and peer channels, but there is no authenticated account/session abstraction.
**Internationalization:** i18next loads `/locales/{{lng}}/{{ns}}.json` from `public/locales` in `src/i18n.ts`; components select namespaces from `useVariant()`.
**Styling:** Feature folders use local CSS modules such as `src/workflow/Input/Input.module.css` and `src/views/Deployment/style.module.css`; global styles live in `src/index.css` and `src/App.css`.

---

*Architecture analysis: 2026-05-06*
