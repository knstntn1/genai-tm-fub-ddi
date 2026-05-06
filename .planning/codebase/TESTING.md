# Testing Patterns

**Analysis Date:** 2026-05-06

## Test Framework

**Runner:**
- Vitest 3.1.1
- Config: `vite.config.ts`
- Environment: `jsdom`
- Setup file: `src/setupTests.ts`

**Assertion Library:**
- Vitest `expect`
- `@testing-library/jest-dom/vitest` matchers loaded by `src/setupTests.ts`
- React Testing Library queries from `@testing-library/react`

**Run Commands:**
```bash
npm test                  # Run Vitest in watch/dev mode
npm run ci:test           # Run Vitest once with coverage, junit reporter, and junit.xml output
npm run coverage          # Run Vitest once with V8 coverage
```

## Test File Organization

**Location:**
- Tests are co-located beside source files under `src/`.
- Component tests live next to the component: `src/workflow/Trainer/Trainer.test.tsx`, `src/components/DatasetPicker/DatasetPicker.test.tsx`.
- Pure utility tests live next to the utility: `src/workflow/Behaviours/patch.test.ts`.
- App-level route tests live at `src/App.test.tsx`.

**Naming:**
- Use `.test.tsx` for React/component tests.
- Use `.test.ts` for non-JSX utility tests.
- No `.spec.*` files are present.

**Structure:**
```text
src/
├── App.test.tsx
├── components/
│   └── <Component>/<Component>.test.tsx
├── views/
│   └── <View>/<View>.test.tsx
└── workflow/
    └── <Feature>/<Feature>.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestWrapper from '../../util/TestWrapper';

describe('Trainer component', () => {
    it('can perform training', async ({ expect }) => {
        const user = userEvent.setup();
        render(<Trainer />, { wrapper: TestWrapper });

        await user.click(screen.getByTestId('train-button'));
        await waitFor(() => expect(screen.getByTestId('alert-complete')).toBeVisible());
    });
});
```

**Patterns:**
- Import `describe`, `it`, and `vi` explicitly from `vitest` in most test files.
- Use Vitest's injected test context for assertions: `it('...', async ({ expect }) => { ... })`, as in `src/workflow/Behaviours/patch.test.ts` and `src/workflow/Trainer/Trainer.test.tsx`.
- Render React components with React Testing Library and assert via `screen`.
- Use `userEvent.setup()` for user interactions; reserve `act` for direct DOM events such as blur in `src/workflow/Behaviour/Behaviour.test.tsx`.
- Use `waitFor`, `findBy*`, and `vi.waitFor` for async UI updates, atom changes, and network side effects.
- Prefer visible/user-facing assertions where practical, but `data-testid` is an accepted pattern for workflow widgets and controls.

## Mocking

**Framework:** Vitest mocks (`vi.mock`, `vi.fn`, `vi.stubEnv`) plus global jsdom setup in `src/setupTests.ts`.

**Patterns:**
```typescript
vi.mock('@genai-fi/classifier', () => {
    const obj = {
        createModel: vi.fn(() => new obj.ImageModel()),
        ImageModel: vi.fn(function (this: any) {
            this.ready = vi.fn(async () => true);
            this.isTrained = vi.fn(() => false);
            this.predict = vi.fn(() => Promise.resolve({ predictions: [] }));
        }),
    };
    return obj;
});
```

```typescript
vi.stubEnv('VITE_APP_API', 'http://localhost:9001');
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        statusText: 'OK',
    } as Response)
) as unknown as typeof fetch;
```

**What to Mock:**
- Mock heavy ML dependencies such as `@tensorflow/tfjs`, `@genai-fi/base`, and `@genai-fi/classifier` in component tests that would otherwise load or train models: `src/views/General/Classifier.test.tsx`, `src/views/UnderTheHood/UnderTheHood.test.tsx`, `src/workflow/Trainer/Trainer.test.tsx`.
- Mock browser APIs missing from jsdom globally in `src/setupTests.ts`: `BroadcastChannel`, `ResizeObserver`, `IntersectionObserver`, `react-dnd`, `react-dnd-html5-backend`, and `react-i18next`.
- Mock network boundaries with `global.fetch` and environment variables in protocol tests: `src/workflow/ImageWorkspace/ShareProtocol.test.tsx`.
- Mock data loader utilities for dataset UI tests: `src/components/DatasetPicker/DatasetPicker.test.tsx`.

**What NOT to Mock:**
- Do not mock the component under test or nearby pure logic. `src/workflow/Behaviours/patch.test.ts` exercises the real `patchBehaviours` function.
- Do not mock Jotai itself; create a real store with `createStore()` and pass it through `TestWrapper`.
- Do not mock React Testing Library queries or user-event. Drive interactions through rendered DOM.

## Fixtures and Factories

**Test Data:**
```typescript
const store = createStore();
store.set(classState, [
    {
        label: 'Class 1',
        samples: [
            { data: document.createElement('canvas'), id: '' },
            { data: document.createElement('canvas'), id: '' },
        ],
    },
]);
```

**Location:**
- Fixture data is usually inline in each test file.
- Shared render context lives in `src/util/TestWrapper.tsx`.
- State observation helper lives in `src/util/Observer.tsx`.
- Global browser and library mocks live in `src/setupTests.ts`.

## Coverage

**Requirements:** No numeric threshold is enforced in `vite.config.ts`.

**View Coverage:**
```bash
npm run coverage
```

- Coverage uses the V8 provider configured in `vite.config.ts`.
- Coverage reporters are `cobertura` and `html`.
- CI coverage runs through `npm run ci:test`, which also writes `junit.xml`.

## Test Types

**Unit Tests:**
- Pure logic tests use direct inputs and outputs with no React rendering: `src/workflow/Behaviours/patch.test.ts`.
- Utility tests should preserve object identity and edge-case behavior where the implementation promises it, matching `patchBehaviours` expectations.

**Integration Tests:**
- Most component tests are DOM-level integration tests using React Testing Library, real Jotai stores, and `TestWrapper`: `src/workflow/Trainer/Trainer.test.tsx`, `src/workflow/ImageWorkspace/Workspace.test.tsx`, `src/views/General/Classifier.test.tsx`.
- Route-level smoke tests use `createMemoryRouter` with exported `routes` in `src/App.test.tsx`.
- Protocol tests exercise side effects through mocked `fetch` and atom state updates: `src/workflow/ImageWorkspace/ShareProtocol.test.tsx`.

**E2E Tests:**
- Not used. No Playwright, Cypress, or browser E2E config was detected.

## Common Patterns

**Async Testing:**
```typescript
await waitFor(() => expect(setModel).toHaveBeenCalledTimes(2));
await user.click(screen.getByTestId('train-button'));
expect(await screen.findByTestId('versionlink', undefined, { timeout: 10000 })).toBeInTheDocument();
```

**Error Testing:**
```typescript
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: false,
        statusText: 'Internal Server Error',
        status: 500,
    } as Response)
) as unknown as typeof fetch;

await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
});
expect(changeFn).toHaveBeenCalledWith(false);
```

---

*Testing analysis: 2026-05-06*
