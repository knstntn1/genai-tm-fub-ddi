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

type ImageLoader = (url: string, signal?: AbortSignal) => Promise<HTMLImageElement>;

function toImportError(code: OpenVerseImageImportErrorCode, sourceUrl?: string): OpenVerseImageImportError {
    return new OpenVerseImageImportError(code, `OpenVerse image import failed: ${code}`, sourceUrl);
}

function assertSupportedImageUrl(url: string): string {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        throw toImportError('unsupported-image');
    }

    try {
        const parsedUrl = new URL(trimmedUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw toImportError('unsupported-image', trimmedUrl);
        }
    } catch (error) {
        if (error instanceof OpenVerseImageImportError) {
            throw error;
        }
        throw toImportError('unsupported-image', trimmedUrl);
    }

    return trimmedUrl;
}

function getBoundedDimensions(image: HTMLImageElement, maxSize: number): { width: number; height: number } {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (sourceWidth <= 0 || sourceHeight <= 0) {
        throw toImportError('unsupported-image', image.currentSrc || image.src);
    }

    const safeMaxSize = maxSize > 0 ? maxSize : DEFAULT_OPENVERSE_IMPORT_MAX_SIZE;
    const ratio = Math.min(1, safeMaxSize / Math.max(sourceWidth, sourceHeight));

    return {
        width: Math.max(1, Math.round(sourceWidth * ratio)),
        height: Math.max(1, Math.round(sourceHeight * ratio)),
    };
}

async function loadImage(
    url: string,
    timeoutMs: number = DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS,
    signal?: AbortSignal
): Promise<HTMLImageElement> {
    const sourceUrl = assertSupportedImageUrl(url);

    if (signal?.aborted) {
        throw toImportError('aborted', sourceUrl);
    }

    return new Promise((resolve, reject) => {
        const image = new Image();
        let settled = false;

        const finish = (callback: () => void) => {
            if (settled) {
                return;
            }
            settled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            signal?.removeEventListener('abort', abort);
            callback();
        };

        const abort = () => {
            finish(() => reject(toImportError('aborted', sourceUrl)));
        };

        image.onload = () => {
            finish(async () => {
                try {
                    if (image.decode) {
                        await image.decode();
                    }
                    resolve(image);
                } catch {
                    reject(toImportError('decode-failed', sourceUrl));
                }
            });
        };
        image.onerror = () => {
            finish(() => reject(toImportError('load-failed', sourceUrl)));
        };

        const timeoutId = setTimeout(() => {
            finish(() => reject(toImportError('timeout', sourceUrl)));
        }, timeoutMs);

        signal?.addEventListener('abort', abort, { once: true });
        image.crossOrigin = 'anonymous';
        image.src = sourceUrl;
    });
}

function canvasFromImage(image: HTMLImageElement, maxSize: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const dimensions = getBoundedDimensions(image, maxSize);

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw toImportError('canvas-unreadable', image.currentSrc || image.src);
    }

    try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.getImageData(0, 0, 1, 1);
    } catch {
        throw toImportError('canvas-unreadable', image.currentSrc || image.src);
    }

    canvas.style.width = '58px';
    canvas.style.height = '58px';

    return canvas;
}

async function importWithLoader(
    url: string,
    loader: ImageLoader,
    maxSize: number,
    signal?: AbortSignal
): Promise<HTMLCanvasElement> {
    const image = await loader(url, signal);
    return canvasFromImage(image, maxSize);
}

export async function importOpenVerseImage(options: ImportOpenVerseImageOptions): Promise<HTMLCanvasElement> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS;
    const maxSize = options.maxSize ?? DEFAULT_OPENVERSE_IMPORT_MAX_SIZE;
    const loader: ImageLoader = (url, signal) => loadImage(url, timeoutMs, signal);

    try {
        return await importWithLoader(options.imageUrl, loader, maxSize, options.signal);
    } catch (error) {
        if (
            error instanceof OpenVerseImageImportError &&
            (error.code === 'aborted' || error.code === 'unsupported-image')
        ) {
            throw error;
        }
        if (!options.fallbackUrl) {
            throw error;
        }
        return importWithLoader(options.fallbackUrl, loader, maxSize, options.signal);
    }
}
