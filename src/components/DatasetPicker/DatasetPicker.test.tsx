import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { datasetState } from '@genaitm/state';
import DatasetPicker from './DatasetPicker';

describe('DatasetPicker', () => {
    it('shows an empty state when no own datasets exist', ({ expect }) => {
        render(
            <DatasetPicker
                open={true}
                onClose={() => {}}
                onDatasetSelected={() => {}}
            />
        );

        expect(screen.getByText('dataExplorer.empty.noDatasets')).toBeInTheDocument();
        expect(screen.queryByTestId('dataset-image')).not.toBeInTheDocument();
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
                images: [{ id: 'img-1', displayId: 'Dataset_7', split: 'training', data: canvas }],
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
        expect(screen.getByText('Dataset_7')).toBeInTheDocument();
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

    it('shows only own DataExplorer datasets', async ({ expect }) => {
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

        expect(await screen.findByText('Managed Dataset')).toBeInTheDocument();
        expect(screen.getByText('DataExplorer')).toBeInTheDocument();
        expect(screen.queryByText('dataset.name')).not.toBeInTheDocument();
    });
});
