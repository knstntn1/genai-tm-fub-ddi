import { beforeEach, describe, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingData } from './TrainingData';
import TestWrapper from '../../util/TestWrapper';
import type { IClassification } from '../../state';
import { searchWikimediaCommonsImages } from '@genaitm/util/wikimediaCommons';
import type { ImageSearchResult } from '@genaitm/util/imageSearch';
import { importRemoteImage } from '@genaitm/util/remoteImageImport';

vi.mock('@genaitm/util/wikimediaCommons', () => ({
    searchWikimediaCommonsImages: vi.fn(),
}));

vi.mock('@genaitm/util/remoteImageImport', () => ({
    importRemoteImage: vi.fn(),
}));

const catResult: ImageSearchResult = {
    id: 'cat-1',
    title: 'Cat',
    imageUrl: 'https://example.com/cat-full.jpg',
    thumbnailUrl: 'https://example.com/cat-thumb.jpg',
};

function createCanvas(testId: string) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-testid', testId);
    return canvas;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

function StatefulTrainingData({
    initialData,
    onData,
}: {
    initialData: IClassification[];
    onData: (data: IClassification[]) => void;
}) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        onData(data);
    }, [data, onData]);

    return (
        <TrainingData
            active={true}
            data={data}
            setData={setData}
            onFocused={() => {}}
        />
    );
}

function RemovableTrainingData({
    initialData,
    onData,
    onReadyRemove,
}: {
    initialData: IClassification[];
    onData: (data: IClassification[]) => void;
    onReadyRemove: (remove: () => void) => void;
}) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        onData(data);
    }, [data, onData]);

    useEffect(() => {
        onReadyRemove(() => setData((current) => current.slice(1)));
    }, [onReadyRemove]);

    return (
        <TrainingData
            active={true}
            data={data}
            setData={setData}
            onFocused={() => {}}
        />
    );
}

describe('TrainingData component', () => {
    beforeEach(() => {
        vi.mocked(searchWikimediaCommonsImages).mockReset();
        vi.mocked(importRemoteImage).mockReset();
    });

    it('renders with no data', async ({ expect }) => {
        render(
            <TrainingData
                active={true}
                data={[]}
                setData={() => {}}
                onFocused={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        const linkElement = screen.getByTestId('addClass');
        expect(linkElement).toBeInTheDocument();
    });

    it('can add new classes', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn();
        render(
            <TrainingData
                active={true}
                data={[]}
                setData={setData}
                onFocused={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        const linkElement = screen.getByText(/trainingdata.actions.addClass/i);
        await user.click(linkElement);
        expect(setData).toHaveBeenCalledTimes(1);
    });

    it('renders with multiple data items but no samples', async ({ expect }) => {
        const testData = [
            { label: 'Class1', samples: [] },
            { label: 'Class2', samples: [] },
        ];
        render(
            <TrainingData
                active={true}
                data={testData}
                setData={() => {}}
                onFocused={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        expect(screen.getByTestId('widget-Class1')).toBeInTheDocument();
        expect(screen.getByTestId('widget-Class2')).toBeInTheDocument();
    });

    it('renders with samples', async ({ expect }) => {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('data-testid', 'testcanvas');
        const testData = [{ label: 'Class1', samples: [{ data: canvas, id: '' }] }];
        render(
            <TrainingData
                active={true}
                data={testData}
                setData={() => {}}
                onFocused={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        expect(screen.getByTestId('widget-Class1')).toBeInTheDocument();
        expect(screen.getByTestId('testcanvas')).toBeInTheDocument();
    });

    it('adds an imported Wikimedia Commons canvas only to the selected class and keeps existing sample order behind it', async ({
        expect,
    }) => {
        const user = userEvent.setup();
        const importedCanvas = createCanvas('imported-canvas');
        const existingCanvas = createCanvas('existing-canvas');
        let latestData: IClassification[] = [];
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockResolvedValue(importedCanvas);

        render(
            <StatefulTrainingData
                initialData={[
                    { label: 'Class1', samples: [] },
                    { label: 'Class2', samples: [{ data: existingCanvas, id: 'existing' }] },
                ]}
                onData={(data) => {
                    latestData = data;
                }}
            />,
            { wrapper: TestWrapper }
        );

        const class2 = screen.getByTestId('widget-Class2');
        await user.click(within(class2).getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('trainingdata.imageSearch.searchLabel'), 'cat');
        await user.click(screen.getByRole('button', { name: 'trainingdata.imageSearch.searchAction' }));
        await user.click(await screen.findByRole('button', { name: 'trainingdata.imageSearch.useImage: Cat' }));

        await waitFor(() => expect(latestData[1].samples).toHaveLength(2));
        expect(latestData[0].samples).toHaveLength(0);
        expect(latestData[1].samples[0]).toEqual({ data: importedCanvas, id: '' });
        expect(latestData[1].samples[1]).toEqual({ data: existingCanvas, id: 'existing' });
        expect(await screen.findByTestId('imported-canvas')).toBeInTheDocument();
    });

    it('does not add a late import after same-label classes shift indexes', async ({ expect }) => {
        const user = userEvent.setup();
        const pendingImport = deferred<HTMLCanvasElement>();
        let latestData: IClassification[] = [];
        let removeFirstClass = () => {};
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockReturnValue(pendingImport.promise);

        render(
            <RemovableTrainingData
                initialData={[
                    { label: 'Same', samples: [] },
                    { label: 'Same', samples: [] },
                ]}
                onData={(data) => {
                    latestData = data;
                }}
                onReadyRemove={(remove) => {
                    removeFirstClass = remove;
                }}
            />,
            { wrapper: TestWrapper }
        );

        const secondClass = screen.getAllByTestId('widget-Same')[1];
        await user.click(within(secondClass).getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('trainingdata.imageSearch.searchLabel'), 'cat');
        await user.click(screen.getByRole('button', { name: 'trainingdata.imageSearch.searchAction' }));
        await user.click(await screen.findByRole('button', { name: 'trainingdata.imageSearch.useImage: Cat' }));
        await act(async () => {
            removeFirstClass();
        });

        pendingImport.resolve(createCanvas('late-import'));

        await waitFor(() => expect(latestData).toHaveLength(1));
        expect(latestData[0].samples).toHaveLength(0);
        expect(screen.queryByTestId('late-import')).not.toBeInTheDocument();
    });
});
