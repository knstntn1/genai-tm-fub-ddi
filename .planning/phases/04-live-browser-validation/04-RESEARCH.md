# Phase 4 Research: Browser Validation Strategy

## Existing Implementation Surface

- Search and paging are handled by `OpenVerseSearchDialog`.
- Training workflow integration is through the image classification class card in `Classification`.
- Import success depends on `importOpenVerseImage`, which creates an image element, draws to canvas, and verifies canvas readability before class state mutation.
- Stale imports are guarded by the captured class object identity at `TrainingData.setDataIx`.

## Validation Implications

- The live browser check must use the integrated class-card entry point, not only the reusable dialog component.
- A failed remote image is acceptable only if the dialog remains open, shows a recoverable failed-import state, and allows another result to be selected.
- Direct browser viability depends on whether representative OpenVerse result images can be loaded with readable canvas data often enough for classroom use.
- Save/load/training must be validated after a successful OpenVerse sample import because unit tests cannot fully prove browser serialization and TensorFlow training behavior.

## Recommended Test Queries

Use simple classroom-safe German or English nouns with broad public-domain/CC coverage:

- `cat`
- `tree`
- `apple`

If CORS or provider blocking affects early results, select additional visible results from the same query before treating direct import as failed.

## Evidence To Capture

- Number of successful imports attempted before success.
- Whether any failed result produced a recoverable UI state.
- Whether the image appears in the intended class and sample count updates.
- Whether desktop/tablet/mobile controls are reachable and do not expose metadata or filters.
- Whether save/load preserves the imported sample.
- Whether training starts/completes with the imported sample included.
