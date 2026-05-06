# Coding Conventions

**Analysis Date:** 2026-05-06

## Naming Patterns

**Files:**
- Use PascalCase for React component files: `src/components/AppBar/AppBar.tsx`, `src/workflow/Trainer/Trainer.tsx`, `src/views/UnderTheHood/UnderTheHood.tsx`.
- Co-locate component tests with the implementation and use `.test.tsx`: `src/components/AppBar/AppBar.test.tsx`, `src/workflow/Trainer/Trainer.test.tsx`.
- Use lower camelCase for utility modules and hooks: `src/util/randomId.ts`, `src/util/useOrientation.ts`, `src/util/useTabActive.ts`.
- Use `*.module.css` or local `style.module.css` for CSS modules beside components: `src/workflow/TrainingData/trainingdata.module.css`, `src/views/Home/style.module.css`.
- Barrel files are sparse and named `index.ts` only for component package exports: `src/components/AppBar/index.ts`, `src/components/AlertModal/index.ts`, `src/workflow/Behaviour/index.ts`.

**Functions:**
- Use function declarations for top-level functions. `eslint-rules/top-level-function.js` enforces `local/top-level-function-declaration` and rejects top-level function expressions or arrow functions.
- Export components as named or default function declarations: `export default function ApplicationBar(...)` in `src/components/AppBar/AppBar.tsx`, `export function TrainingData(...)` in `src/workflow/TrainingData/TrainingData.tsx`.
- Use `use*` names for hooks: `useVariant` in `src/util/variant.ts`, `usePredictions` and `useModelTrainer` in `src/util/TeachableModel.tsx`.
- Use short local event handler names with existing prefixes: `doSave`, `doSettings`, `handleModalDelete`, `handleMoveToClass` in `src/components/AppBar/AppBar.tsx` and `src/workflow/TrainingData/TrainingData.tsx`.

**Variables:**
- Use lower camelCase for local variables and state setters: `activeIndex`, `setActiveIndex`, `modalState`, `setModalState` in `src/workflow/TrainingData/TrainingData.tsx`.
- Use uppercase constants for module-level constants that represent fixed values: `FEEDBACK_DELAY` and `LANGS` in `src/components/AppBar/AppBar.tsx`, `REMOTE_DATASETS_URL` in `src/util/datasets.ts`.
- Use descriptive Jotai atom names that end with domain nouns rather than `Atom`: `classState`, `modelState`, `predictionHeatmap`, `feedbackAtom` in `src/state.ts`.

