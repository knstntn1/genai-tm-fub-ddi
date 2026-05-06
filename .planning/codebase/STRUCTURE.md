# Codebase Structure

**Analysis Date:** 2026-05-06

## Directory Layout

```text
genai-tm-fub-ddi/
├── .planning/             # GSD planning and codebase map documents
├── .vscode/               # Editor configuration
├── eslint-rules/          # Custom ESLint rule implementation
├── public/                # Static web assets and locale JSON bundles
│   └── locales/           # i18next translation namespaces by locale
├── scripts/               # Build helper scripts
├── src/                   # React/Vite application source
│   ├── components/        # Reusable UI and protocol components
│   ├── util/              # Shared hooks, model helpers, browser/domain utilities
│   ├── views/             # Route-level page modules
│   └── workflow/          # Core teachable-machine workflow widgets
├── index.html             # Vite HTML entry document
├── package.json           # npm scripts and dependency manifest
├── package-lock.json      # npm lockfile
├── tsconfig.json          # TypeScript app configuration and path alias
├── tsconfig.node.json     # TypeScript config for Node-side Vite config
├── vite.config.ts         # Vite, Vitest, alias, and build configuration
└── azure-pipelines.yml    # Azure pipeline definition
```

## Directory Purposes

**`src/`:**
- Purpose: Contains all TypeScript/React application code for the browser SPA.
- Contains: App shell, route views, workflow widgets, reusable components, utilities, tests, global CSS.
- Key files: `src/index.tsx`, `src/App.tsx`, `src/state.ts`, `src/i18n.ts`, `src/setupTests.ts`

**`src/views/`:**
- Purpose: Route-level modules. Put code here when it owns a URL, route params, route query params, or page-level composition.
- Contains: `About`, `Collection`, `Deployment`, `General`, `Home`, `Input`, `SettingsDialog`, `UnderTheHood`.
- Key files: `src/views/General/General.tsx`, `src/views/General/Classifier.tsx`, `src/views/Deployment/PeerDeployment.tsx`, `src/views/Collection/Collection.tsx`, `src/views/Input/Input.tsx`

**`src/workflow/`:**
- Purpose: Core teachable-machine authoring workflow. Put new training/input/model/output workflow widgets here.
- Contains: `Behaviour`, `Behaviours`, `ClassEntry`, `ImageWorkspace`, `Input`, `Output`, `Preview`, `Trainer`, `TrainingData`.
- Key files: `src/workflow/ImageWorkspace/Workspace.tsx`, `src/workflow/TrainingData/TrainingData.tsx`, `src/workflow/Trainer/Trainer.tsx`, `src/workflow/Input/Input.tsx`, `src/workflow/Output/Output.tsx`

**`src/workflow/ImageWorkspace/`:**
- Purpose: Orchestrates the authoring workspace and project persistence/deployment actions.
- Contains: Workspace composition, save/open/export/clone dialogs, project save/load helpers, deployment wrapper, HTTP sharing protocol.
- Key files: `src/workflow/ImageWorkspace/Workspace.tsx`, `src/workflow/ImageWorkspace/saver.ts`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/DeployWrapper.tsx`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`

**`src/workflow/ClassEntry/`:**
- Purpose: Class cards and sample capture/editing UI for training data.
- Contains: Classification card, sample tile, webcam capture/settings, class menu, preview modal.
- Key files: `src/workflow/ClassEntry/Classification.tsx`, `src/workflow/ClassEntry/Sample.tsx`, `src/workflow/ClassEntry/WebcamCapture.tsx`, `src/workflow/ClassEntry/SamplePreviewModal.tsx`

**`src/workflow/Behaviour/` and `src/workflow/Behaviours/`:**
- Purpose: Per-class behaviour editors and behaviour list synchronization.
- Contains: Behaviour type editors for image/audio/text/embed output, behaviour patching helper, container that maps labels to editors.
- Key files: `src/workflow/Behaviour/Behaviour.tsx`, `src/workflow/Behaviour/Image.tsx`, `src/workflow/Behaviour/Audio.tsx`, `src/workflow/Behaviour/Text.tsx`, `src/workflow/Behaviour/Embed.tsx`, `src/workflow/Behaviours/Behaviours.tsx`, `src/workflow/Behaviours/patch.ts`

**`src/components/`:**
- Purpose: Reusable components and host-side protocol components shared by routes/workflow.
- Contains: App bar, buttons, modals, dataset pickers, audio recorders, image grids, deployer/peer deployer protocols, connection status, style controls.
- Key files: `src/components/AppBar/AppBar.tsx`, `src/components/button/Button.tsx`, `src/components/PeerDeployer/PeerDeployer.tsx`, `src/components/PeerDeployer/events.ts`, `src/components/ConnectionStatus/ConnectionStatus.tsx`, `src/components/DatasetPicker/DatasetPicker.tsx`

