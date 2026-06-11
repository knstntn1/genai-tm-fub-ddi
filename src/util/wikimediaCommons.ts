import {
    ImageSearchError,
    type ImageSearchOptions,
    type ImageSearchResponse,
    type ImageSearchResult,
} from './imageSearch';

export const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
export const DEFAULT_WIKIMEDIA_COMMONS_PAGE_SIZE = 20;
const WIKIMEDIA_THUMBNAIL_WIDTH = 480;

type JsonRecord = Record<string, unknown>;

interface WikimediaImageInfo {
    url?: unknown;
    thumburl?: unknown;
    width?: unknown;
    height?: unknown;
    mime?: unknown;
    descriptionurl?: unknown;
    extmetadata?: unknown;
}

interface WikimediaPage {
    pageid?: unknown;
    title?: unknown;
    imageinfo?: unknown;
}

interface WikimediaResponse {
    query?: {
        pages?: unknown;
    };
    continue?: {
        gsroffset?: unknown;
    };
}

export async function searchWikimediaCommonsImages(options: ImageSearchOptions): Promise<ImageSearchResponse> {
    const query = options.query.trim();
    if (!query) {
        throw new ImageSearchError('empty-query', 'Image search query must not be empty.');
    }

    const page = Math.max(1, integerOrFallback(options.page, 1));
    const pageSize = Math.min(50, Math.max(1, integerOrFallback(options.pageSize, DEFAULT_WIKIMEDIA_COMMONS_PAGE_SIZE)));
    const url = new URL(WIKIMEDIA_COMMONS_API_URL);
    url.searchParams.set('action', 'query');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrsearch', `${query} filetype:bitmap`);
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrlimit', String(pageSize));
    url.searchParams.set('gsroffset', String((page - 1) * pageSize));
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|mime|size|extmetadata');
    url.searchParams.set('iiurlwidth', String(WIKIMEDIA_THUMBNAIL_WIDTH));
    url.searchParams.set('format', 'json');
    url.searchParams.set('formatversion', '2');
    url.searchParams.set('origin', '*');

    let response: Response;
    try {
        response = await fetch(url.toString(), { signal: options.signal });
    } catch (fetchError) {
        if (options.signal?.aborted) {
            throw fetchError;
        }
        throw new ImageSearchError('network', 'Wikimedia Commons search request failed.');
    }

    if (!response.ok) {
        if (response.status === 429) {
            throw new ImageSearchError('rate-limited', 'Wikimedia Commons search rate limit reached.', {
                status: response.status,
                retryAfter: response.headers.get('Retry-After') ?? undefined,
            });
        }
        throw new ImageSearchError('http', `Wikimedia Commons search failed with status ${response.status}.`, {
            status: response.status,
        });
    }

    let json: WikimediaResponse;
    try {
        json = (await response.json()) as WikimediaResponse;
    } catch {
        throw new ImageSearchError('invalid-response', 'Wikimedia Commons search returned invalid JSON.');
    }

    return normalizeResponse(json, page, pageSize);
}

function normalizeResponse(response: unknown, page: number, pageSize: number): ImageSearchResponse {
    if (!isRecord(response)) {
        throw new ImageSearchError('invalid-response', 'Wikimedia Commons response is not an object.');
    }

    const typedResponse = response as WikimediaResponse;
    const rawPages = typedResponse.query?.pages ?? [];
    if (!Array.isArray(rawPages)) {
        throw new ImageSearchError('invalid-response', 'Wikimedia Commons response contains invalid pages.');
    }

    const results = rawPages
        .map(normalizePage)
        .filter((result): result is ImageSearchResult => result !== null);

    if (rawPages.length > 0 && results.length === 0) {
        throw new ImageSearchError('invalid-response', 'Wikimedia Commons response contained no usable images.');
    }

    const hasMore = typeof typedResponse.continue?.gsroffset === 'number';
    return {
        results,
        page,
        pageCount: hasMore ? page + 1 : page,
        pageSize,
        resultCount: hasMore ? page * pageSize + 1 : (page - 1) * pageSize + results.length,
    };
}

function normalizePage(value: unknown): ImageSearchResult | null {
    if (!isRecord(value)) {
        return null;
    }

    const page = value as WikimediaPage;
    if (!Array.isArray(page.imageinfo) || page.imageinfo.length === 0 || !isRecord(page.imageinfo[0])) {
        return null;
    }

    const imageInfo = page.imageinfo[0] as WikimediaImageInfo;
    if (
        typeof page.pageid !== 'number' ||
        typeof page.title !== 'string' ||
        typeof imageInfo.url !== 'string' ||
        typeof imageInfo.thumburl !== 'string' ||
        (typeof imageInfo.mime === 'string' && !imageInfo.mime.startsWith('image/'))
    ) {
        return null;
    }

    const metadata = isRecord(imageInfo.extmetadata) ? imageInfo.extmetadata : {};
    const result: ImageSearchResult = {
        id: String(page.pageid),
        title: page.title.replace(/^File:/, ''),
        imageUrl: imageInfo.thumburl,
        thumbnailUrl: imageInfo.thumburl,
        source: 'Wikimedia Commons',
        foreignLandingUrl:
            typeof imageInfo.descriptionurl === 'string'
                ? imageInfo.descriptionurl
                : `https://commons.wikimedia.org/?curid=${page.pageid}`,
    };

    addNumberField(result, 'width', imageInfo.width);
    addNumberField(result, 'height', imageInfo.height);
    addMetadataField(result, 'license', metadata.LicenseShortName);
    addMetadataField(result, 'licenseUrl', metadata.LicenseUrl);
    addMetadataField(result, 'creator', metadata.Artist);

    return result;
}

function addNumberField(
    result: ImageSearchResult,
    field: 'width' | 'height',
    value: unknown
): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
        result[field] = value;
    }
}

function addMetadataField(
    result: ImageSearchResult,
    field: 'license' | 'licenseUrl' | 'creator',
    value: unknown
): void {
    if (!isRecord(value) || typeof value.value !== 'string') {
        return;
    }

    result[field] = stripHtml(value.value);
}

function stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').trim();
}

function integerOrFallback(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
}
