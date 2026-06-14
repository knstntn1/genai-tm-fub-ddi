import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { datasetState } from '@genaitm/state';
import { importRemoteImage } from '@genaitm/util/remoteImageImport';
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

vi.mock('@genaitm/workflow/ImageSearch/ImageSearchDialog', () => ({
    default: ({
        open,
        onUseImage,
        actionLabel,
    }: {
        open: boolean;
        onUseImage: (result: { id: string; imageUrl: string; thumbnailUrl: string }) => Promise<void>;
        actionLabel: string;
    }) =>
        open ? (
            <div data-testid="image-search-dialog">
                <span>{actionLabel}</span>
                <button
                    data-testid="add-result-1"
                    onClick={() =>
                        void onUseImage({
                            id: 'result-1',
                            imageUrl: 'https://example.com/one.jpg',
                            thumbnailUrl: 'https://example.com/one-thumb.jpg',
                        })
                    }
                >
                    add-result-1
                </button>
                <button
                    data-testid="add-result-2"
                    onClick={() =>
                        void onUseImage({
                            id: 'result-2',
                            imageUrl: 'https://example.com/two.jpg',
                            thumbnailUrl: 'https://example.com/two-thumb.jpg',
                        })
                    }
                >
                    add-result-2
                </button>
            </div>
        ) : null,
}));

vi.mock('@genaitm/util/remoteImageImport', () => ({
    importRemoteImage: vi.fn(),
}));

describe('DataExplorerDialog', () => {
    it('requires a non-empty dataset name', async ({ expect }) => {
        const user = userEvent.setup();
        const onChanged = vi.fn();
        const store = createStore();

        render(
            <Provider store={store}>
                <DataExplorerDialog
                    open={true}
                    onClose={() => {}}
                    onChanged={onChanged}
                />
            </Provider>
        );

        const nameInput = screen.getByRole('textbox', { name: /dataExplorer\.fields\.datasetName/ });
        const createButton = screen.getByLabelText('dataExplorer.actions.createDataset');

        expect(nameInput).toBeRequired();
        expect(createButton).toBeDisabled();

        await user.type(nameInput, '   ');
        expect(createButton).toBeDisabled();
        expect(onChanged).not.toHaveBeenCalled();

        await user.type(nameInput, ' Neuer Datensatz ');
        expect(createButton).toBeEnabled();
        await user.click(createButton);

        expect(screen.getByText('Neuer Datensatz (0)')).toBeInTheDocument();
        expect(onChanged).toHaveBeenCalledTimes(1);
    });

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
        expect(screen.queryByText('dataExplorer.sections.existingDatasets')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'dataExplorer.split.test' }));
        expect(screen.getByRole('button', { name: 'dataExplorer.split.test' })).toHaveAttribute('aria-pressed', 'true');

        await user.type(screen.getByRole('textbox', { name: /dataExplorer\.fields\.datasetName/ }), 'Neu');
        await user.click(screen.getByLabelText('dataExplorer.actions.createDataset'));
        expect(screen.getByText('Neu (0)')).toBeInTheDocument();
        expect(onChanged).toHaveBeenCalledTimes(2);
    });

    it('adds several search results without closing and assigns consecutive display IDs', async ({ expect }) => {
        const user = userEvent.setup();
        const firstCanvas = document.createElement('canvas');
        const secondCanvas = document.createElement('canvas');
        vi.mocked(importRemoteImage).mockResolvedValueOnce(firstCanvas).mockResolvedValueOnce(secondCanvas);

        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Tiere',
                nextImageNumber: 1,
                images: [],
            },
        ]);

        render(
            <Provider store={store}>
                <DataExplorerDialog
                    open={true}
                    onClose={() => {}}
                />
            </Provider>
        );

        await user.click(screen.getByRole('button', { name: 'trainingdata.actions.imageSearch' }));
        expect(screen.getByText('dataExplorer.actions.addImage')).toBeInTheDocument();

        await user.click(screen.getByTestId('add-result-1'));
        await waitFor(() => expect(screen.getByText('Tiere_1')).toBeInTheDocument());

        await user.click(screen.getByTestId('add-result-2'));
        await waitFor(() => expect(screen.getByText('Tiere_2')).toBeInTheDocument());

        expect(screen.getByTestId('image-search-dialog')).toBeInTheDocument();
        expect(store.get(datasetState)[0].nextImageNumber).toBe(3);
    });
});
