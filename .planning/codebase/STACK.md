# Technology Stack

**Analysis Date:** 2026-05-06

## Languages

**Primary:**
- TypeScript 5.8.3 - Application code in `src/**/*.ts` and React components in `src/**/*.tsx`; compiler settings are in `tsconfig.json`.
- TSX / React JSX - UI routes, workflow screens, and components in `src/App.tsx`, `src/views/**`, `src/workflow/**`, and `src/components/**`.

**Secondary:**
- JavaScript ESM - Build/support scripts and custom lint rule in `scripts/gitInfo.js` and `eslint-rules/top-level-function.js`.
- CSS / CSS Modules - Global styles in `src/index.css` and `src/App.css`; component-scoped modules such as `src/workflow/ImageWorkspace/TeachableMachine.module.css`.
- JSON - Static app config in `public/staticwebapp.config.json`, generated build metadata in `src/generatedGitInfo.json`, locale resources in `public/locales/**`, and feature configuration in `src/views/General/configuration.json`.

## Runtime

**Environment:**
- Browser-based single-page application built with Vite; entry point is `src/index.tsx`.
- Node.js 22.x is used in Azure Pipelines build/test jobs via `NodeTool@0` in `azure-pipelines.yml`.
- Browser APIs used directly include `fetch`, `navigator.mediaDevices`, `navigator.serial`, `navigator.clipboard`, `window.sessionStorage`, and `crypto.getRandomValues` in files such as `src/util/datasets.ts`, `src/components/AudioRecorder/AudioRecorder.tsx`, `src/workflow/Output/SerialUSBConnector.tsx`, `src/workflow/ImageWorkspace/ExportDialog.tsx`, `src/workflow/ImageWorkspace/Workspace.tsx`, and `src/util/randomId.ts`.

**Package Manager:**
- npm - Scripts and install workflow are defined in `package.json`; CI uses `npm ci` in `azure-pipelines.yml`.
- Lockfile: present, `package-lock.json` with lockfile version 3.
- `.npmrc` file present - contains package manager configuration and must not be read or quoted. CI appends GitHub Packages auth with `GITHUB_TOKEN` in `azure-pipelines.yml`.

## Frameworks

**Core:**
- React 19.1.1 - Main UI framework; app is rendered in `src/index.tsx` and routed in `src/App.tsx`.
- Vite 6.3.5 - Dev server, build tool, and test integration; configured in `vite.config.ts`.
- React Router / React Router DOM 7.8.1 - Browser routing and lazy route loading in `src/App.tsx`.
- Material UI 7.3.1 and Emotion 11.14.0 - Component library and styling engine used throughout `src/views/**`, `src/workflow/**`, and `src/components/**`.
- Jotai 2.12.4 - Atom-based client state in `src/state.ts`, consumed with `useAtom`, `useAtomValue`, and `useSetAtom` across workflow components.
- @genai-fi/base 4.4.3 - Shared Generation AI UI and peer helpers, including `Peer`, `ConnectionStatus`, `Webcam`, `WorkflowLayout`, `LangSelect`, `Feedback`, and `QRCode`.
- @genai-fi/classifier 1.2.1 - Teachable Machine classifier domain library used by `src/util/TeachableModel.tsx`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/saver.ts`, and `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
- TensorFlow.js 4.22.0 - In-browser ML runtime dependency; WebGPU backend package is installed as `@tensorflow/tfjs-backend-webgpu` 4.22.0 but the explicit import is commented out in `src/index.tsx`.

**Testing:**
- Vitest 3.1.1 - Test runner invoked by `npm test`, `npm run ci:test`, and `npm run coverage`; configured through `vite.config.ts`.
- jsdom 26.1.0 - Vitest browser-like test environment in `vite.config.ts`.
- Testing Library - React DOM and user-event testing dependencies in `package.json`.
- @vitest/coverage-v8 3.1.1 - Coverage provider used by `npm run coverage` and `npm run ci:test`.

**Build/Dev:**
- @vitejs/plugin-react-swc 3.9.0 - React/SWC transform plugin in `vite.config.ts`.
- TypeScript compiler - `npm run build` runs `tsc` before `vite build`.
- ESLint 9.39.3 with typescript-eslint 8.56.1 - Lint command in `package.json`; flat config in `eslint.config.js`.
- Prettier 2.8.4 - Installed dev dependency; no `.prettierrc` was detected.
- Azure Static Web Apps deployment - `azure-pipelines.yml` publishes the Vite `dist` artifact to staging from `main` and production from version tags.

## Key Dependencies

