import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { datasetState } from '@genaitm/state';
import DatasetTestPicker from './DatasetTestPicker';

function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    canvas.toDataURL = vi.fn(() => 'data:image/png;base64,test');
    return canvas;
}

describe('DatasetTestPicker', () => {
    it('selects managed test images through canvas and data-url callbacks', async ({ expect }) => {
        const user = userEvent.setup();
        const onImageSelected = vi.fn();
        const onImageUrlSelected = vi.fn();
        const onClose = vi.fn();
        const canvas = createCanvas();
        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Dataset',
                images: [{ id: 'img-1', split: 'test', data: canvas }],
            },
        ]);

        render(
            <Provider store={store}>
                <DatasetTestPicker
                    open={true}
                    onClose={onClose}
                    onImageSelected={onImageSelected}
                    onImageUrlSelected={onImageUrlSelected}
                />
            </Provider>
        );

        await user.click(screen.getByTestId('dataset-image'));

        expect(onImageSelected).toHaveBeenCalledWith(canvas);
        expect(onImageUrlSelected).toHaveBeenCalledWith('data:image/png;base64,test');
        expect(onClose).toHaveBeenCalled();
    });

    it('keeps managed dataset visible when it has no test images', async ({ expect }) => {
        const store = createStore();
        store.set(datasetState, [
            {
                id: 'ds-1',
                name: 'Only Training Dataset',
                images: [{ id: 'img-1', split: 'training', data: createCanvas() }],
            },
        ]);

        render(
            <Provider store={store}>
                <DatasetTestPicker
                    open={true}
                    onClose={() => {}}
                    onImageSelected={() => {}}
                    onImageUrlSelected={() => {}}
                />
            </Provider>
        );

        expect(screen.getByText('Only Training Dataset')).toBeInTheDocument();
        expect(screen.getByText('dataExplorer.empty.noTestImages')).toBeInTheDocument();
    });
});
