import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { datasetState } from '@genaitm/state';
import DataExplorerDialog from './DataExplorerDialog';

const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as {
    mockReturnValue: (value: CanvasRenderingContext2D) => void;
};
getContextSpy.mockReturnValue({
    drawImage: vi.fn(),
} as unknown as CanvasRenderingContext2D);

vi.mock('@genaitm/workflow/ClassEntry/WebcamCapture', () => ({
    default: () => null,
}));

vi.mock('@genaitm/workflow/OpenVerseSearch/OpenVerseSearchDialog', () => ({
    default: () => null,
}));

describe('DataExplorerDialog', () => {
    it('creates datasets and changes image split tags', async ({ expect }) => {
        const user = userEvent.setup();
        const onChanged = vi.fn();
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;

        const initialDatasets = [
            {
                id: 'ds-1',
                name: 'Meine Daten',
                images: [{ id: 'img-1', split: 'training' as const, data: canvas, source: 'upload' as const }],
            },
        ];
        const store = createStore();
        store.set(datasetState, initialDatasets);

        render(
            <Provider store={store}>
                <DataExplorerDialog
                    open={true}
                    onClose={() => {}}
                    onChanged={onChanged}
                />
            </Provider>
        );

        expect(screen.getByText('Meine Daten (1)')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'dataExplorer.split.test' }));
        expect(screen.getByRole('button', { name: 'dataExplorer.split.test' })).toHaveAttribute('aria-pressed', 'true');

        await user.type(screen.getByLabelText('dataExplorer.fields.datasetName'), 'Neu');
        await user.click(screen.getByLabelText('dataExplorer.actions.createDataset'));
        expect(screen.getByText('Neu (0)')).toBeInTheDocument();
        expect(onChanged).toHaveBeenCalledTimes(2);
    });
});
