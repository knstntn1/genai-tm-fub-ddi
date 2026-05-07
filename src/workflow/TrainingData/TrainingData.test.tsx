import { beforeEach, describe, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingData } from './TrainingData';
import TestWrapper from '../../util/TestWrapper';
import type { IClassification } from '../../state';
import { searchOpenVerseImages, type OpenVerseImageResult } from '@genaitm/util/openverse';
import { importOpenVerseImage } from '@genaitm/util/openverseImageImport';

vi.mock('@genaitm/util/openverse', () => ({
    OpenVerseSearchError: class OpenVerseSearchError extends Error {
        readonly code: string;

        constructor(code: string, message: string) {
            super(message);
            this.code = code;
        }
    },
    searchOpenVerseImages: vi.fn(),
}));

vi.mock('@genaitm/util/openverseImageImport', () => ({
    importOpenVerseImage: vi.fn(),
}));

const catResult: OpenVerseImageResult = {
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

describe('TrainingData component', () => {
    beforeEach(() => {
        vi.mocked(searchOpenVerseImages).mockReset();
        vi.mocked(importOpenVerseImage).mockReset();
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

    it('adds an imported OpenVerse canvas only to the selected class and keeps existing sample order behind it', async ({
        expect,
    }) => {
        const user = userEvent.setup();
        const importedCanvas = createCanvas('imported-canvas');
        const existingCanvas = createCanvas('existing-canvas');
        let latestData: IClassification[] = [];
        vi.mocked(searchOpenVerseImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importOpenVerseImage).mockResolvedValue(importedCanvas);

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
        await user.click(within(class2).getByTestId('openversebutton'));
        await user.type(screen.getByLabelText('trainingdata.openverse.searchLabel'), 'cat');
        await user.click(screen.getByRole('button', { name: 'trainingdata.openverse.searchAction' }));
        await user.click(await screen.findByRole('button', { name: 'trainingdata.openverse.useImage: Cat' }));

        await waitFor(() => expect(latestData[1].samples).toHaveLength(2));
        expect(latestData[0].samples).toHaveLength(0);
        expect(latestData[1].samples[0]).toEqual({ data: importedCanvas, id: '' });
        expect(latestData[1].samples[1]).toEqual({ data: existingCanvas, id: 'existing' });
        expect(await screen.findByTestId('imported-canvas')).toBeInTheDocument();
    });
});
