import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    importOpenVerseImage,
    OpenVerseImageImportError,
    DEFAULT_OPENVERSE_IMPORT_MAX_SIZE,
    DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS,
} from './openverseImageImport';

interface ImageBehavior {
    type: 'load' | 'error' | 'stall';
    width?: number;
    height?: number;
    decodeReject?: boolean;
}

const imageBehaviors: ImageBehavior[] = [];
const loadedUrls: string[] = [];
let drawImage = vi.fn();
let getImageData = vi.fn();

class MockImage {
    onload: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    crossOrigin = '';
    naturalWidth = 0;
    naturalHeight = 0;
    width = 0;
    height = 0;
    currentSrc = '';
    private srcUrl = '';
    decodeReject = false;
    decode = vi.fn(() => (this.decodeReject ? Promise.reject(new Error('decode failed')) : Promise.resolve()));

    get src() {
        return this.srcUrl;
    }

    set src(url: string) {
        loadedUrls.push(url);
        this.srcUrl = url;
        this.currentSrc = url;
        const behavior = imageBehaviors.shift() ?? { type: 'load', width: 100, height: 100 };
        this.naturalWidth = behavior.width ?? 100;
        this.naturalHeight = behavior.height ?? 100;
        this.width = this.naturalWidth;
        this.height = this.naturalHeight;
        this.decodeReject = behavior.decodeReject ?? false;

        queueMicrotask(() => {
            if (behavior.type === 'error') {
                this.onerror?.(new Event('error'));
            } else if (behavior.type === 'load') {
                this.onload?.(new Event('load'));
            }
        });
    }
}

describe('importOpenVerseImage', () => {
    beforeEach(() => {
        imageBehaviors.length = 0;
        loadedUrls.length = 0;
        drawImage = vi.fn();
        getImageData = vi.fn();
        vi.stubGlobal('Image', MockImage);
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as {
            mockReturnValue: (value: CanvasRenderingContext2D) => void;
        };
        getContextSpy.mockReturnValue({
            drawImage,
            getImageData,
        } as unknown as CanvasRenderingContext2D);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('exports classroom-safe import defaults', ({ expect }) => {
        expect(DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS).toBe(10000);
        expect(DEFAULT_OPENVERSE_IMPORT_MAX_SIZE).toBe(512);
    });

    it('loads a remote image into a readable styled canvas with getImageData(0, 0, 1, 1)', async ({ expect }) => {
        imageBehaviors.push({ type: 'load', width: 200, height: 100 });

        const canvas = await importOpenVerseImage({ imageUrl: 'https://example.test/image.jpg' });

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBe(200);
        expect(canvas.height).toBe(100);
        expect(canvas.style.width).toBe('58px');
        expect(canvas.style.height).toBe('58px');
        expect(drawImage).toHaveBeenCalledWith(expect.any(MockImage), 0, 0, 200, 100);
        expect(getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    });

    it('bounds oversized images to maxSize while preserving aspect ratio', async ({ expect }) => {
        imageBehaviors.push({ type: 'load', width: 1600, height: 800 });

        const canvas = await importOpenVerseImage({
            imageUrl: 'https://example.test/large.jpg',
            maxSize: 400,
        });

        expect(Math.max(canvas.width, canvas.height)).toBe(400);
        expect(canvas.width).toBe(400);
        expect(canvas.height).toBe(200);
        expect(getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    });

    it('loads the fallback URL when the primary URL fails', async ({ expect }) => {
        imageBehaviors.push({ type: 'error' }, { type: 'load', width: 80, height: 120 });

        const canvas = await importOpenVerseImage({
            imageUrl: 'https://example.test/primary.jpg',
            fallbackUrl: 'https://example.test/thumb.jpg',
        });

        expect(loadedUrls).toEqual(['https://example.test/primary.jpg', 'https://example.test/thumb.jpg']);
        expect(canvas.width).toBe(80);
        expect(canvas.height).toBe(120);
    });

    it('uses typed import errors', ({ expect }) => {
        const error = new OpenVerseImageImportError('load-failed', 'failed', 'https://example.test/image.jpg');

        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe('load-failed');
        expect(error.sourceUrl).toBe('https://example.test/image.jpg');
    });

    it('rejects load failures with a typed load-failed error', async ({ expect }) => {
        imageBehaviors.push({ type: 'error' });

        await expect(importOpenVerseImage({ imageUrl: 'https://example.test/missing.jpg' })).rejects.toMatchObject({
            code: 'load-failed',
            sourceUrl: 'https://example.test/missing.jpg',
        });
    });

    it('rejects stalled image loads with a typed timeout error', async ({ expect }) => {
        vi.useFakeTimers();
        imageBehaviors.push({ type: 'stall' });

        const promise = importOpenVerseImage({
            imageUrl: 'https://example.test/slow.jpg',
            timeoutMs: 50,
        });
        const rejection = expect(promise).rejects.toMatchObject({
            code: 'timeout',
            sourceUrl: 'https://example.test/slow.jpg',
        });
        await vi.advanceTimersByTimeAsync(50);

        await rejection;
        vi.useRealTimers();
    });

    it('rejects abort signals with a typed aborted error', async ({ expect }) => {
        const controller = new AbortController();
        controller.abort();

        await expect(
            importOpenVerseImage({
                imageUrl: 'https://example.test/aborted.jpg',
                signal: controller.signal,
            })
        ).rejects.toMatchObject({
            code: 'aborted',
            sourceUrl: 'https://example.test/aborted.jpg',
        });
    });

    it('rejects decode failures with a typed decode-failed error', async ({ expect }) => {
        imageBehaviors.push({ type: 'load', decodeReject: true });

        await expect(importOpenVerseImage({ imageUrl: 'https://example.test/bad-decode.jpg' })).rejects.toMatchObject({
            code: 'decode-failed',
            sourceUrl: 'https://example.test/bad-decode.jpg',
        });
    });

    it('rejects SecurityError readback failures with a typed canvas-unreadable error', async ({ expect }) => {
        imageBehaviors.push({ type: 'load' });
        getImageData.mockImplementation(() => {
            throw new DOMException('The canvas has been tainted', 'SecurityError');
        });

        await expect(importOpenVerseImage({ imageUrl: 'https://example.test/tainted.jpg' })).rejects.toMatchObject({
            code: 'canvas-unreadable',
            sourceUrl: 'https://example.test/tainted.jpg',
        });
    });

    it('rejects unsupported missing image URLs without using fallbackUrl', async ({ expect }) => {
        imageBehaviors.push({ type: 'load' });

        await expect(
            importOpenVerseImage({
                imageUrl: '',
                fallbackUrl: 'https://example.test/fallback.jpg',
            })
        ).rejects.toMatchObject({
            code: 'unsupported-image',
        });
        expect(loadedUrls).toEqual([]);
    });

    it('keeps duplicate-pending prevention and class state mutation out of the import boundary', ({ expect }) => {
        const source = readFileSync(resolve('src/util/openverseImageImport.ts'), 'utf8');

        expect(source).not.toMatch(/@genaitm\/state|classState|setData|samples:/);
        expect(source).not.toMatch(/Set<|new Set|Map<|new Map|pending|importing/);
    });
});
