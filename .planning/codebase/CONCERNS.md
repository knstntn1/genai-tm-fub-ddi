# Codebase Concerns

**Analysis Date:** 2026-05-06

## Tech Debt

**Drag/drop data handling uses broad `any` payloads:**
- Issue: Native drag/drop handlers disable `@typescript-eslint/no-explicit-any` and rely on untyped `items` shapes from React DnD.
- Files: `src/workflow/Behaviour/Behaviour.tsx:67`, `src/workflow/ClassEntry/Classification.tsx:120`, `src/workflow/Input/FileInput.tsx:37`, `src/views/Input/SampleProtocol.tsx:65`, `src/views/Collection/SampleCollector.tsx:105`, `src/views/Deployment/Deployment.tsx:62`
- Impact: URL, HTML, and file branches can drift from the real runtime payload without compiler failures. Mistakes in `items.files`, `items.urls`, `items.items`, or `items.html` handling become runtime-only bugs.
- Fix approach: Introduce a local drag payload adapter, for example `src/util/dragDrop.ts`, that normalizes native DnD payloads into discriminated unions for files, URLs, and HTML. Use that adapter in all drag/drop handlers and remove per-file eslint disables.

**Training progress is hard-coded to 50 epochs:**
- Issue: `useModelTrainer` computes progress with `setEpochs(epoch / 50)` while the UI allows custom epoch counts through `settingEpochs`.
- Files: `src/util/TeachableModel.tsx:291`, `src/util/TeachableModel.tsx:297`, `src/workflow/Trainer/Trainer.tsx:38`
- Impact: Progress is inaccurate when users choose any epoch count other than 50, and long or short training runs can show misleading completion state.
- Fix approach: Compute progress from `settings.epochs`, for example `(epoch + 1) / settings.epochs`, and clamp to `[0, 1]`.

**Training failure leaves stale stage and model resources:**
- Issue: When `tm.train()` throws, the catch block logs and returns without resetting `stage`, disposing the newly created model, or surfacing a user-visible error.
- Files: `src/util/TeachableModel.tsx:287`, `src/util/TeachableModel.tsx:313`
- Impact: The UI can remain in the training state until caller cleanup runs, and failed training can leave TensorFlow resources allocated.
- Fix approach: Wrap training in `try/finally`; on failure set `stage` to `none` or an explicit `error` state, dispose `tm`, and expose the failure through a state atom or callback that `src/workflow/Trainer/Trainer.tsx` renders.

**Peer collaboration protocol is duplicated across views:**
- Issue: Multiple peer wrappers repeat server, key, port, and protocol wiring instead of using one typed collaboration client.
- Files: `src/views/Collection/usePeerSender.ts:113`, `src/views/Collection/Collection.tsx:14`, `src/views/Input/Input.tsx:14`, `src/views/Deployment/RemoteModel.tsx:20`, `src/components/PeerDeployer/PeerDeployer.tsx:13`
- Impact: Security options, defaults, and event validation can diverge between collection, input, deployment, and model sharing flows.
- Fix approach: Add a shared peer configuration/helper module under `src/components/PeerDeployer/` or `src/util/peer.ts`, and require all peer entry points to use the same typed protocol guards.

## Known Bugs

**Invalid `project` query can leave the loader stuck:**
- Symptoms: `ModelLoader` sets `loadState` to true before validating the `project` query. If `mapToURL()` returns undefined, the effect returns without setting loading back to false.
- Files: `src/workflow/ImageWorkspace/loader.ts:52`, `src/workflow/ImageWorkspace/loader.ts:57`
- Trigger: Open the app with a `project` query that is neither an `http*` URL nor an eight-character alphanumeric code.
- Workaround: Remove the invalid `project` query parameter and reload.

