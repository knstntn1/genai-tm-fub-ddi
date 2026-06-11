import { describe, it, vi } from 'vitest';
import { ImageSearchError } from './imageSearch';
import {
    DEFAULT_WIKIMEDIA_COMMONS_PAGE_SIZE,
    searchWikimediaCommonsImages,
    WIKIMEDIA_COMMONS_API_URL,
} from './wikimediaCommons';

function successfulResponse(pages: unknown[] = [], hasMore = false): Response {
    return {
        ok: true,
        json: () =>
            Promise.resolve({
                batchcomplete: true,
                ...(hasMore ? { continue: { gsroffset: DEFAULT_WIKIMEDIA_COMMONS_PAGE_SIZE } } : {}),
                query: { pages },
            }),
    } as Response;
}

describe('Wikimedia Commons image search client', () => {
    it('throws a typed error for blank queries', async ({ expect }) => {
        await expect(searchWikimediaCommonsImages({ query: '   ' })).rejects.toMatchObject({
            code: 'empty-query',
        });
        await expect(searchWikimediaCommonsImages({ query: '   ' })).rejects.toBeInstanceOf(ImageSearchError);
    });

    it('builds a browser-safe Commons file search request', async ({ expect }) => {
        global.fetch = vi.fn(() => Promise.resolve(successfulResponse())) as unknown as typeof fetch;

        await searchWikimediaCommonsImages({ query: ' Katze ' });

        const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
        const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
        expect(requestUrl.origin + requestUrl.pathname).toBe(WIKIMEDIA_COMMONS_API_URL);
        expect(requestUrl.searchParams.get('action')).toBe('query');
        expect(requestUrl.searchParams.get('generator')).toBe('search');
        expect(requestUrl.searchParams.get('gsrsearch')).toBe('Katze filetype:bitmap');
        expect(requestUrl.searchParams.get('gsrnamespace')).toBe('6');
        expect(requestUrl.searchParams.get('gsrlimit')).toBe('20');
        expect(requestUrl.searchParams.get('gsroffset')).toBe('0');
        expect(requestUrl.searchParams.get('prop')).toBe('imageinfo');
        expect(requestUrl.searchParams.get('iiprop')).toBe('url|mime|size|extmetadata');
        expect(requestUrl.searchParams.get('iiurlwidth')).toBe('480');
        expect(requestUrl.searchParams.get('origin')).toBe('*');
        expect(fetchMock.mock.calls[0][1]).toEqual({ signal: undefined });
    });

    it('uses an offset for subsequent pages and normalizes pagination', async ({ expect }) => {
        global.fetch = vi.fn(() => Promise.resolve(successfulResponse([], true))) as unknown as typeof fetch;

        const response = await searchWikimediaCommonsImages({ query: 'Hund', page: 2, pageSize: 10 });
        const requestUrl = new URL(String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]));

        expect(requestUrl.searchParams.get('gsroffset')).toBe('10');
        expect(response).toMatchObject({
            page: 2,
            pageCount: 3,
            pageSize: 10,
        });
    });

    it('normalizes usable bitmap results into app-owned fields', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve(
                successfulResponse([
                    {
                        pageid: 123,
                        title: 'File:Katze im Schnee.jpg',
                        imageinfo: [
                            {
                                url: 'https://upload.wikimedia.org/original.jpg',
                                thumburl: 'https://upload.wikimedia.org/thumb.jpg',
                                width: 3000,
                                height: 2000,
                                mime: 'image/jpeg',
                                descriptionurl: 'https://commons.wikimedia.org/wiki/File:Katze_im_Schnee.jpg',
                                extmetadata: {
                                    LicenseShortName: { value: 'CC BY-SA 4.0' },
                                    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                                    Artist: { value: '<a href="/wiki/User:Example">Example</a>' },
                                },
                            },
                        ],
                    },
                ])
            )
        ) as unknown as typeof fetch;

        const response = await searchWikimediaCommonsImages({ query: 'Katze' });

        expect(response.results).toEqual([
            {
                id: '123',
                title: 'Katze im Schnee.jpg',
                imageUrl: 'https://upload.wikimedia.org/thumb.jpg',
                thumbnailUrl: 'https://upload.wikimedia.org/thumb.jpg',
                width: 3000,
                height: 2000,
                source: 'Wikimedia Commons',
                foreignLandingUrl: 'https://commons.wikimedia.org/wiki/File:Katze_im_Schnee.jpg',
                license: 'CC BY-SA 4.0',
                licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
                creator: 'Example',
            },
        ]);
        expect(response.pageCount).toBe(1);
        expect(response.resultCount).toBe(1);
    });

    it('returns an empty result when Commons has no query pages', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ batchcomplete: true }),
            } as Response)
        ) as unknown as typeof fetch;

        const response = await searchWikimediaCommonsImages({ query: 'nichts' });
        expect(response.results).toEqual([]);
        expect(response.resultCount).toBe(0);
    });

    it('drops malformed entries while retaining usable images', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve(
                successfulResponse([
                    { pageid: 1, title: 'File:Broken.jpg' },
                    {
                        pageid: 2,
                        title: 'File:Usable.png',
                        imageinfo: [
                            {
                                url: 'https://upload.wikimedia.org/original.png',
                                thumburl: 'https://upload.wikimedia.org/thumb.png',
                                mime: 'image/png',
                            },
                        ],
                    },
                ])
            )
        ) as unknown as typeof fetch;

        const response = await searchWikimediaCommonsImages({ query: 'Bild' });
        expect(response.results.map((result) => result.id)).toEqual(['2']);
    });

    it('maps HTTP, rate-limit, network, abort, and invalid JSON failures', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 429,
                headers: new Headers({ 'Retry-After': '30' }),
            } as Response)
        ) as unknown as typeof fetch;
        await expect(searchWikimediaCommonsImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'rate-limited',
            status: 429,
            retryAfter: '30',
        });

        global.fetch = vi.fn(() =>
            Promise.resolve({ ok: false, status: 500, headers: new Headers() } as Response)
        ) as unknown as typeof fetch;
        await expect(searchWikimediaCommonsImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'http',
            status: 500,
        });

        global.fetch = vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
        await expect(searchWikimediaCommonsImages({ query: 'Katze' })).rejects.toMatchObject({ code: 'network' });

        const controller = new AbortController();
        const abortError = new DOMException('Aborted', 'AbortError');
        controller.abort();
        global.fetch = vi.fn(() => Promise.reject(abortError)) as unknown as typeof fetch;
        await expect(searchWikimediaCommonsImages({ query: 'Katze', signal: controller.signal })).rejects.toBe(
            abortError
        );

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.reject(new SyntaxError('bad json')),
            } as Response)
        ) as unknown as typeof fetch;
        await expect(searchWikimediaCommonsImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'invalid-response',
        });
    });

    it('rejects responses containing only unusable entries', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve(successfulResponse([{ pageid: 1, title: 'File:Broken.jpg' }]))
        ) as unknown as typeof fetch;

        await expect(searchWikimediaCommonsImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'invalid-response',
        });
    });
});
