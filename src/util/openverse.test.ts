import { describe, it, vi } from 'vitest';
import {
    OpenVerseSearchError,
    searchOpenVerseImages,
    DEFAULT_OPENVERSE_PAGE_SIZE,
    OPENVERSE_IMAGES_URL,
} from './openverse';

describe('OpenVerse image search client', () => {
    it('throws a typed error for blank queries', async ({ expect }) => {
        await expect(searchOpenVerseImages({ query: '   ' })).rejects.toMatchObject({
            code: 'empty-query',
        });

        await expect(searchOpenVerseImages({ query: '   ' })).rejects.toBeInstanceOf(OpenVerseSearchError);
    });

    it('builds an unauthenticated image search request with safe defaults', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        page: 1,
                        page_count: 3,
                        page_size: DEFAULT_OPENVERSE_PAGE_SIZE,
                        result_count: 45,
                        results: [
                            {
                                id: 'abc',
                                title: 'Katze',
                                url: 'https://images.example/cat.jpg',
                                thumbnail: 'https://images.example/cat-thumb.jpg',
                            },
                        ],
                    }),
            } as Response)
        ) as unknown as typeof fetch;

        await searchOpenVerseImages({ query: ' Katze ' });

        const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
        const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));

        expect(requestUrl.toString()).toBe(
            `${OPENVERSE_IMAGES_URL}?q=Katze&page=1&page_size=20&mature=false`
        );
        expect(fetchMock.mock.calls[0][1]).toEqual({ signal: undefined });
    });

    it('normalizes successful OpenVerse image results into local fields', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        page: 2,
                        page_count: 4,
                        page_size: 10,
                        result_count: 34,
                        results: [
                            {
                                id: 'abc',
                                title: 'Katze',
                                url: 'https://images.example/cat.jpg',
                                thumbnail: 'https://images.example/cat-thumb.jpg',
                                width: 640,
                                height: 480,
                                source: 'example',
                                foreign_landing_url: 'https://example/cat',
                                license: 'cc0',
                                license_url: 'https://license.example/cc0',
                                creator: 'Student',
                                mature: false,
                            },
                        ],
                    }),
            } as Response)
        ) as unknown as typeof fetch;

        const result = await searchOpenVerseImages({ query: 'Katze', page: 2, pageSize: 10 });

        expect(result).toEqual({
            results: [
                {
                    id: 'abc',
                    title: 'Katze',
                    imageUrl: 'https://images.example/cat.jpg',
                    thumbnailUrl: 'https://images.example/cat-thumb.jpg',
                    width: 640,
                    height: 480,
                    source: 'example',
                    foreignLandingUrl: 'https://example/cat',
                    license: 'cc0',
                    licenseUrl: 'https://license.example/cc0',
                    creator: 'Student',
                    mature: false,
                },
            ],
            page: 2,
            pageCount: 4,
            pageSize: 10,
            resultCount: 34,
        });
    });

    it('maps HTTP 429 to a typed rate-limited error with Retry-After', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 429,
                headers: new Headers({ 'Retry-After': '30' }),
                json: () => Promise.resolve({}),
            } as Response)
        ) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'rate-limited',
            status: 429,
            retryAfter: '30',
        });
    });

    it('maps other non-OK responses to typed HTTP errors', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                headers: new Headers(),
                json: () => Promise.resolve({}),
            } as Response)
        ) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'http',
            status: 500,
        });
    });

    it('maps rejected fetches to network errors unless the signal is aborted', async ({ expect }) => {
        global.fetch = vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'network',
        });

        const controller = new AbortController();
        const abortError = new DOMException('Aborted', 'AbortError');
        controller.abort();
        global.fetch = vi.fn(() => Promise.reject(abortError)) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze', signal: controller.signal })).rejects.toBe(abortError);
    });

    it('maps invalid JSON and missing result arrays to invalid-response errors', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.reject(new SyntaxError('bad json')),
            } as Response)
        ) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'invalid-response',
        });

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ page: 1 }),
            } as Response)
        ) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'invalid-response',
        });
    });

    it('returns valid empty results as a successful search response', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        page: 1,
                        page_count: 0,
                        page_size: 20,
                        result_count: 0,
                        results: [],
                    }),
            } as Response)
        ) as unknown as typeof fetch;

        const result = await searchOpenVerseImages({ query: 'Katze' });

        expect(result.results).toEqual([]);
        expect(result.resultCount).toBe(0);
    });

    it('drops malformed entries when at least one valid result remains', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        page: 1,
                        page_count: 1,
                        page_size: 20,
                        result_count: 2,
                        results: [
                            { id: 'missing-url', thumbnail: 'https://images.example/bad-thumb.jpg' },
                            {
                                id: 'valid',
                                title: 'Katze',
                                url: 'https://images.example/cat.jpg',
                                thumbnail: 'https://images.example/cat-thumb.jpg',
                            },
                        ],
                    }),
            } as Response)
        ) as unknown as typeof fetch;

        const result = await searchOpenVerseImages({ query: 'Katze' });

        expect(result.results).toHaveLength(1);
        expect(result.results[0].id).toBe('valid');
    });

    it('throws invalid-response when all-malformed entries are dropped', async ({ expect }) => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        page: 1,
                        page_count: 1,
                        page_size: 20,
                        result_count: 2,
                        results: [
                            { id: 'missing-url', thumbnail: 'https://images.example/bad-thumb.jpg' },
                            { url: 'https://images.example/bad.jpg', thumbnail: 'https://images.example/bad-thumb.jpg' },
                        ],
                    }),
            } as Response)
        ) as unknown as typeof fetch;

        await expect(searchOpenVerseImages({ query: 'Katze' })).rejects.toMatchObject({
            code: 'invalid-response',
        });
    });
});