**Audio drop fetch has no status or size guard:**
- Symptoms: Dropping an audio URL fetches the entire response and wraps it as `audio/*` without checking `response.ok`, content type, or content length.
- Files: `src/workflow/ClassEntry/Classification.tsx:130`, `src/workflow/ClassEntry/Classification.tsx:131`, `src/workflow/ClassEntry/Classification.tsx:133`
- Trigger: Drop a URL that returns an error page, very large file, or non-audio response while using the speech variant.
- Workaround: Use local audio files or trusted small URLs until URL validation and size limits are added.

**Serial connection state can report connected without a writer:**
- Symptoms: After `navigator.serial.requestPort()` and `conn.open()`, the UI sets `serialConnection` true even if `conn.writable` is unavailable or locked.
- Files: `src/workflow/Output/SerialUSBConnector.tsx:50`, `src/workflow/Output/SerialUSBConnector.tsx:61`, `src/workflow/Output/SerialUSBConnector.tsx:62`
- Trigger: Connect to a port whose writable stream is absent or locked.
- Workaround: Disconnect and reconnect; code should verify `openWriter.current` before setting connected state.

## Security Considerations

**Untrusted dropped HTML is parsed through `innerHTML`:**
- Risk: Dropped HTML is assigned to `root.innerHTML`, then the first image URL is accepted as a behavior image source without scheme or host validation.
- Files: `src/workflow/Behaviour/Behaviour.tsx:69`, `src/workflow/Behaviour/Behaviour.tsx:71`, `src/workflow/Behaviour/Behaviour.tsx:75`
- Current mitigation: The HTML is parsed in a detached element and only `img.src` is read.
- Recommendations: Parse dropped HTML with `DOMParser`, accept only `https:`, `http:`, `data:image/*`, or project-approved blob URLs, and reject `javascript:`, oversized data URLs, and unexpected schemes. Add regression tests in `src/workflow/Behaviour/Behaviour.test.tsx`.

**Remote project loading trusts arbitrary HTTP(S) project URLs:**
- Risk: Any `project` query starting with `http` is fetched and passed into `ClassifierApp.load()`.
- Files: `src/workflow/ImageWorkspace/loader.ts:34`, `src/workflow/ImageWorkspace/loader.ts:35`, `src/workflow/ImageWorkspace/loader.ts:67`
- Current mitigation: Browser CORS and the classifier loader are the effective boundaries.
- Recommendations: Restrict remote project URLs to configured hosts or require signed/known eight-character project codes. Add file size and content type checks before `loadProject()`.

**Peer requests can retrieve full project data without local confirmation:**
- Risk: A connected peer that sends `event: 'request'` can receive metadata, model, weights, or the full project ZIP. If `shareSamples` is enabled, sample data can be included.
- Files: `src/components/PeerDeployer/ShareProtocol.tsx:31`, `src/components/PeerDeployer/ShareProtocol.tsx:44`, `src/components/PeerDeployer/ShareProtocol.tsx:55`, `src/state.ts:46`
- Current mitigation: Access depends on the peer connection code and the user enabling peer sharing.
- Recommendations: Validate requester identity, require an explicit per-session sharing consent for samples, rate-limit project requests, and log/display active peer downloads.

**Collaboration API uses bearerless project codes:**
- Risk: Model upload and deletion use only the session code in the path; no password or signed token is sent by the frontend.
- Files: `src/workflow/ImageWorkspace/ShareProtocol.tsx:38`, `src/workflow/ImageWorkspace/ShareProtocol.tsx:89`, `src/state.ts:40`
- Current mitigation: `sessionCode` is randomly generated with `randomId(8)`.
- Recommendations: Use the existing `sessionPassword` or a signed token in upload/delete requests, and require server-side ownership checks for model deletion and replacement.

## Performance Bottlenecks