**Types:**
- Use `interface Props` for component props near the component: `src/workflow/ClassEntry/SamplePreviewModal.tsx`, `src/components/AppBar/AppBar.tsx`, `src/util/TestWrapper.tsx`.
- Use `I*` interface names for shared domain state: `ISample`, `IClassification`, `IPrediction` in `src/state.ts`.
- Use union type aliases for finite string sets: `TMType` and `TrainingState` in `src/util/TeachableModel.tsx`, `BehaviourTypes` in `src/workflow/Behaviour/Behaviour.tsx`.
- Import types with `type` where needed to satisfy strict TypeScript and linting: `type TeachableModel` in `src/workflow/Trainer/Trainer.test.tsx`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc`.
- Key settings: 4-space indentation, spaces not tabs, semicolons, single quotes, trailing commas where ES5 allows them, `printWidth` 120, bracket spacing enabled, and `singleAttributePerLine` for JSX.
- Keep JSX props on separate lines for multi-prop components, matching `src/components/AppBar/AppBar.tsx` and `src/workflow/ClassEntry/SamplePreviewModal.tsx`.

**Linting:**
- Use ESLint flat config in `eslint.config.js` with `@eslint/js`, `typescript-eslint` recommended/strict/stylistic configs, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and local rules from `eslint-rules/top-level-function.js`.
- Run lint with `npm run lint`, which checks `./src/**/*.ts` and `./src/**/*.tsx` with `--max-warnings=0`.
- React rules require JSX keys, reject useless fragments, warn on array index keys, reject `javascript:` URLs, and enforce safe target blank usage in `eslint.config.js`.
- TypeScript is strict in `tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`, and `forceConsistentCasingInFileNames`.
- Avoid `any`; when unavoidable in tests or SDK mocks, use a local `eslint-disable-next-line @typescript-eslint/no-explicit-any` as in `src/workflow/Trainer/Trainer.test.tsx`.

## Import Organization

**Order:**
1. Framework and runtime imports first, usually React hooks and testing helpers: `react`, `react-router-dom`, `@testing-library/react`.
2. External UI/state/i18n/model dependencies next: `@mui/*`, `jotai`, `react-i18next`, `@genai-fi/base`, `@genai-fi/classifier`.
3. Internal app imports next, using either relative paths or the `@genaitm/*` alias.
4. CSS module imports are commonly near component-local imports: `style from './AppBar.module.css'`.

**Path Aliases:**
- Use `@genaitm/*` for source-root imports when crossing feature boundaries. It is configured in `tsconfig.json` and `vite.config.ts`.
- Relative imports remain common within nearby files: `../../state`, `./Behaviour`, `../General/General`.
- Use the alias for shared utilities and state from deeply nested files: `@genaitm/state`, `@genaitm/util/TestWrapper`, `@genaitm/workflow/Behaviour/Behaviour`.

## Error Handling

**Patterns:**
- For async browser or network operations, wrap in `try`/`catch`, log with `console.error` or `console.warn`, and update UI state instead of throwing from React effects: `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/components/DatasetPicker/DatasetPicker.tsx`, `src/util/TeachableModel.tsx`.
- Throw explicit `Error` objects in pure utility or setup functions when the caller must handle failure: `src/util/datasets.ts`, `src/util/xaiCanvas.ts`, `src/components/AudioRecorder/AudioRecorder.tsx`.
- Use `return null` for non-visual protocol/helper components and empty chart states: `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/util/Observer.tsx`, `src/views/UnderTheHood/AccuracyPerClass.tsx`.
- Prefer optional chaining and guard clauses before working with browser APIs or model state: `src/workflow/Behaviour/Audio.tsx`, `src/workflow/ClassEntry/SamplePreviewModal.tsx`, `src/util/TeachableModel.tsx`.

## Logging

**Framework:** console

**Patterns:**
- Use `console.error` for failed predictions, training, fetches, uploads, drag-and-drop processing, and device access: `src/util/TeachableModel.tsx`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/views/Input/SampleProtocol.tsx`.
- Use `console.warn` for recoverable missing sender/model/device conditions: `src/views/Collection/SampleCollector.tsx`, `src/workflow/Behaviour/Image.tsx`, `src/util/TeachableModel.tsx`.
- Keep logging out of simple render paths. Existing `console.log` calls are limited and should not be expanded except for temporary debugging: `src/views/Deployment/ProjectProtocol.tsx`, `src/workflow/ImageWorkspace/Workspace.tsx`.

## Comments

**When to Comment:**
- Use comments to explain non-obvious browser/test setup or state transitions, such as global test mocks in `src/setupTests.ts` and modal index adjustment in `src/workflow/TrainingData/TrainingData.tsx`.
- Keep comments short and local to the reason for the code. Avoid comments that restate JSX or trivial assignments.
- Remove stale commented-out implementation lines when touching nearby code; examples exist in `src/components/AppBar/AppBar.tsx` and `src/workflow/Trainer/Trainer.test.tsx`.

**JSDoc/TSDoc:**
- JSDoc is not a dominant pattern. Use inline interfaces and explicit TypeScript types instead.
- Use a block comment only for shared state semantics that are easy to misuse, matching `poseDetected` in `src/state.ts`.

## Function Design

**Size:** Keep pure utilities compact and directly tested, as in `src/workflow/Behaviours/patch.ts`. Component functions may be larger when they own UI workflow state, but keep helper handlers inside the component and named by action.

**Parameters:** Use a local `Props` interface for React components. Prefer explicit callback props such as `onClose`, `onDelete`, `onClassChange`, and `setData` in `src/workflow/ClassEntry/SamplePreviewModal.tsx` and `src/workflow/TrainingData/TrainingData.tsx`.

**Return Values:** Components return JSX or `null`. Hooks return domain values or callbacks from React/Jotai state. Utilities return explicit domain values and preserve references where behavior depends on identity, as tested in `src/workflow/Behaviours/patch.test.ts`.

## Module Design

**Exports:** Use default exports for many single-component files (`src/components/AppBar/AppBar.tsx`, `src/workflow/Preview/Preview.tsx`) and named exports for shared components/hooks/state that are imported directly (`src/state.ts`, `src/util/TeachableModel.tsx`, `src/views/UnderTheHood/UnderTheHood.tsx`).

**Barrel Files:** Use barrel files only when a directory exposes a stable public component entry. Do not add broad source-root barrels; import concrete modules through `@genaitm/*` or relative paths.

---

*Convention analysis: 2026-05-06*
