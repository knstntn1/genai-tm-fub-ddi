import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpenVerseSearchDialog from './OpenVerseSearchDialog';
import { OpenVerseSearchError, type OpenVerseImageResult, type OpenVerseImageSearchResult } from '@genaitm/util/openverse';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const copy: Record<string, string> = {
                'trainingdata.openverse.title': `OpenVerse: ${values?.className ?? ''}`,
                'trainingdata.openverse.searchLabel': 'Suchbegriff',
                'trainingdata.openverse.searchPlaceholder': 'z. B. Katze',
                'trainingdata.openverse.searchAction': 'Bilder suchen',
                'trainingdata.openverse.useImage': 'Dieses Bild nutzen',
                'trainingdata.openverse.loading': 'Suche Bilder...',
                'trainingdata.openverse.loadingMore': 'Weitere Bilder werden geladen...',
                'trainingdata.openverse.initial': 'Suche nach Bildern für diese Klasse.',
                'trainingdata.openverse.emptyTitle': 'Keine Bilder gefunden.',
                'trainingdata.openverse.emptyBody': 'Versuche einen anderen Suchbegriff.',
                'trainingdata.openverse.retryableError': 'Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.',
                'trainingdata.openverse.rateLimit':
                    'Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.',
                'trainingdata.openverse.retry': 'Erneut versuchen',
                'trainingdata.openverse.more': 'Mehr Ergebnisse',
                'trainingdata.openverse.failedUse': 'Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.',
                'trainingdata.openverse.emptyQuery': 'Gib zuerst einen Suchbegriff ein.',
                'trainingdata.aria.close': 'Schließen',
                'trainingdata.openverse.fallbackAlt': 'OpenVerse Bild',
            };
            return copy[key] ?? key;
        },
    }),
}));

const catResult: OpenVerseImageResult = {
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
    mature: false,
};

const dogResult: OpenVerseImageResult = {
    id: 'dog-1',
    title: 'Dog Metadata',
    imageUrl: 'https://example.com/dog-full.jpg',
    thumbnailUrl: 'https://example.com/dog-thumb.jpg',
};

function searchResponse(results: OpenVerseImageResult[], page = 1, pageCount = 1): OpenVerseImageSearchResult {
    return {
        results,
        page,
        pageCount,
        pageSize: 20,
        resultCount: results.length,
    };
}

function renderDialog(
    searchClient = vi.fn<() => Promise<OpenVerseImageSearchResult>>(),
    onUseImage = vi.fn()
) {
    return render(
        <OpenVerseSearchDialog
            open={true}
            className="Klasse 1"
            onClose={() => {}}
            onUseImage={onUseImage}
            searchClient={searchClient}
        />
    );
}

describe('OpenVerseSearchDialog', () => {
    it('shows the current class in the dialog title', ({ expect }) => {
        renderDialog();

        expect(screen.getByRole('heading', { name: 'OpenVerse: Klasse 1' })).toBeInTheDocument();
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
        const pendingClient = vi.fn(() => new Promise<OpenVerseImageSearchResult>(() => {}));
        const pendingRender = render(
            <OpenVerseSearchDialog
                open={true}
                className="Klasse 1"
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
            <OpenVerseSearchDialog
                open={true}
                className="Klasse 1"
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

        const retryClient = vi.fn().mockRejectedValue(new OpenVerseSearchError('network', 'failed'));
        const retryRender = render(
            <OpenVerseSearchDialog
                open={true}
                className="Klasse 1"
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

        const rateLimitClient = vi.fn().mockRejectedValue(new OpenVerseSearchError('rate-limited', 'slow down'));
        render(
            <OpenVerseSearchDialog
                open={true}
                className="Klasse 1"
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

        const source = readFileSync(resolve('src/workflow/OpenVerseSearch/OpenVerseSearchDialog.tsx'), 'utf8');
        const forbiddenTerms = [
            '@genaitm/' + 'state',
            'class' + 'State',
            'set' + 'Data',
            'import' + 'OpenVerseImage',
            'openverse' + 'ImageImport',
            'samples' + ':',
        ];

        for (const forbiddenTerm of forbiddenTerms) {
            expect(source).not.toContain(forbiddenTerm);
        }
    });
});
