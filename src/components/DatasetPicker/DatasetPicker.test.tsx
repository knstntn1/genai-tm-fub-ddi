import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { datasetState } from '@genaitm/state';
import DatasetPicker from './DatasetPicker';

vi.mock('@genaitm/util/datasets', () => ({
    DATASETS: [],
    fetchAndCacheDatasets: vi.fn().mockResolvedValue([
        {
            id: 'dataset1',
            nameKey: 'dataset.name',
            descriptionKey: 'dataset.description',
            categoryKey: 'dataset.category',

            images: [{ url: 'https://example.com/image1.jpg' }, { url: 'https://example.com/image2.jpg' }],
        },
    ]),
}));

describe('DatasetPicker', () => {
    it('fetches and displays datasets when opened', async ({ expect }) => {
        render(
            <DatasetPicker
                open={true}
                onClose={() => {}}
                onDatasetSelected={() => {}}
            />
        );
        await waitFor(() => expect(screen.getByText('dataset.name')).toBeInTheDocument());
        expect(screen.getByText('dataset.category')).toBeInTheDocument();
        expect(screen.getAllByTestId('dataset-image')).toHaveLength(2);
    });

    it('returns managed training canvases without URL loading', async ({ expect }) => {
        const user = userEvent.setup();
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        canvas.toDataURL = vi.fn(() => 'data:image/png;base64,managed');
        const onDatasetSelected = vi.fn();
        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Dataset',
                images: [{ id: 'img-1', split: 'training', data: canvas }],
            },
        ]);

        render(
            <Provider store={store}>
                <DatasetPicker
                    open={true}
                    onClose={() => {}}
                    onDatasetSelected={onDatasetSelected}
                />
            </Provider>
        );

        await screen.findByText('DataExplorer');
        await user.click(screen.getByAltText('dataExplorer.labels.image'));
        await user.click(screen.getByRole('button', { name: 'trainingdata.actions.use' }));

        expect(onDatasetSelected).toHaveBeenCalledWith([canvas]);
    });

    it('keeps managed dataset visible when it has no training images', async ({ expect }) => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Only Test Dataset',
                images: [{ id: 'img-1', split: 'test', data: canvas }],
            },
        ]);

        render(
            <Provider store={store}>
                <DatasetPicker
                    open={true}
                    onClose={() => {}}
                    onDatasetSelected={() => {}}
                />
            </Provider>
        );

        expect(await screen.findByText('Only Test Dataset')).toBeInTheDocument();
        expect(screen.getByText('dataExplorer.empty.noTrainingImages')).toBeInTheDocument();
    });

    it('shows managed datasets before catalogue datasets', async ({ expect }) => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        canvas.toDataURL = vi.fn(() => 'data:image/png;base64,managed');
        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Managed Dataset',
                images: [{ id: 'img-1', split: 'training', data: canvas }],
            },
        ]);

        render(
            <Provider store={store}>
                <DatasetPicker
                    open={true}
                    onClose={() => {}}
                    onDatasetSelected={() => {}}
                />
            </Provider>
        );

        const managed = await screen.findByText('Managed Dataset');
        const catalogue = await screen.findByText('dataset.name');
        expect(managed.compareDocumentPosition(catalogue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
