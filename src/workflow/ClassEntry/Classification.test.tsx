import { beforeEach, describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Classification } from './Classification';
import TestWrapper from '../../util/TestWrapper';
import { VariantContext, type IVariantContext } from '../../util/variant';
import { searchWikimediaCommonsImages } from '@genaitm/util/wikimediaCommons';
import type { ImageSearchResult } from '@genaitm/util/imageSearch';
import { importRemoteImage } from '@genaitm/util/remoteImageImport';

vi.mock('@genaitm/util/wikimediaCommons', () => ({
    searchWikimediaCommonsImages: vi.fn(),
}));

vi.mock('@genaitm/util/remoteImageImport', () => ({
    importRemoteImage: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const translations: Record<string, string> = {
                'trainingdata.actions.webcam': 'Webcam',
                'trainingdata.actions.audio': 'Mikrofon',
                'trainingdata.actions.upload': 'Hochladen',
                'trainingdata.actions.datasets': 'Datensätze',
                'trainingdata.actions.imageSearch': 'Bildsuche',
                'trainingdata.labels.addSamples': 'Bildbeispiele hinzufügen',
                'trainingdata.labels.addAudioSamples': 'Audiobeispiele hinzufügen',
                'trainingdata.labels.dropFiles': 'oder ziehe Bilder von einer Website oder Datei hierher',
                'trainingdata.labels.dropAudioFiles': 'oder ziehe Audiodateien von einer Website oder Datei hierher',
                'trainingdata.aria.classCard': `Trainingsdaten für ${values?.name ?? ''}`,
                'trainingdata.aria.close': 'Schließen',
                'trainingdata.imageSearch.title': 'Bildersuche',
                'trainingdata.imageSearch.searchLabel': 'Suchbegriff',
                'trainingdata.imageSearch.searchPlaceholder': 'z. B. Katze',
                'trainingdata.imageSearch.searchAction': 'Bilder suchen',
                'trainingdata.imageSearch.useImage': 'Dieses Bild nutzen',
                'trainingdata.imageSearch.initial': 'Suche nach Bildern für diese Klasse.',
                'trainingdata.imageSearch.loading': 'Suche Bilder...',
                'trainingdata.imageSearch.pendingUse': 'Bild wird hinzugefügt...',
                'trainingdata.imageSearch.failedUse': 'Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.',
                'trainingdata.imageSearch.fallbackAlt': 'Bild aus Wikimedia Commons',
            };
            return translations[key] ?? key;
        },
        i18n: { changeLanguage: () => Promise.resolve() },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => {},
    },
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    I18nextProvider: ({ children }: { children: ReactNode }) => children,
}));

const speechVariant: IVariantContext = {
    namespace: 'image_adv',
    modelVariant: 'speech',
    sampleUploadFile: true,
};

const catResult: ImageSearchResult = {
    id: 'cat-1',
    title: 'Katze',
    imageUrl: 'https://example.com/cat-full.jpg',
    thumbnailUrl: 'https://example.com/cat-thumb.jpg',
};

const dogResult: ImageSearchResult = {
    id: 'dog-1',
    title: 'Hund',
    imageUrl: 'https://example.com/dog-full.jpg',
    thumbnailUrl: 'https://example.com/dog-thumb.jpg',
};

