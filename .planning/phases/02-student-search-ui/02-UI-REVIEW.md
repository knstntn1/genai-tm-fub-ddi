# Phase 2 - UI Review

**Audited:** 2026-05-06
**Baseline:** `.planning/phases/02-student-search-ui/02-UI-SPEC.md`
**Screenshots:** not captured (no dev server on localhost:3000, 5173, or 8080)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | German contract copy is localized and the dialog consumes the expected keys. |
| 2. Visuals / Layout | 2/4 | Result grid violates the required 2/3/4 responsive column contract. |
| 3. Color | 3/4 | Accent usage is restrained, but overlay colors are hardcoded and one imported token is unused. |
| 4. Typography | 4/4 | Component typography matches the declared 18/16/14 size system. |
| 5. Spacing | 2/4 | Several spacing values fall outside the approved spacing scale. |
| 6. Experience Design / Accessibility | 3/4 | Core states and keyboard activation exist, but `loading-more` is outside the live region and touch affordance is only implicit. |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **Fix the result grid breakpoints** - the current `auto-fill` grid can show 4 columns at 480px and up to 6 columns in a 700px dialog, breaking the specified scan pattern - replace with explicit 2/3/4 column rules at `<480px`, `>=480px`, and `>=700px`.
2. **Normalize spacing to the declared scale** - off-scale title padding, negative close margin, 12px loading gaps, and 6px failed-use padding make the dialog less consistent with the app system - use 4/8/16/24/32/48/64px values or document true exceptions.
3. **Tighten assistive-state coverage** - `loading-more` is visible but not inside the `aria-live` status region, and tests do not verify CSS reveal/touch behavior - move loading-more into the live region or add `role="status"`, then add focused checks for hover/focus/touch-equivalent state.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

- PASS: The component uses localized keys through `useTranslation(namespace)` for the dialog title, search label, placeholder, primary CTA, overlay action, loading/empty/error/rate-limit/retry/pagination/failed-use copy in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:197`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:212`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:228`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:241`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:247`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:265`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:293`, and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:322`.
- PASS: The German locale contains the approved strings, including `OpenVerse: {{className}}`, `Bilder suchen`, `Dieses Bild nutzen`, `Keine Bilder gefunden.`, and `Mehr Ergebnisse` in `public/locales/de-DE/image_adv.json:110`.
- PASS: Visible metadata and advanced filter copy is not rendered by the component; tests explicitly guard against visible license, creator, source, dimensions, URL, filter comboboxes, and mature controls in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx:206`.

### Pillar 2: Visuals / Layout (2/4)

- WARNING: The results grid does not follow the spec's explicit responsive contract of 2 columns below 480px, 3 columns from 480px, and 4 columns from 700px. `repeat(auto-fill, minmax(112px, 1fr))` in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:86` will create more columns as space allows, including 4 at roughly 480px and more than 4 near 700px.
- PASS: The result tiles are image-only at rest, square, `object-fit: cover`, and free of visible captions or metadata in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:272` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:90`.
- PASS: The dialog uses MUI `Dialog`, `DialogTitle`, `DialogContent`, a close icon, a sticky search row, and compact max width/height in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:189` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:3`.

### Pillar 3: Color (3/4)

- WARNING: The component imports the approved color tokens but leaves `primaryHover` unused in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:1`, which suggests token drift or dead design-system wiring.
- WARNING: Hardcoded overlay colors are used for action and failed-use states in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:130` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:154`. These are defensible for thumbnail readability, but they bypass the token system.
- PASS: Accent use is restrained to focus/hover tile affordance and inherited button/progress components. Direct primary usage appears only on the result tile border/outline in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:107`.

### Pillar 4: Typography (4/4)

- PASS: Declared component typography matches the spec: title uses 18px/600/1.2 in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:15`, state text uses 16px/1.5 in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:57`, and overlay/failed-use text uses 14px/600/1.2 in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:132` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:156`.
- PASS: The component relies on MUI and the existing base `Button` for control internals, which is allowed by the spec's Material UI exception.

### Pillar 5: Spacing (2/4)

- WARNING: The title padding uses `0.75rem 1.8rem` in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:13`, resolving to 12px and 28.8px under a 16px root. Neither value is in the approved spacing scale.
- WARNING: The close button uses a negative margin at `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:22`, which is outside the declared scale and can make focus-ring clipping harder to reason about.
- WARNING: Loading states use a 12px gap in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:70`, and failed-use copy uses 6px padding in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:152`; both are outside the spacing scale. Border radii at 5-6px are allowed by the visual constraints, but padding/gaps are not listed exceptions.
- PASS: Core content/form/grid spacing mostly uses 8px, 16px, and 24px in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:28`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:36`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:40`, and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:87`.

### Pillar 6: Experience Design / Accessibility (3/4)

- WARNING: `loading-more` is rendered outside the `aria-live="polite"` region, so appended-page loading may not be announced consistently to assistive tech. The live region ends at `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:270`, while loading-more is rendered at `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:308`.
- WARNING: Touch behavior depends on the tile button immediately activating or `:active` briefly revealing the overlay in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:140`. That satisfies basic activation, but it does not make the overlay persistently available after a first tap for students who expect to inspect before using.
- PASS: Result tiles are native buttons with German accessible names, thumbnail alt fallback, disabled pending state, and native Enter/Space activation in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:280`.
- PASS: The implementation covers initial, loading, empty, retryable error, rate-limit, pagination, failed-use, stale-request abort, and retry behavior in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:71`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:145`, `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:162`, and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx:315`.
- PASS: Focus visibility uses a 2px primary outline and reveals the action overlay on focus in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:104` and `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:140`.

---

## Registry Safety

Registry audit skipped: `components.json` is absent, the UI spec states `shadcn_initialized: false`, and the Registry Safety table lists no third-party blocks.

Design-system safety: implementation uses MUI components, the existing `@genaitm/components/button/Button`, CSS modules, and base color tokens as required. Minor safety warning remains for unused `primaryHover` and hardcoded overlay colors in `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css:1`.

---

## Verification

- `npm test -- src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx --run` - passed, 9 tests.
- Screenshot capture - not run because no dev server responded on localhost ports 3000, 5173, or 8080.

---

## Files Audited

- `.planning/phases/02-student-search-ui/02-UI-SPEC.md`
- `.planning/phases/02-student-search-ui/02-CONTEXT.md`
- `.planning/phases/02-student-search-ui/02-01-PLAN.md`
- `.planning/phases/02-student-search-ui/02-01-SUMMARY.md`
- `.planning/phases/02-student-search-ui/02-02-PLAN.md`
- `.planning/phases/02-student-search-ui/02-02-SUMMARY.md`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.module.css`
- `src/workflow/OpenVerseSearch/OpenVerseSearchDialog.test.tsx`
- `public/locales/de-DE/image_adv.json`
- `src/components/button/Button.tsx`
