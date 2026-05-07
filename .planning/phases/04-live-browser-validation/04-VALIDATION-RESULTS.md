# Phase 4 Validation Results

**Date:** 2026-05-07  
**Route:** `http://127.0.0.1:5173/image/general?c=N4IghgJgbmB2DGBTCBZRsCuIBcAXAThogL5A`  
**Tooling:** local Vite dev server plus Playwright Chromium

## Summary

Live browser validation passed after fixing one product defect found by the first run.

The first live run proved real OpenVerse search and import, but training failed because imported remote canvases could retain non-`224x224` dimensions such as `342x342`. The image model rejected those samples with:

```text
expected input_1 to have shape [null,224,224,3] but got array with shape [1,342,342,3]
```

Fix applied:

- `src/util/openverseImageImport.ts` now normalizes imported remote images into a readable square `224x224` canvas using a center-cover crop.
- `src/util/openverseImageImport.test.ts` now asserts the square training-canvas contract and fallback behavior.

## Final Live Run

Command:

```bash
node .planning/phases/04-live-browser-validation/run-live-validation.mjs
```

Result:

```json
{
  "importResult": {
    "success": true,
    "attempts": 1,
    "failedAttempts": 0,
    "before": 0,
    "after": 1,
    "metadataText": 0
  },
  "sampleCountsBeforeTraining": {
    "class1": 2,
    "class2": 2
  },
  "trainingComplete": true,
  "loadCounts": {
    "class1": 2,
    "class2": 2
  },
  "viewportResults": [
    {
      "viewport": { "width": 1440, "height": 900 },
      "openverseButtons": 2,
      "focusedActionVisible": true,
      "metadataText": 0
    },
    {
      "viewport": { "width": 820, "height": 1180 },
      "openverseButtons": 2,
      "focusedActionVisible": true,
      "metadataText": 0
    },
    {
      "viewport": { "width": 390, "height": 844 },
      "openverseButtons": 2,
      "focusedActionVisible": true,
      "metadataText": 0
    }
  ],
  "recoverableFailure": {
    "dialogStillOpen": true
  }
}
```

## Evidence Matrix

| Check | Result | Notes |
|-------|--------|-------|
| Real OpenVerse search | PASS | Query `Katze` returned results in the integrated class-card dialog. |
| Real OpenVerse import | PASS | First selected live result imported successfully into class 1. |
| CORS/canvas readability | PASS | Imported live result passed the importer readback guard and was accepted by training after `224x224` normalization. |
| Failed-provider recovery | PASS | External image requests were blocked after search results loaded; selecting a result showed `Dieses Bild konnte nicht genutzt werden` and kept the dialog open. |
| No visible metadata/filter UI | PASS | Metadata/filter text count was `0` in final desktop/tablet/mobile observations. |
| Focus access to result action | PASS | `Dieses Bild nutzen` was visible after focusing a result in desktop/tablet/mobile runs. |
| Desktop/tablet/mobile entry point | PASS | Two `Bildsuche` entry points were present, one per image class, across all tested viewports. |
| Save/load with imported sample | PASS | Project ZIP saved after training and loaded back with class sample counts `2/2`. |
| Training with imported sample | PASS | Training completed with the OpenVerse-imported sample included. |

## Direct Browser Viability Decision

Direct browser OpenVerse import is sufficient for v1 after normalizing imported images to the model's `224x224` training-canvas shape.

No v1 proxy/cache is required based on this validation. A v2 proxy/cache or disable switch should remain deferred for school-network, hotlink-blocking, rate-limit, or policy controls discovered during classroom pilots.

## Commands Run

```bash
npm test -- src/util/openverseImageImport.test.ts src/workflow/ClassEntry/Classification.test.tsx src/workflow/TrainingData/TrainingData.test.tsx --run
node scripts/addOpenVerseLocaleKeys.cjs --check
npm run lint
npm run build
```

All commands passed. Build produced the existing large-chunk warnings only.
