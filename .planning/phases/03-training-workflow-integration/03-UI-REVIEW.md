# Phase 3 - UI Review

**Audited:** 2026-05-07
**Baseline:** `.planning/phases/03-training-workflow-integration/03-UI-SPEC.md`
**Screenshots:** not captured (no dev server on localhost:3000, 5173, or 8080; browser validation deferred)
**Re-audit target:** Fix commit `441e427` (`fix(03): address OpenVerse integration review findings`)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Required German action, dialog, pending, and failure copy is localized and rendered. |
| 2. Visuals | 3/4 | `Bildsuche` is correctly placed as a peer class-card action, but integrated label fit and dialog reachability were not browser-validated. |
| 3. Color | 3/4 | Phase 3 does not overuse accent color, but inherited hardcoded overlay/neutral colors remain outside the declared token system. |
| 4. Typography | 4/4 | New action reuses `VerticalButton`, and pending/failure overlays use the declared 14px/600 status treatment. |
| 5. Spacing | 3/4 | Action row uses the existing 58px sample rhythm, but inherited `0.3rem` gaps and `5px 8px` button padding remain off the declared 4px scale. |
| 6. Experience Design | 3/4 | The stale/no-op import blocker is fixed and pending status is announced, but browser focus/touch validation remains deferred. |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **WARNING: Integrated browser/touch validation remains deferred** - the class-card `Bildsuche` label fit, focus return, and touch reachability are still not proven in a real layout - run desktop/tablet/mobile screenshots from the class card and verify opener focus, label fit, and result overlay reachability.
2. **WARNING: Overlay and class-card colors still use hardcoded values** - the implementation works visually by code inspection, but these values remain outside the declared token system - replace or document overlay contrast variables and migrate class-card neutrals/destructive colors to existing tokens when this area is next touched.
3. **WARNING: Inherited compact spacing remains off-scale** - `gap: 0.3rem` and `5px 8px` padding are inherited from the existing class-card/button treatment and do not exactly match the Phase 3 4px scale - normalize the action-row rhythm only after browser validation confirms it will not regress the existing Webcam/Upload controls.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

- PASS: The class-card action uses localized German `Bildsuche` through `trainingdata.actions.openverse` in `src/workflow/ClassEntry/Classification.tsx:499` and `public/locales/de-DE/image_adv.json:75`.
- PASS: The integrated dialog title remains class-scoped with `OpenVerse: {{className}}` in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:197` and `public/locales/de-DE/image_adv.json:112`.
- PASS: Required German search, use, retry, empty, error, rate-limit, pending, and failed-import copy is present in `public/locales/de-DE/image_adv.json:115` through `public/locales/de-DE/image_adv.json:128`.
- PASS: The prior warning is resolved: `Bild wird hinzugefügt...` now exists as `trainingdata.openverse.pendingUse` in all 15 `image_adv` locale files and is tracked by `scripts/addOpenVerseLocaleKeys.cjs:23` and `scripts/addOpenVerseLocaleKeys.cjs:48`.

### Pillar 2: Visuals (3/4)

- PASS: `Bildsuche` is rendered as the third inactive image-card action after Webcam and Upload, using the existing `<li className={style.sample}>` pattern and `VerticalButton` in `src/workflow/ClassEntry/Classification.tsx:458` through `src/workflow/ClassEntry/Classification.tsx:501`.
- PASS: The action uses the required Material UI image/search icon via `ImageSearchIcon` in `src/workflow/ClassEntry/Classification.tsx:10` and `src/workflow/ClassEntry/Classification.tsx:496`.
- PASS: The dialog integration reuses `OpenVerseSearchDialog` instead of adding a banner, toolbar, or separate card in `src/workflow/ClassEntry/Classification.tsx:544` through `src/workflow/ClassEntry/Classification.tsx:549`.
- WARNING: Real browser validation was not available, so the German `Bildsuche` label fit inside the compact 58px action row and the Phase 2 hover/focus/touch overlay behavior remain unproven.

### Pillar 3: Color (3/4)

- PASS: The new class-card action does not introduce decorative accent fills; it reuses `VerticalButton variant="outlined"` in `src/workflow/ClassEntry/Classification.tsx:493` through `src/workflow/ClassEntry/Classification.tsx:500`.
- PASS: Dialog accent remains reserved for result hover/focus affordances in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:104` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:109`.
- WARNING: The Phase 2 warning remains: thumbnail overlays use hardcoded `rgba(0, 0, 0, 0.58)` and `rgba(0, 0, 0, 0.72)` in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:131` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:156`.
- WARNING: The integrated class-card area still contains hardcoded neutral/destructive colors such as `#e8f0fe`, `#444`, `#bbb`, and `#e03838` in `src/workflow/ClassEntry/classification.module.css:40`, `src/workflow/ClassEntry/classification.module.css:106`, `src/workflow/ClassEntry/classification.module.css:222`, and `src/workflow/ClassEntry/classification.module.css:235`.

### Pillar 4: Typography (4/4)

