# External Integrations

**Analysis Date:** 2026-05-06

## APIs & External Services

**Peer-to-peer collaboration:**
- PeerJS-compatible peer server - Used to connect trainer, input, collection, and deployment views for peer-to-peer sample/model workflows.
  - SDK/Client: `@genai-fi/base/hooks/peer`, backed by `peerjs` from `package.json`.
  - Auth: `VITE_APP_PEER_KEY`; server location/config uses `VITE_APP_PEER_SERVER`, `VITE_APP_PEER_SECURE`, and `VITE_APP_PEER_PORT`.
  - Implementation: `src/components/PeerDeployer/PeerDeployer.tsx`, `src/views/Deployment/RemoteModel.tsx`, `src/views/Input/Input.tsx`, `src/views/Collection/Collection.tsx`, and `src/views/Collection/usePeerSender.ts`.
  - Status/check integration: `VITE_APP_PEER_URL` and `VITE_APP_API` are passed to `ConnectionStatus` in `src/components/ConnectionStatus/ConnectionStatus.tsx`.

**Model sharing API:**
- Model storage/sharing API - Uploads, deletes, and retrieves shared model zip projects under `/model/:code/`.
  - SDK/Client: browser `fetch`.
  - Auth: Not detected in client code.
  - Base URL: `VITE_APP_API`; `src/workflow/ImageWorkspace/ShareProtocol.tsx` falls back to `http://localhost:9001` for upload/delete.
  - Upload: `POST ${VITE_APP_API}/model/${code}/` in `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
  - Delete: `DELETE ${VITE_APP_API}/model/${code}/` in `src/workflow/ImageWorkspace/ShareProtocol.tsx`.
  - Download: `${VITE_APP_API}/model/${project}/project.zip` in `src/workflow/ImageWorkspace/loader.ts`.
  - Share link display: `${VITE_APP_API}/model/${code}/` in `src/workflow/ImageWorkspace/ExportDialog.tsx`.
  - External launch URL: model URL is embedded into `https://spoof.gen-ai.fi/teacher/` in `src/workflow/Preview/PreviewMenu.tsx`.

**Dataset catalog:**
- Generation AI dataset store - Fetches a public dataset manifest for picker/import workflows.
  - SDK/Client: browser `fetch`.
  - Auth: None.
  - URL: `https://store.gen-ai.fi/tm/datasets/datasets.json`.
  - Implementation: `src/util/datasets.ts`.
  - Image loading: `canvasFromURL` from `@genai-fi/base` is used by `src/util/datasetLoader.ts`, `src/components/DatasetTestPicker/DatasetTestPicker.tsx`, `src/workflow/Behaviour/Image.tsx`, and `src/components/PeerDeployer/SampleProtocol.tsx`.

**Localization files:**
- Static locale JSON files - Loaded over HTTP from the deployed app origin.
  - SDK/Client: `i18next-http-backend`, `i18next-browser-languagedetector`, `react-i18next`.
  - Auth: None.
  - Load path: `/locales/{{lng}}/{{ns}}.json` configured in `src/i18n.ts`.
  - Files: `public/locales/de-DE/**`, `public/locales/en-GB/**`, `public/locales/fi-FI/**`, `public/locales/fr-FR/**`, `public/locales/it-IT/**`, `public/locales/ja-JP/**`, `public/locales/kr-KR/**`, `public/locales/krl-FI/**`, `public/locales/pt-BR/**`, `public/locales/ru-RU/**`, `public/locales/si-LK/**`, `public/locales/sv/**`, `public/locales/sw/**`, `public/locales/tr-TR/**`, and `public/locales/ua-UA/**`.

**Feedback API:**
- Generation AI feedback endpoint - Optional feedback widget in the top application bar.
  - SDK/Client: `Feedback` component from `@genai-fi/base`.
  - Auth: Not detected in client code.
  - Base URL: `VITE_FEEDBACK_URL`.
  - Implementation: `src/components/AppBar/AppBar.tsx`.

**External user links:**
- GitHub issue reporting - Error boundary links to `https://github.com/knicos/genai-tm/issues` in `src/App.tsx`.
- Generation AI project and docs links - README and UI link to `https://www.generation-ai-stn.fi`, `https://tm.gen-ai.fi/`, `https://generation-ai-stn.fi`, and `https://www.gen-ai.fi/en/tools/TMMicrocontroller` in `README.md`, `src/views/About/About.tsx`, and `src/workflow/Output/SerialUSBConnector.tsx`.
- Machine Learning for Kids pretrained model instructions - Link target `https://machinelearningforkids.co.uk/#!/pretrained` appears in `src/workflow/ImageWorkspace/ExportDialog.tsx`.

## Data Storage

**Databases:**
- Not detected.
  - Connection: Not applicable.
  - Client: Not applicable.