**`src/util/`:**
- Purpose: Shared hooks and domain/browser helpers. Put non-visual reusable logic here.
- Contains: Model lifecycle hooks, variant context, XAI canvas singleton, metrics calculation, dataset helpers, comms helpers, node activity helpers, audio validation, test wrapper.
- Key files: `src/util/TeachableModel.tsx`, `src/util/variant.ts`, `src/util/xaiCanvas.ts`, `src/util/modelStats.ts`, `src/util/comms.ts`, `src/util/datasetLoader.ts`, `src/util/TestWrapper.tsx`

**`public/`:**
- Purpose: Static assets copied to the built app root.
- Contains: Icons, manifest, static web app config, example images/audio thumbnails, GitHub icon, locale bundles.
- Key files: `public/manifest.json`, `public/staticwebapp.config.json`, `public/locales/en-GB/translation.json`, `public/locales/en-GB/image_adv.json`

**`eslint-rules/`:**
- Purpose: Custom local lint rules.
- Contains: Top-level function rule used by `eslint.config.js`.
- Key files: `eslint-rules/top-level-function.js`

**`scripts/`:**
- Purpose: Build-time helper scripts.
- Contains: Git info generation for `src/generatedGitInfo.json`.
- Key files: `scripts/gitInfo.js`

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML entry document with root element and app metadata.
- `src/index.tsx`: React root creation, i18n import, global CSS import, smooth-scroll polyfill, and app render.
- `src/App.tsx`: Router, providers, lazy route registration, route error boundary.
- `src/views/General/General.tsx`: Main workflow route module for `/:kind/:variant`.
- `src/views/Deployment/PeerDeployment.tsx`: Remote deployment route module for `/deploy/p/:code`.
- `src/views/Collection/Collection.tsx`: Remote collection route module for `/collect/:code/:classIndex`.
- `src/views/Input/Input.tsx`: Remote test input route module for `/input/:code`.

**Configuration:**
- `package.json`: npm scripts, runtime dependencies, dev dependencies.
- `vite.config.ts`: Vite React SWC plugin, Vitest jsdom setup, `@genaitm` alias, robot build mode.
- `tsconfig.json`: Strict TypeScript options, JSX mode, and `@genaitm/*` path alias.
- `eslint.config.js`: ESLint 9 flat config.
- `.prettierrc`: Prettier formatting settings.
- `public/staticwebapp.config.json`: Static web app routing/config file.
- `src/views/General/configuration.json`: Variant feature configuration for the main workflow.
- `src/generatedGitInfo.json`: Generated build/version metadata consumed by privacy widgets.

**Core Logic:**
- `src/state.ts`: Jotai atom definitions and shared TypeScript interfaces.
- `src/util/TeachableModel.tsx`: Model creation, prediction, drawing, training, readiness, and stats hooks.
- `src/workflow/ImageWorkspace/Workspace.tsx`: Main workflow composition and cross-widget lifecycle.
- `src/workflow/TrainingData/TrainingData.tsx`: Training class list and sample modal operations.
- `src/workflow/ClassEntry/Classification.tsx`: Per-class sample capture/drop/upload/dataset behavior.
- `src/workflow/Trainer/Trainer.tsx`: Training UI and trigger logic.
- `src/workflow/Input/Input.tsx`: Prediction input source orchestration.
- `src/workflow/Behaviours/Behaviours.tsx`: Behaviour list synchronization with model labels.
- `src/workflow/Output/RawOutput.tsx`: Output rendering for image/audio/embed/text/serial results.

**Persistence and Sharing:**
- `src/workflow/ImageWorkspace/saver.ts`: Project archive creation and download.
- `src/workflow/ImageWorkspace/loader.ts`: Project archive loading from file or URL.
- `src/workflow/ImageWorkspace/ShareProtocol.tsx`: HTTP upload/delete sharing protocol.
- `src/components/Deployer/Deployer.tsx`: BroadcastChannel-based local model deployment.
- `src/components/PeerDeployer/PeerDeployer.tsx`: PeerJS host wrapper for authoring sessions.
- `src/components/PeerDeployer/SampleProtocol.tsx`: Host-side sample/class event handling.
- `src/components/PeerDeployer/ShareProtocol.tsx`: Host-side peer model/project sharing.
- `src/components/PeerDeployer/events.ts`: Shared peer event union types.
- `src/views/Deployment/ProjectProtocol.tsx`: Remote deployment project request/receive protocol.
- `src/views/Collection/SampleProtocol.tsx`: Remote collection polling and acknowledgement protocol.

**Internationalization:**
- `src/i18n.ts`: i18next setup and locale detection.
- `public/locales/*/translation.json`: Default translation namespace bundles.
- `public/locales/*/image_adv.json`: Advanced image workflow namespace bundles.

**Testing:**
- `src/setupTests.ts`: Vitest/testing-library setup and shared mocks.
- `src/util/TestWrapper.tsx`: Shared test wrapper utility.
- `src/**/*.test.tsx`, `src/**/*.test.ts`: Co-located component/unit tests.

## Naming Conventions