**Critical:**
- `@genai-fi/classifier` 1.2.1 - Owns model creation, loading, saving, and project packaging through `ClassifierApp`, `TeachableModel`, and `AudioExample` in `src/util/TeachableModel.tsx`, `src/workflow/ImageWorkspace/loader.ts`, and `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
- `@genai-fi/base` 4.4.3 - Provides app-specific UI primitives and peer communication hooks used in `src/components/PeerDeployer/PeerDeployer.tsx`, `src/views/Deployment/RemoteModel.tsx`, and `src/components/ConnectionStatus/ConnectionStatus.tsx`.
- `@tensorflow/tfjs` 4.22.0 - Browser ML runtime required by classifier functionality; tests mock it in `src/views/UnderTheHood/UnderTheHood.test.tsx` and `src/views/General/Classifier.test.tsx`.
- `peerjs` 1.5.4 - PeerJS-compatible peer dependency underlying peer-to-peer collaboration through `@genai-fi/base/hooks/peer`.
- `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector` - Runtime localization pipeline configured in `src/i18n.ts` and backed by `public/locales/**`.

**Infrastructure:**
- `file-saver` 2.0.5 - Saves project files in `src/workflow/ImageWorkspace/saver.ts`.
- `jszip` 3.10.1 - Project/model zip packaging dependency used by the classifier stack.
- `lz-string` 1.5.0 - Compresses and decompresses settings and route payloads in `src/views/Home/Model.tsx`, `src/views/General/General.tsx`, and `src/views/SettingsDialog/SettingsDialog.tsx`.
- `qrcode` 1.5.3 - QR code support dependency; app-level QR UI comes from `@genai-fi/base`.
- `react-dnd` 16.0.1 and `react-dnd-html5-backend` 16.0.1 - Drag/drop file and URL intake; provider is installed in `src/App.tsx`.
- `react-player` 2.12.0 - Embedded media playback in `src/workflow/Output/Embedding.tsx` and link handling in `src/workflow/Behaviour/links.ts`.
- `@mui/x-charts` 8.21.0 - Training/under-the-hood charts in `src/views/UnderTheHood/AccuracyPerEpoch.tsx` and `src/views/UnderTheHood/LossPerEpoch.tsx`.
- `web-vitals` 2.1.0 - Optional performance reporting helper in `src/reportWebVitals.ts`; no analytics callback is passed from `src/index.tsx`.
- `smoothscroll-polyfill` 0.4.4 - Browser smooth scroll polyfill initialized in `src/index.tsx`.

## Configuration

**Environment:**
- Vite exposes only `VITE_*` vars to client code. Runtime integrations read `VITE_APP_PEER_SERVER`, `VITE_APP_PEER_SECURE`, `VITE_APP_PEER_PORT`, `VITE_APP_PEER_KEY`, `VITE_APP_PEER_URL`, `VITE_APP_API`, and `VITE_FEEDBACK_URL`.
- Peer configuration is consumed in `src/components/PeerDeployer/PeerDeployer.tsx`, `src/views/Deployment/RemoteModel.tsx`, `src/views/Input/Input.tsx`, `src/views/Collection/Collection.tsx`, and `src/views/Collection/usePeerSender.ts`.
- Model sharing and loading use `VITE_APP_API` in `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/ExportDialog.tsx`, and `src/workflow/Preview/PreviewMenu.tsx`.
- Feedback UI uses `VITE_FEEDBACK_URL` in `src/components/AppBar/AppBar.tsx`.
- `README.md` lists `VITE_APP_APIURL`, while code references `VITE_APP_API`; use the code name when configuring deployments.
- No `.env*` files were detected in the repo scan.

**Build:**
- `package.json` scripts: `npm start`, `npm run build`, `npm run build:robot`, `npm run lint`, `npm test`, `npm run ci:test`, `npm run coverage`, `npm run clean`, and `npm run preview`.
- `vite.config.ts` enables React SWC, `@genaitm` alias to `src`, Vitest `jsdom`, V8 coverage reporters, and robot-mode inline dynamic imports.
- `tsconfig.json` targets ES2020 DOM, uses strict mode, bundler module resolution, React JSX transform, and `@genaitm/*` path alias.
- `tsconfig.node.json` covers `vite.config.ts`.
- `eslint.config.js` uses ESLint flat config, TypeScript strict/stylistic presets, React, React Hooks, React Refresh, and a local top-level-function rule.
- `public/staticwebapp.config.json` rewrites SPA routes such as `/image*`, `/pose*`, `/speech*`, `/hand*`, `/deploy*`, `/collect*`, `/input*`, `/about`, `/home`, and `/settings` to `index.html`.

## Platform Requirements

**Development:**
- Install Node.js and npm, then run `npm install` and `npm start` as documented in `README.md`.
- Use `npm run build` for production bundles and `npm test` for local tests.
- Chrome or another browser with needed media APIs is required for webcam, microphone, drag/drop, clipboard, and Web Serial features. Web Serial is used in `src/workflow/Output/SerialUSBConnector.tsx` and is not universally supported.
- Peer-to-peer features require a configured PeerJS-compatible server and API endpoints through the Vite env vars listed above.

**Production:**
- Static SPA output from `dist` can be copied to any web server according to `README.md`.
- Azure Static Web Apps is the configured CI/CD target in `azure-pipelines.yml`, using `deployment_token` for staging and production deployment tasks.
- The public homepage metadata is `https://www.generation-ai-stn.fi` in `package.json`; README points users to the hosted app at `https://tm.gen-ai.fi/`.

---

*Stack analysis: 2026-05-06*