**File Storage:**
- Browser local file export/import - Project files are saved and opened through `src/workflow/ImageWorkspace/saver.ts`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/SaveDialog.tsx`, and `src/workflow/ImageWorkspace/OpenDialog.tsx`.
- Remote model ZIP storage - Exposed through the model sharing API under `${VITE_APP_API}/model/:code/`; no storage provider implementation is present in this repo.
- Static assets and locale files - Served from `public/**`, including `public/locales/**`, images, icons, manifest, and `public/staticwebapp.config.json`.

**Caching:**
- In-memory dataset cache only - `DATASETS` module variable in `src/util/datasets.ts`.
- Browser session storage - Side panel width is stored in `window.sessionStorage` in `src/workflow/ImageWorkspace/Workspace.tsx`.
- No Redis, Memcached, service worker cache, or IndexedDB usage detected.

## Authentication & Identity

**Auth Provider:**
- Not detected for end users.
  - Implementation: The app is a public client-side SPA; peer/model/feedback calls do not include explicit bearer tokens, cookies, login flows, or identity provider SDKs in `src/**`.
- Peer server key:
  - Implementation: `VITE_APP_PEER_KEY` is passed as `peerkey` or `key` to peer clients in `src/components/PeerDeployer/PeerDeployer.tsx`, `src/views/Deployment/RemoteModel.tsx`, `src/views/Input/Input.tsx`, `src/views/Collection/Collection.tsx`, and `src/views/Collection/usePeerSender.ts`.
  - Treat as configuration for the PeerJS-compatible server, not user authentication.

## Monitoring & Observability

**Error Tracking:**
- None detected.
- Route-level error UI is implemented in `src/App.tsx` and links users to GitHub issues.
- Runtime errors are logged with `console.error` in files such as `src/util/datasets.ts`, `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/workflow/ImageWorkspace/loader.ts`, and `src/workflow/Output/SerialUSBConnector.tsx`.

**Logs:**
- Browser console logging only.
- CI publishes Vitest JUnit output via `PublishTestResults@2` in `azure-pipelines.yml`.

**Performance metrics:**
- `web-vitals` helper exists in `src/reportWebVitals.ts`, but `src/index.tsx` calls `reportWebVitals()` without a callback, so no metrics are sent externally.

## CI/CD & Deployment

**Hosting:**
- Azure Static Web Apps - Deployment tasks are defined in `azure-pipelines.yml`.
- Static web server - `README.md` says production can be deployed by copying `dist` to a web server.

**CI Pipeline:**
- Azure Pipelines - `azure-pipelines.yml`.
- Trigger: `main` branch and `v*` tags.
- Static stage: installs packages and runs `npm run lint`.
- Build stage: installs Node.js 22.x, runs `npm run build`, and publishes `dist` as `DistFolder`.
- Test stage: runs `CI=true npm run ci:test` and publishes `junit.xml`.
- Staging deploy: deploys from `main` to Azure Static Web Apps staging using `deployment_token`.
- Production deploy: deploys from version tags to Azure Static Web Apps using `deployment_token`.
- Package registry auth: CI appends GitHub Packages auth to `.npmrc` with `GITHUB_TOKEN`; the repository contains a `.npmrc` file whose contents were not read.

## Environment Configuration

**Required env vars:**
- `VITE_APP_PEER_SERVER` - PeerJS-compatible server host used by peer clients.
- `VITE_APP_PEER_SECURE` - Peer secure flag; code treats `'1'` as true.
- `VITE_APP_PEER_PORT` - Peer server port; defaults to `443` when not set.
- `VITE_APP_PEER_KEY` - Peer key; code defaults to `peerjs` when not set.
- `VITE_APP_PEER_URL` - Peer API/status URL passed to `ConnectionStatus`.
- `VITE_APP_API` - Model sharing/check API base URL used for upload/delete/download/share links.
- `VITE_FEEDBACK_URL` - Optional feedback endpoint for the `Feedback` component.
- `GITHUB_TOKEN` - CI package registry token used in `azure-pipelines.yml`.
- `deployment_token` - Azure Static Web Apps deployment token used in `azure-pipelines.yml`.

**Secrets location:**
- Runtime Vite variables are expected from the deployment/build environment; no `.env*` files were detected.
- `.npmrc` file present - contains package manager configuration and must not be read or quoted.
- CI secrets are referenced as Azure Pipeline variables in `azure-pipelines.yml`; actual values are not present in readable code.

**Configuration notes:**
- `README.md` documents `VITE_APP_APIURL`, but source code uses `VITE_APP_API` in `src/workflow/ImageWorkspace/ShareProtocol.tsx`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ImageWorkspace/ExportDialog.tsx`, and `src/workflow/Preview/PreviewMenu.tsx`.
- `README.md` documents `VITE_APP_PEER_SERVER`, `VITE_APP_PEER_SECURE`, `VITE_APP_PEER_PORT`, and `VITE_APP_PEER_KEY`; source code also uses `VITE_APP_PEER_URL`.

## Webhooks & Callbacks

**Incoming:**
- None detected in this repo. There is no server-side API implementation, webhook route, or backend handler under `src/**`.

**Outgoing:**
- Browser `fetch` to dataset manifest in `src/util/datasets.ts`.
- Browser `fetch` to dropped URL/file resources in `src/workflow/Input/FileInput.tsx` and `src/workflow/ClassEntry/Classification.tsx`.
- Browser `fetch` to model sharing API in `src/workflow/ImageWorkspace/ShareProtocol.tsx` and model loader in `src/workflow/ImageWorkspace/loader.ts`.
- PeerJS-compatible data-channel events for class/sample/model collaboration in `src/views/Collection/usePeerSender.ts`, `src/views/Collection/SampleProtocol.tsx`, `src/views/Input/SampleProtocol.tsx`, `src/views/Deployment/ProjectProtocol.tsx`, `src/components/PeerDeployer/SampleProtocol.tsx`, and `src/components/PeerDeployer/ShareProtocol.tsx`.
- New browser window launch to `https://spoof.gen-ai.fi/teacher/` with a remote model URL in `src/workflow/Preview/PreviewMenu.tsx`.

---

*Integration audit: 2026-05-06*