- PASS: `Bildsuche` inherits the existing `VerticalButton` treatment instead of introducing a new text style in `src/components/button/Button.tsx:7` through `src/components/button/Button.tsx:13`.
- PASS: The dialog keeps the approved 18px/600 heading and 14px/600 overlay roles in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:15`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:16`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:132`, and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:133`.
- PASS: The pending and failed import status overlays use the same declared 14px/600 button/overlay typography in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:147` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:159`.
- NOTE: Existing class-card CSS still uses inherited `11pt`, `12pt`, `bold`, and rem-based icon sizing in `src/workflow/ClassEntry/classification.module.css:18`, `src/workflow/ClassEntry/classification.module.css:198`, `src/workflow/ClassEntry/classification.module.css:200`, and `src/workflow/ClassEntry/classification.module.css:247`; Phase 3 did not add a new divergent text system.

### Pillar 5: Spacing (3/4)

- PASS: The new action uses the same fixed 58px class-card rhythm as Webcam, Upload, and samples through `style.sample` in `src/workflow/ClassEntry/classification.module.css:109` through `src/workflow/ClassEntry/classification.module.css:116`.
- PASS: The dialog retains the approved 700px max width, 80vh height, 16/24px title padding, and 8px result grid gap in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:3` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:7`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:13`, and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:87`.
- PASS: The added pending/failed status inset uses the declared 4px/8px rhythm in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:150` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:153`.
- WARNING: The class-card action row inherits `gap: 0.3rem` and `VerticalButton` padding `5px 8px`, which do not exactly follow the declared 4px spacing scale, in `src/workflow/ClassEntry/classification.module.css:80` and `src/components/button/Button.tsx:9`.
- WARNING: Screenshot validation is still needed to prove the third action does not crowd the compact row on desktop/tablet/mobile.

### Pillar 6: Experience Design (3/4)

- PASS: Image-only gating is implemented with `!isAudio` at `src/workflow/ClassEntry/Classification.tsx:488`, while speech tests assert absence at `src/workflow/ClassEntry/Classification.test.tsx:165` through `src/workflow/ClassEntry/Classification.test.tsx:185`.
- PASS: Successful imports call `importOpenVerseImage` before mutation, resize the canvas to 58px, prepend the normal sample shape, and close the dialog only after the successful insertion path in `src/workflow/ClassEntry/Classification.tsx:305` through `src/workflow/ClassEntry/Classification.tsx:334`.
- PASS: The prior stale/no-op import blocker is resolved. `TrainingData.setDataIx` now returns `false` for invalid indexes or mismatched captured class identity at `src/workflow/TrainingData/TrainingData.tsx:49` through `src/workflow/TrainingData/TrainingData.tsx:58`; `Classification.handleUseOpenVerseImage` throws instead of closing when insertion is rejected at `src/workflow/ClassEntry/Classification.tsx:322` through `src/workflow/ClassEntry/Classification.tsx:331`.
- PASS: The stale/rejected update behavior is covered by tests for changed labels, superseded imports, and rejected target updates in `src/workflow/ClassEntry/Classification.test.tsx:300` through `src/workflow/ClassEntry/Classification.test.tsx:409`, plus same-label shifted-index integration coverage in `src/workflow/TrainingData/TrainingData.test.tsx:214` through `src/workflow/TrainingData/TrainingData.test.tsx:230`.
- PASS: The prior pending feedback warning is resolved. Pending selected images render `Bild wird hinzugefügt...` with `role="status"` in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:304` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:310`, with test coverage in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:256` through `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:266`.
- WARNING: Focus recovery to the originating `Bildsuche` button is not implemented or tested; `doOpenVerseClose` only sets `showOpenVerseSearch` false in `src/workflow/ClassEntry/Classification.tsx:294`.
- WARNING: Browser validation is still deferred, so keyboard focus return, compact label fit, and touch access must be verified in Phase 3/4 real-browser checks.

---

## Registry Safety

Registry audit skipped: `components.json` is absent, `03-UI-SPEC.md` states `shadcn_initialized: false`, and the Registry Safety table lists no third-party blocks.

---

## Verification

- Screenshot capture: not captured because no dev server responded on localhost ports 3000, 5173, or 8080.
- `node scripts/addOpenVerseLocaleKeys.cjs --check` - passed, 15 locale files validated.
- `npm test -- src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` - passed, 26 tests; jsdom logged the existing `HTMLCanvasElement.prototype.getContext` limitation.

---

## Files Audited

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/03-training-workflow-integration/03-UI-SPEC.md`
- `.planning/phases/03-training-workflow-integration/03-01-PLAN.md`
- `.planning/phases/03-training-workflow-integration/03-training-workflow-integration-01-SUMMARY.md`
- `.planning/phases/02-student-search-ui/02-UI-REVIEW.md`
- `src/workflow/ClassEntry/Classification.tsx`
- `src/workflow/ClassEntry/classification.module.css`
- `src/workflow/ClassEntry/Classification.test.tsx`
- `src/workflow/TrainingData/TrainingData.tsx`
- `src/workflow/TrainingData/TrainingData.test.tsx`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx`
- `src/components/button/Button.tsx`
- `public/locales/de-DE/image_adv.json`
- `scripts/addOpenVerseLocaleKeys.cjs`