**Files:**
- Route/view components use PascalCase component filenames inside PascalCase folders: `src/views/Deployment/PeerDeployment.tsx`, `src/views/General/Classifier.tsx`.
- Workflow component folders use PascalCase names with main component files matching the component: `src/workflow/Trainer/Trainer.tsx`, `src/workflow/Output/Output.tsx`.
- Utility files use camelCase names: `src/util/randomId.ts`, `src/util/modelStats.ts`, `src/util/useTabActive.ts`.
- CSS modules are co-located and use either component names or local legacy names: `src/workflow/Output/Output.module.css`, `src/workflow/TrainingData/trainingdata.module.css`, `src/views/Deployment/style.module.css`.
- Tests are co-located with source and use `.test.tsx` or `.test.ts`: `src/workflow/Trainer/Trainer.test.tsx`, `src/workflow/Behaviours/patch.test.ts`.
- Index barrel files are limited and explicit: `src/components/AppBar/index.ts`, `src/components/AlertModal/index.ts`, `src/workflow/Behaviour/index.ts`.

**Directories:**
- Top-level source directories are responsibility-based: `src/views`, `src/workflow`, `src/components`, `src/util`.
- Feature directories are PascalCase for UI/component domains: `src/components/DatasetPicker`, `src/workflow/ImageWorkspace`, `src/views/UnderTheHood`.
- Static locale directories use BCP-47-like locale names matching i18n supported languages: `public/locales/en-GB`, `public/locales/de-DE`, `public/locales/pt-BR`.

## Where to Add New Code

**New Route/Page:**
- Primary code: `src/views/<PageName>/<PageName>.tsx`
- Route registration: `src/App.tsx`
- Styles: `src/views/<PageName>/style.module.css` or `<PageName>.module.css`
- Tests: `src/views/<PageName>/<PageName>.test.tsx`
- Use `export function Component()` for lazy React Router route modules loaded from `src/App.tsx`.

**New Workflow Widget:**
- Primary code: `src/workflow/<WidgetName>/<WidgetName>.tsx`
- Styles: `src/workflow/<WidgetName>/<WidgetName>.module.css`
- Tests: `src/workflow/<WidgetName>/<WidgetName>.test.tsx`
- Composition point: `src/workflow/ImageWorkspace/Workspace.tsx`
- Shared state: Add atoms to `src/state.ts` only when sibling widgets, dialogs, routes, or protocols need the value.

**New Behaviour Type:**
- Editor component: `src/workflow/Behaviour/<TypeName>.tsx`
- Type integration and toggle: `src/workflow/Behaviour/Behaviour.tsx`
- Behaviour list synchronization: `src/workflow/Behaviours/patch.ts`
- Output rendering: `src/workflow/Output/RawOutput.tsx`
- Tests: `src/workflow/Behaviour/<TypeName>.test.tsx` and update `src/workflow/Behaviour/Behaviour.test.tsx`

**New Model Operation:**
- Hook/facade code: `src/util/TeachableModel.tsx`
- Supporting pure calculations: `src/util/<name>.ts`
- Shared metrics/state: `src/state.ts`
- UI trigger: relevant workflow widget under `src/workflow`
- Tests: co-located tests for the widget plus utility tests if pure logic is extracted.

**New Peer Protocol/Event:**
- Event type: `src/components/PeerDeployer/events.ts`
- Host-side protocol: `src/components/PeerDeployer/<ProtocolName>.tsx`
- Host installation: `src/components/PeerDeployer/PeerDeployer.tsx`
- Remote route protocol: `src/views/Deployment`, `src/views/Collection`, or `src/views/Input`, depending on URL ownership.
- Keep protocol components headless when possible; return `null` and communicate through hooks/callbacks.

**New Shared Component:**
- Implementation: `src/components/<ComponentName>/<ComponentName>.tsx`
- Styles: `src/components/<ComponentName>/<ComponentName>.module.css` or `style.module.css`
- Tests: `src/components/<ComponentName>/<ComponentName>.test.tsx`
- Export barrel: Add `src/components/<ComponentName>/index.ts` only when existing import style needs it.

**Utilities:**
- Shared hooks: `src/util/use<Name>.ts` or `src/util/use<Name>.tsx`
- Pure helpers: `src/util/<camelName>.ts`
- Test helpers: `src/util/TestWrapper.tsx` or a narrowly named helper under `src/util`
- Prefer the `@genaitm/*` alias from `tsconfig.json`/`vite.config.ts` for cross-folder imports that would otherwise climb several levels.

**Translations and Static Assets:**
- Default copy: `public/locales/<locale>/translation.json`
- Advanced image namespace: `public/locales/<locale>/image_adv.json`
- Static images/icons: `public/`
- Do not import locale JSON directly in components; use `useTranslation(namespace)` with namespace from `useVariant()`.

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow planning state and generated codebase documentation.
- Generated: Yes
- Committed: Project-dependent; this run writes `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md`.

**`public/locales/`:**
- Purpose: Runtime-loaded i18next translation files.
- Generated: No
- Committed: Yes

**`src/generatedGitInfo.json`:**
- Purpose: Build/version metadata imported by privacy widgets.
- Generated: Yes, via `scripts/gitInfo.js`
- Committed: Present in repository

**`eslint-rules/`:**
- Purpose: Repository-local ESLint rules.
- Generated: No
- Committed: Yes

**`node_modules/` and `dist/`:**
- Purpose: Installed dependencies and production build output.
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-06*
