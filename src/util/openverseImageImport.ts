export const DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS = 10000;
export const DEFAULT_OPENVERSE_IMPORT_MAX_SIZE = 512;

export interface ImportOpenVerseImageOptions {
    imageUrl: string;
    fallbackUrl?: string;
    timeoutMs?: number;
    maxSize?: number;
    signal?: AbortSignal;
}

export type OpenVerseImageImportErrorCode =
    | 'load-failed'
    | 'timeout'
    | 'decode-failed'
    | 'canvas-unreadable'
    | 'unsupported-image'
    | 'aborted';

export class OpenVerseImageImportError extends Error {
    readonly code: OpenVerseImageImportErrorCode;
    readonly sourceUrl?: string;

    constructor(code: OpenVerseImageImportErrorCode, message: string, sourceUrl?: string) {
        super(message);
        this.name = 'OpenVerseImageImportError';
        this.code = code;
        this.sourceUrl = sourceUrl;
    }
}

export async function importOpenVerseImage(_options: ImportOpenVerseImageOptions): Promise<HTMLCanvasElement> {
    throw new OpenVerseImageImportError('load-failed', 'Not implemented');
}