**Dataset image loading is unbounded in parallel mode:**
- Problem: `loadDatasetImagesInParallel()` starts one `canvasFromURL()` promise per image.
- Files: `src/util/datasetLoader.ts:32`, `src/util/datasetLoader.ts:38`, `src/components/DatasetPicker/DatasetPicker.tsx:13`
- Cause: There is no concurrency limit, cancellation, or memory budget.
- Improvement path: Use a small worker pool, support `AbortController`, and cap loaded image dimensions before storing canvases.

**Peer sample sending encodes full canvases as data URLs:**
- Problem: Each remote sample is sent as `img.toDataURL()` through the peer connection.
- Files: `src/views/Collection/usePeerSender.ts:99`, `src/views/Collection/usePeerSender.ts:100`
- Cause: PNG/base64 serialization expands payload size and blocks on canvas encoding.
- Improvement path: Prefer `canvas.toBlob()` with compressed MIME type, downscale before sending, and chunk or back-pressure peer sends.

**Model sharing periodically serializes and uploads the entire project:**
- Problem: When sharing is active, the app serializes the model and optional samples immediately and every 20 minutes.
- Files: `src/workflow/ImageWorkspace/ShareProtocol.tsx:36`, `src/workflow/ImageWorkspace/ShareProtocol.tsx:82`, `src/workflow/ImageWorkspace/ShareProtocol.tsx:83`
- Cause: The sharing protocol uploads full ZIP contents instead of deltas or content hashes.
- Improvement path: Upload only when model, behavior, or sample state changes; compare a hash of the serialized project; skip interval uploads when the project is unchanged.

## Fragile Areas

**Model lifecycle and prediction state:**
- Files: `src/util/TeachableModel.tsx`, `src/workflow/Input/Input.tsx`, `src/workflow/Trainer/Trainer.tsx`
- Why fragile: Model creation, disposal, XAI canvas registration, prediction gating, and training all coordinate through Jotai atoms and asynchronous TensorFlow/model calls.
- Safe modification: Keep `modelState`, `modelLoaded`, `modelTraining`, and prediction atoms in sync. Add tests that simulate failed `ready()`, failed `train()`, variant switches, and predictions during training.
- Test coverage: `src/workflow/Trainer/Trainer.test.tsx` and `src/workflow/Input/Input.test.tsx` cover core UI paths, but failure cleanup and resource disposal paths are thin.

**Browser device APIs:**
- Files: `src/workflow/Output/SerialUSBConnector.tsx`, `src/workflow/Output/SerialUSBWriter.tsx`, `src/components/AudioRecorder/AudioRecorder.tsx`, `src/components/AudioExampleRecorder/MicSelect.tsx`
- Why fragile: Web Serial and MediaDevices support varies across browsers and permission states. Several paths log errors rather than exposing recoverable user state.
- Safe modification: Feature-detect every API at the call site, centralize permission error mapping, and test denied, unsupported, disconnected, and locked-device states.
- Test coverage: `src/workflow/Output/Output.test.tsx` covers output rendering, but there is no focused `SerialUSBConnector` test for permission denial, locked writers, or disconnect events.

**Peer collaboration protocols:**
- Files: `src/components/PeerDeployer/events.ts`, `src/components/PeerDeployer/ShareProtocol.tsx`, `src/components/PeerDeployer/SampleProtocol.tsx`, `src/views/Collection/usePeerSender.ts`, `src/views/Input/SampleProtocol.tsx`, `src/views/Deployment/ProjectProtocol.tsx`
- Why fragile: Event payloads cross browser peers and are trusted by callbacks with minimal runtime validation.
- Safe modification: Add runtime guards for every `EventProtocol` branch before mutating state or sending data. Version the protocol to permit backwards-compatible changes.
- Test coverage: `src/workflow/ImageWorkspace/ShareProtocol.test.tsx` covers API sharing, but peer request/response protocols have little direct test coverage.

## Scaling Limits

**In-browser sample and model storage:**
- Current capacity: Samples are held as `HTMLCanvasElement` or `AudioExample` objects in Jotai state.
- Limit: Large classes, high-resolution dropped files, long audio clips, and sample sharing can exhaust browser memory.
- Scaling path: Normalize samples into bounded blobs or object URLs, store metadata separately, downscale at ingest, and enforce per-class and total project size limits.

