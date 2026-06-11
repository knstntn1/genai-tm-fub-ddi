export interface ImageSearchResult {
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
}

export interface ImageSearchResponse {
    results: ImageSearchResult[];
    page: number;
    pageCount: number;
    pageSize: number;
    resultCount: number;
}

export interface ImageSearchOptions {
    query: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}

export type ImageSearchErrorCode = 'empty-query' | 'network' | 'rate-limited' | 'http' | 'invalid-response';

interface ImageSearchErrorOptions {
    status?: number;
    retryAfter?: string;
}

export class ImageSearchError extends Error {
    readonly code: ImageSearchErrorCode;
    readonly status?: number;
    readonly retryAfter?: string;

    constructor(code: ImageSearchErrorCode, message: string, options: ImageSearchErrorOptions = {}) {
        super(message);
        this.name = 'ImageSearchError';
        this.code = code;
        this.status = options.status;
        this.retryAfter = options.retryAfter;
    }
}