function createCanvas(testId = 'imported-canvas') {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-testid', testId);
    return canvas;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('Classification component', () => {
    beforeEach(() => {
        vi.mocked(searchWikimediaCommonsImages).mockReset();
        vi.mocked(importRemoteImage).mockReset();
    });

    it('renders with no samples and inactive', async ({ expect }) => {
        render(
            <Classification
                name="TestClass"
                index={0}
                active={false}
                data={{ label: 'TestClass', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        expect(screen.getByTestId('widget-TestClass')).toBeInTheDocument();
        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
    });

    it('shows dataset and Wikimedia Commons actions beside camera and upload for image classes', async ({ expect }) => {
        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
        expect(screen.getByTestId('uploadbutton')).toBeInTheDocument();
        expect(screen.getByTestId('datasetbutton')).toHaveTextContent('Datensätze');
        expect(screen.getByTestId('image-search-button')).toHaveTextContent('Bildsuche');
    });

    it('opens the image search dialog', async ({ expect }) => {
        const user = userEvent.setup();

        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));

        expect(await screen.findByText('Bildersuche')).toBeInTheDocument();
    });

    it('does not show the Wikimedia Commons image search action for speech classes', async ({ expect }) => {
        render(
            <VariantContext.Provider value={speechVariant}>
                <Classification
                    name="Hintergrundgeräusch"
                    index={0}
                    active={false}
                    data={{ label: 'Hintergrundgeräusch', samples: [] }}
                    setData={() => {}}
                    setActive={() => {}}
                    onActivate={() => {}}
                    onDelete={() => {}}
                />
            </VariantContext.Provider>,
            { wrapper: TestWrapper }
        );

        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
        expect(screen.queryByTestId('datasetbutton')).not.toBeInTheDocument();
        expect(screen.queryByTestId('image-search-button')).not.toBeInTheDocument();
        expect(screen.queryByText('Bildsuche')).not.toBeInTheDocument();
    });

    it('imports a selected Wikimedia Commons result before prepending a normal sample', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn();
        const importedCanvas = createCanvas();
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockResolvedValue(importedCanvas);

        render(
            <Classification
                name="Katze"
                index={1}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Katze' }));

        await waitFor(() => expect(importRemoteImage).toHaveBeenCalledTimes(1));
        expect(importRemoteImage).toHaveBeenCalledWith({
            imageUrl: catResult.imageUrl,
            fallbackUrl: catResult.thumbnailUrl,
            signal: expect.any(AbortSignal),
        });
        expect(setData).toHaveBeenCalledTimes(1);
        expect(setData).toHaveBeenCalledWith(expect.any(Function), 1, { label: 'Katze', samples: [] });

        const updater = setData.mock.calls[0][0] as (old: { label: string; samples: []; disabled?: boolean }) => {
            label: string;
            samples: { data: HTMLCanvasElement; id: string }[];
            disabled?: boolean;
        };
        const updated = updater({ label: 'Katze', samples: [], disabled: true });

        expect(updated).toEqual({
            label: 'Katze',
            samples: [{ data: importedCanvas, id: '' }],
            disabled: true,
        });
        expect(importedCanvas.style.width).toBe('58px');
        expect(importedCanvas.style.height).toBe('58px');
    });

    it('keeps the dialog recoverable and leaves samples unchanged when import fails', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn();
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockRejectedValue(new Error('import failed'));

        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Katze' }));

        expect(await screen.findByText('Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.')).toBeInTheDocument();
        expect(screen.getByLabelText('Suchbegriff')).toHaveValue('katze');
        expect(setData).not.toHaveBeenCalled();
    });

    it('discards a late import when the class label changes before it resolves', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn();
        const pendingImport = deferred<HTMLCanvasElement>();
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockReturnValue(pendingImport.promise);

        const { rerender } = render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Katze' }));

        rerender(
            <Classification
                name="Hund"
                index={0}
                active={false}
                data={{ label: 'Hund', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />
        );
        pendingImport.resolve(createCanvas());

        expect(await screen.findByText('Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.')).toBeInTheDocument();
        expect(setData).not.toHaveBeenCalled();
    });

    it('discards an older import when a newer result supersedes it', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn();
        const firstImport = deferred<HTMLCanvasElement>();
        const secondCanvas = createCanvas('second-canvas');
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult, dogResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 2,
        });
        vi.mocked(importRemoteImage)
            .mockReturnValueOnce(firstImport.promise)
            .mockResolvedValueOnce(secondCanvas);

        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'tier');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Katze' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Hund' }));

        await waitFor(() => expect(setData).toHaveBeenCalledTimes(1));
        firstImport.resolve(createCanvas('first-canvas'));

        await waitFor(() => expect(setData).toHaveBeenCalledTimes(1));
        const updater = setData.mock.calls[0][0] as (old: { label: string; samples: [] }) => {
            samples: { data: HTMLCanvasElement; id: string }[];
        };
        expect(updater({ label: 'Katze', samples: [] }).samples).toEqual([{ data: secondCanvas, id: '' }]);
    });

    it('keeps the dialog open when the target class update is rejected', async ({ expect }) => {
        const user = userEvent.setup();
        const setData = vi.fn(() => false);
        vi.mocked(searchWikimediaCommonsImages).mockResolvedValue({
            results: [catResult],
            page: 1,
            pageCount: 1,
            pageSize: 20,
            resultCount: 1,
        });
        vi.mocked(importRemoteImage).mockResolvedValue(createCanvas());

        render(
            <Classification
                name="Katze"
                index={1}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={setData}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('image-search-button'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: 'Dieses Bild nutzen: Katze' }));

        expect(await screen.findByText('Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Bildersuche' })).toBeInTheDocument();
    });
});
