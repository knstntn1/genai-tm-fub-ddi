import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageSearchDialog from './ImageSearchDialog';
import { ImageSearchError, type ImageSearchResult, type ImageSearchResponse } from '@genaitm/util/imageSearch';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const copy: Record<string, string> = {
                'trainingdata.imageSearch.title': 'Bildersuche',
                'trainingdata.imageSearch.searchLabel': 'Suchbegriff',
                'trainingdata.imageSearch.searchPlaceholder': 'z. B. Katze',
                'trainingdata.imageSearch.searchAction': 'Bilder suchen',
                'trainingdata.imageSearch.useImage': 'Dieses Bild nutzen',
                'trainingdata.imageSearch.loading': 'Suche Bilder...',
                'trainingdata.imageSearch.loadingMore': 'Weitere Bilder werden geladen...',
                'trainingdata.imageSearch.initial': 'Suche nach Bildern für diese Klasse.',
                'trainingdata.imageSearch.emptyTitle': 'Keine Bilder gefunden.',
                'trainingdata.imageSearch.emptyBody': 'Versuche einen anderen Suchbegriff.',
                'trainingdata.imageSearch.retryableError': 'Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.',
                'trainingdata.imageSearch.rateLimit':
                    'Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.',
                'trainingdata.imageSearch.retry': 'Erneut versuchen',
                'trainingdata.imageSearch.more': 'Mehr Ergebnisse',
                'trainingdata.imageSearch.pendingUse': 'Bild wird hinzugefügt...',
                'trainingdata.imageSearch.failedUse': 'Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.',
                'trainingdata.imageSearch.emptyQuery': 'Gib zuerst einen Suchbegriff ein.',
                'trainingdata.aria.close': 'Schließen',
                'trainingdata.imageSearch.fallbackAlt': 'Bild aus Wikimedia Commons',
            };
            return copy[key] ?? key;
        },
    }),
}));

const catResult: ImageSearchResult = {
    id: 'cat-1',
    title: 'Visible Cat Metadata',
    imageUrl: 'https://example.com/cat-full.jpg',
    thumbnailUrl: 'https://example.com/cat-thumb.jpg',
    width: 1024,
    height: 768,
    source: 'Metadata Source',
    foreignLandingUrl: 'https://example.com/cat-page',
    license: 'Metadata License',
    licenseUrl: 'https://example.com/license',
    creator: 'Metadata Creator',
};

const dogResult: ImageSearchResult = {
    id: 'dog-1',
    title: 'Dog Metadata',
    imageUrl: 'https://example.com/dog-full.jpg',
    thumbnailUrl: 'https://example.com/dog-thumb.jpg',
};

function searchResponse(results: ImageSearchResult[], page = 1, pageCount = 1): ImageSearchResponse {
    return {
        results,
        page,
        pageCount,
        pageSize: 20,
        resultCount: results.length,
    };
}

function renderDialog(
    searchClient = vi.fn<() => Promise<ImageSearchResponse>>(),
    onUseImage = vi.fn()
) {
    return render(
        <ImageSearchDialog
            open={true}
            onClose={() => {}}
            onUseImage={onUseImage}
            searchClient={searchClient}
        />
    );
}