**Peer session codes:**
- Current capacity: Peer session identifiers use eight-character random codes.
- Limit: Codes are easy to share but provide limited namespace and no independent authentication.
- Scaling path: Separate human-readable invite codes from authenticated channel tokens. Use server-issued short-lived session tokens for upload/delete and peer join rights.

## Dependencies at Risk

**Browser-only ML and device dependencies:**
- Risk: `@tensorflow/tfjs`, `@tensorflow/tfjs-backend-webgpu`, Web Serial, and MediaDevices behave differently across browsers and hardware.
- Impact: Training, prediction, webcam, microphone, and serial output can silently degrade or fail depending on device support.
- Migration plan: Keep feature flags in `src/util/variant.ts`, isolate capability checks in utility functions, and add compatibility tests/mocks for unsupported APIs.

**PeerJS/base peer abstraction:**
- Risk: Peer collaboration relies on `peerjs` and `@genai-fi/base` peer hooks for core connection behavior.
- Impact: API changes or server incompatibility affects collection, input, deployment, and sharing flows at once.
- Migration plan: Wrap peer hooks behind a project-local adapter and contract-test event flows using mocked `Connection<EventProtocol>` objects.

## Missing Critical Features

**Runtime validation for imported projects and peer events:**
- Problem: Imported project data, behavior payloads, and peer events are treated as trusted domain objects after loading.
- Blocks: Clear error messages, safe remote sharing, and reliable backwards compatibility for saved projects.

**User-visible error model for training, sharing, and devices:**
- Problem: Many failures are only written to `console.error()` or `console.warn()`.
- Blocks: Users cannot distinguish unsupported browser, permission denial, server failure, invalid model, or training failure from a generic non-response.

## Test Coverage Gaps

**Security-sensitive ingest paths:**
- What's not tested: Dropped HTML with unsafe image schemes, invalid project URL query handling, oversized remote project fetches, and audio URL status/type handling.
- Files: `src/workflow/Behaviour/Behaviour.tsx`, `src/workflow/ImageWorkspace/loader.ts`, `src/workflow/ClassEntry/Classification.tsx`
- Risk: Security and resource regressions can ship without failing tests.
- Priority: High

**Peer protocol handling:**
- What's not tested: `request`, `model`, `weights`, `project`, `add_sample`, `delete_sample`, and malformed peer event payloads.
- Files: `src/components/PeerDeployer/ShareProtocol.tsx`, `src/components/PeerDeployer/SampleProtocol.tsx`, `src/views/Collection/usePeerSender.ts`, `src/views/Input/SampleProtocol.tsx`
- Risk: Collaboration can leak data, reject valid peers, or corrupt sample state unnoticed.
- Priority: High

**Training error and cleanup paths:**
- What's not tested: Failed `tm.ready()`, failed `tm.addExample()`, failed `tm.train()`, model disposal after failures, and progress with non-50 epoch settings.
- Files: `src/util/TeachableModel.tsx`, `src/workflow/Trainer/Trainer.tsx`
- Risk: Training UI and TensorFlow resources can get stuck after recoverable failures.
- Priority: High

**Device permission and disconnect states:**
- What's not tested: Web Serial permission denial, locked writer, disconnect event, unsupported serial API, microphone denial, and `enumerateDevices()` failures.
- Files: `src/workflow/Output/SerialUSBConnector.tsx`, `src/workflow/Output/SerialUSBWriter.tsx`, `src/components/AudioRecorder/AudioRecorder.tsx`, `src/components/AudioExampleRecorder/MicSelect.tsx`
- Risk: Browser-specific failures can become broken workflows with no reliable user feedback.
- Priority: Medium

---

*Concerns audit: 2026-05-06*
