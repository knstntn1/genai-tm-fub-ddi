export const OPENVERSE_IMAGES_URL = 'https://api.openverse.org/v1/images/';
export const DEFAULT_OPENVERSE_PAGE_SIZE = 20;

export interface OpenVerseImageResult {
    id: string;
    title: string;
    imageUrl: string;
    thumbnailUrl: string;
    width?: number;
    height?: number;
    source?: string;
    foreignLandingUrl?: string;
    license?: string;
    licenseUrl?: string;
    creator?: string;
    mature?: boolean;
}

export interface OpenVerseImageSearchResult {
    results: OpenVerseImageResult[];
    page: number;
    pageCount: number;
    pageSize: number;
    resultCount: number;
}

export interface SearchOpenVerseImagesOptions {
    query: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}

export type OpenVerseSearchErrorCode =
    | 'empty-query'
    | 'network'
    | 'rate-limited'
    | 'http'
    | 'invalid-response';

interface OpenVerseSearchErrorOptions {
    status?: number;
    retryAfter?: string;
}

type JsonRecord = Record<string, unknown>;

interface OpenVerseApiResult {
    id?: unknown;
    title?: unknown;
    url?: unknown;
    thumbnail?: unknown;
    width?: unknown;
    height?: unknown;
    source?: unknown;
    foreign_landing_url?: unknown;
    license?: unknown;
    license_url?: unknown;
    creator?: unknown;
    mature?: unknown;
}

interface OpenVerseApiResponse {
    results?: unknown;
    page?: unknown;
    page_count?: unknown;
    page_size?: unknown;
    result_count?: unknown;
}

export class OpenVerseSearchError extends Error {
    readonly code: OpenVerseSearchErrorCode;
    readonly status?: number;
    readonly retryAfter?: string;

    constructor(code: OpenVerseSearchErrorCode, message: string, options: OpenVerseSearchErrorOptions = {}) {
        super(message);
        this.name = 'OpenVerseSearchError';
        this.code = code;
        this.status = options.status;
        this.retryAfter = options.retryAfter;
    }
}

export async function searchOpenVerseImages(
    options: SearchOpenVerseImagesOptions
): Promise<OpenVerseImageSearchResult> {
    const query = options.query.trim();
    if (query.length === 0) {
        throw new OpenVerseSearchError('empty-query', 'OpenVerse search query must not be empty.');
    }

    const page = Math.max(1, integerOrFallback(options.page, 1));
    const pageSize = Math.min(50, Math.max(1, integerOrFallback(options.pageSize, DEFAULT_OPENVERSE_PAGE_SIZE)));
    const url = new URL(OPENVERSE_IMAGES_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    url.searchParams.set('mature', 'false');

    let response: Response;
    try {
        response = await fetch(url.toString(), { signal: options.signal });
    } catch (fetchError) {
        if (options.signal?.aborted) {
            throw fetchError;
        }
        throw new OpenVerseSearchError('network', 'OpenVerse search request failed.');
    }

    if (!response.ok) {
        if (response.status === 429) {
            throw new OpenVerseSearchError('rate-limited', 'OpenVerse search rate limit reached.', {
                status: response.status,
                retryAfter: response.headers.get('Retry-After') ?? undefined,
            });
        }
        throw new OpenVerseSearchError('http', `OpenVerse search failed with status ${response.status}.`, {
            status: response.status,
        });
    }

    let json: OpenVerseApiResponse;
    try {
        json = (await response.json()) as OpenVerseApiResponse;
    } catch {
        throw new OpenVerseSearchError('invalid-response', 'OpenVerse search returned invalid JSON.');
    }

    return normalizeSearchResponse(json, page, pageSize);
}

function normalizeSearchResponse(
    response: unknown,
    fallbackPage: number,
    fallbackPageSize: number
): OpenVerseImageSearchResult {
    if (!isRecord(response)) {
        throw new OpenVerseSearchError('invalid-response', 'OpenVerse search response is not an object.');
    }

    const typedResponse = response as OpenVerseApiResponse;

    if (!Array.isArray(typedResponse.results)) {
        throw new OpenVerseSearchError('invalid-response', 'OpenVerse search response is missing results.');
    }

    const results = typedResponse.results
        .map((result) => normalizeImageResult(result))
        .filter((result): result is OpenVerseImageResult => result !== null);

    if (typedResponse.results.length > 0 && results.length === 0) {
        throw new OpenVerseSearchError('invalid-response', 'OpenVerse search response contained no usable results.');
    }

    return {
        results,
        page: numberOrFallback(typedResponse.page, fallbackPage),
        pageCount: numberOrFallback(typedResponse.page_count, 0),
        pageSize: numberOrFallback(typedResponse.page_size, fallbackPageSize),
        resultCount: numberOrFallback(typedResponse.result_count, results.length),
    };
}

function normalizeImageResult(result: unknown): OpenVerseImageResult | null {
    if (!isRecord(result)) {
        return null;
    }

    const typedResult = result as OpenVerseApiResult;

    if (!isString(typedResult.id) || !isString(typedResult.url) || !isString(typedResult.thumbnail)) {
        return null;
    }

    const normalized: OpenVerseImageResult = {
        id: typedResult.id,
        title: isString(typedResult.title) ? typedResult.title : '',
        imageUrl: typedResult.url,
        thumbnailUrl: typedResult.thumbnail,
    };

    addNumberField(normalized, 'width', typedResult.width);
    addNumberField(normalized, 'height', typedResult.height);
    addStringField(normalized, 'source', typedResult.source);
    addStringField(normalized, 'foreignLandingUrl', typedResult.foreign_landing_url);
    addStringField(normalized, 'license', typedResult.license);
    addStringField(normalized, 'licenseUrl', typedResult.license_url);
    addStringField(normalized, 'creator', typedResult.creator);
    if (typeof typedResult.mature === 'boolean') {
        normalized.mature = typedResult.mature;
    }

    return normalized;
}

function addNumberField<T extends 'width' | 'height'>(target: OpenVerseImageResult, key: T, value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
        target[key] = value;
    }
}

function addStringField<T extends 'source' | 'foreignLandingUrl' | 'license' | 'licenseUrl' | 'creator'>(
    target: OpenVerseImageResult,
    key: T,
    value: unknown
): void {
    if (isString(value)) {
        target[key] = value;
    }
}

function numberOrFallback(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function integerOrFallback(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
}
