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

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? DEFAULT_OPENVERSE_PAGE_SIZE)));
    const url = new URL(OPENVERSE_IMAGES_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    url.searchParams.set('mature', 'false');

    const response = await fetch(url.toString(), { signal: options.signal });
    const json = (await response.json()) as OpenVerseApiResponse;

    return normalizeSearchResponse(json, page, pageSize);
}

function normalizeSearchResponse(
    response: OpenVerseApiResponse,
    fallbackPage: number,
    fallbackPageSize: number
): OpenVerseImageSearchResult {
    const results = Array.isArray(response.results)
        ? response.results
              .map((result) => normalizeImageResult(result as OpenVerseApiResult))
              .filter((result): result is OpenVerseImageResult => result !== null)
        : [];

    return {
        results,
        page: numberOrFallback(response.page, fallbackPage),
        pageCount: numberOrFallback(response.page_count, 0),
        pageSize: numberOrFallback(response.page_size, fallbackPageSize),
        resultCount: numberOrFallback(response.result_count, results.length),
    };
}

function normalizeImageResult(result: OpenVerseApiResult): OpenVerseImageResult | null {
    if (!isString(result.id) || !isString(result.url) || !isString(result.thumbnail)) {
        return null;
    }

    const normalized: OpenVerseImageResult = {
        id: result.id,
        title: isString(result.title) ? result.title : '',
        imageUrl: result.url,
        thumbnailUrl: result.thumbnail,
    };

    addNumberField(normalized, 'width', result.width);
    addNumberField(normalized, 'height', result.height);
    addStringField(normalized, 'source', result.source);
    addStringField(normalized, 'foreignLandingUrl', result.foreign_landing_url);
    addStringField(normalized, 'license', result.license);
    addStringField(normalized, 'licenseUrl', result.license_url);
    addStringField(normalized, 'creator', result.creator);
    if (typeof result.mature === 'boolean') {
        normalized.mature = result.mature;
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

function isString(value: unknown): value is string {
    return typeof value === 'string';
}