describe('ImageSearchDialog', () => {
    it('shows a provider-neutral dialog title', ({ expect }) => {
        renderDialog();

        expect(screen.getByRole('heading', { name: 'Bildersuche' })).toBeInTheDocument();
    });

    it('submits only through the button or Enter and blocks whitespace queries', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi.fn().mockResolvedValue(searchResponse([]));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');

        expect(searchClient).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        await waitFor(() => expect(searchClient).toHaveBeenCalledTimes(1));
        expect(searchClient).toHaveBeenCalledWith({
            query: 'katze',
            page: 1,
            signal: expect.any(AbortSignal),
        });

        await user.clear(screen.getByLabelText('Suchbegriff'));
        await user.type(screen.getByLabelText('Suchbegriff'), ' hund{enter}');

        await waitFor(() => expect(searchClient).toHaveBeenCalledTimes(2));
        expect(searchClient).toHaveBeenLastCalledWith({
            query: 'hund',
            page: 1,
            signal: expect.any(AbortSignal),
        });

        await user.clear(screen.getByLabelText('Suchbegriff'));
        await user.type(screen.getByLabelText('Suchbegriff'), '   ');
        await user.keyboard('{Enter}');

        expect(screen.getByRole('button', { name: 'Bilder suchen' })).toBeDisabled();
        expect(searchClient).toHaveBeenCalledTimes(2);
    });

    it('renders loading, empty, retryable error, and rate-limit states', async ({ expect }) => {
        const user = userEvent.setup();
        const pendingClient = vi.fn(() => new Promise<ImageSearchResponse>(() => {}));
        const pendingRender = render(
            <ImageSearchDialog
                open={true}
                onClose={() => {}}
                onUseImage={() => {}}
                searchClient={pendingClient}
            />
        );

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        expect(await screen.findByText('Suche Bilder...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Bilder suchen' })).toBeDisabled();

        pendingRender.unmount();

        const emptyClient = vi.fn().mockResolvedValue(searchResponse([]));
        const emptyRender = render(
            <ImageSearchDialog
                open={true}
                onClose={() => {}}
                onUseImage={() => {}}
                searchClient={emptyClient}
            />
        );

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        expect(await screen.findByText('Keine Bilder gefunden.')).toBeInTheDocument();
        expect(screen.getByText('Versuche einen anderen Suchbegriff.')).toBeInTheDocument();

        emptyRender.unmount();

        const retryClient = vi.fn().mockRejectedValue(new ImageSearchError('network', 'failed'));
        const retryRender = render(
            <ImageSearchDialog
                open={true}
                onClose={() => {}}
                onUseImage={() => {}}
                searchClient={retryClient}
            />
        );

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        expect(await screen.findByText('Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();

        retryRender.unmount();

        const rateLimitClient = vi.fn().mockRejectedValue(new ImageSearchError('rate-limited', 'slow down'));
        render(
            <ImageSearchDialog
                open={true}
                onClose={() => {}}
                onUseImage={() => {}}
                searchClient={rateLimitClient}
            />
        );

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        expect(
            await screen.findByText('Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.')
        ).toBeInTheDocument();
    });

    it('renders image-only results without visible metadata or advanced controls', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi.fn().mockResolvedValue(searchResponse([catResult]));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        expect(await screen.findByRole('img', { name: 'Visible Cat Metadata' })).toHaveAttribute(
            'src',
            catResult.thumbnailUrl
        );
        expect(screen.queryByText('Visible Cat Metadata')).not.toBeInTheDocument();
        expect(screen.queryByText('Metadata License')).not.toBeInTheDocument();
        expect(screen.queryByText('Metadata Creator')).not.toBeInTheDocument();
        expect(screen.queryByText('Metadata Source')).not.toBeInTheDocument();
        expect(screen.queryByText('1024')).not.toBeInTheDocument();
        expect(screen.queryByText('768')).not.toBeInTheDocument();
        expect(screen.queryByText('https://example.com/cat-page')).not.toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: /lizenz|quelle|urheber|format|filter/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: /mature|erwachsen|filter/i })).not.toBeInTheDocument();
    });

    it('uses the selected result through hover, focus, click, Enter, and Space activation', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi.fn().mockResolvedValue(searchResponse([catResult]));
        const onUseImage = vi.fn();
        renderDialog(searchClient, onUseImage);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));

        const tile = await screen.findByRole('button', { name: /Dieses Bild nutzen/ });
        await user.hover(tile);
        expect(within(tile).getByText('Dieses Bild nutzen')).toBeInTheDocument();

        tile.focus();
        expect(tile).toHaveFocus();

        await user.click(tile);
        await user.keyboard('{Enter}');
        await user.keyboard(' ');

        expect(onUseImage).toHaveBeenCalledTimes(3);
        expect(onUseImage).toHaveBeenNthCalledWith(1, catResult);
        expect(onUseImage).toHaveBeenNthCalledWith(2, catResult);
        expect(onUseImage).toHaveBeenNthCalledWith(3, catResult);
    });

    it('announces pending selected image use while the callback is running', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi.fn().mockResolvedValue(searchResponse([catResult]));
        const onUseImage = vi.fn(() => new Promise<void>(() => {}));
        renderDialog(searchClient, onUseImage);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: /Dieses Bild nutzen/ }));

        expect(await screen.findByRole('status')).toHaveTextContent('Bild wird hinzugefügt...');
    });

    it('loads the next page and appends results', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi
            .fn()
            .mockResolvedValueOnce(searchResponse([catResult], 1, 2))
            .mockResolvedValueOnce(searchResponse([dogResult], 2, 2));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'tier');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        expect(await screen.findByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Mehr Ergebnisse' }));

        expect(await screen.findByRole('img', { name: 'Dog Metadata' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();
        expect(searchClient).toHaveBeenLastCalledWith({
            query: 'tier',
            page: 2,
            signal: expect.any(AbortSignal),
        });
    });

    it('retries the failed query instead of the previous successful query', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi
            .fn()
            .mockResolvedValueOnce(searchResponse([catResult], 1, 1))
            .mockRejectedValueOnce(new ImageSearchError('network', 'failed'))
            .mockResolvedValueOnce(searchResponse([dogResult], 1, 1));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        expect(await screen.findByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Suchbegriff'));
        await user.type(screen.getByLabelText('Suchbegriff'), 'hund');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        expect(await screen.findByText('Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

        expect(await screen.findByRole('img', { name: 'Dog Metadata' })).toBeInTheDocument();
        expect(searchClient).toHaveBeenLastCalledWith({
            query: 'hund',
            page: 1,
            signal: expect.any(AbortSignal),
        });
    });

    it('retries a failed next-page request and appends the recovered page', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi
            .fn()
            .mockResolvedValueOnce(searchResponse([catResult], 1, 2))
            .mockRejectedValueOnce(new ImageSearchError('http', 'failed'))
            .mockResolvedValueOnce(searchResponse([dogResult], 2, 2));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'tier');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        expect(await screen.findByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Mehr Ergebnisse' }));
        expect(await screen.findByText('Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

        expect(await screen.findByRole('img', { name: 'Dog Metadata' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();
        expect(searchClient).toHaveBeenLastCalledWith({
            query: 'tier',
            page: 2,
            signal: expect.any(AbortSignal),
        });
    });

    it('announces loading additional results', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi
            .fn()
            .mockResolvedValueOnce(searchResponse([catResult], 1, 2))
            .mockImplementationOnce(() => new Promise<ImageSearchResponse>(() => {}));
        renderDialog(searchClient);

        await user.type(screen.getByLabelText('Suchbegriff'), 'tier');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        expect(await screen.findByRole('img', { name: 'Visible Cat Metadata' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Mehr Ergebnisse' }));

        expect(await screen.findByRole('status')).toHaveTextContent('Weitere Bilder werden geladen...');
    });

    it('shows failed-use state and keeps Phase 2 free of class-state/import mutation code', async ({ expect }) => {
        const user = userEvent.setup();
        const searchClient = vi.fn().mockResolvedValue(searchResponse([catResult]));
        const onUseImage = vi.fn().mockRejectedValue(new Error('future import failed'));
        renderDialog(searchClient, onUseImage);

        await user.type(screen.getByLabelText('Suchbegriff'), 'katze');
        await user.click(screen.getByRole('button', { name: 'Bilder suchen' }));
        await user.click(await screen.findByRole('button', { name: /Dieses Bild nutzen/ }));

        expect(
            await screen.findByText('Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.')
        ).toBeInTheDocument();

        const source = readFileSync(resolve('src/workflow/ImageSearch/ImageSearchDialog.tsx'), 'utf8');
        const forbiddenTerms = [
            '@genaitm/' + 'state',
            'class' + 'State',
            'set' + 'Data',
            'import' + 'RemoteImage',
            'remote' + 'ImageImport',
            'samples' + ':',
        ];

        for (const forbiddenTerm of forbiddenTerms) {
            expect(source).not.toContain(forbiddenTerm);
        }
    });
});
