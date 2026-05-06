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
                        results: [],
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
});
