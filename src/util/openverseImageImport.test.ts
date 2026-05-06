import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import {
    importOpenVerseImage,
    OpenVerseImageImportError,
    DEFAULT_OPENVERSE_IMPORT_MAX_SIZE,
    DEFAULT_OPENVERSE_IMPORT_TIMEOUT_MS,
} from './openverseImageImport';

type ImageBehavior = {
    type: 'load' | 'error';
    width?: number;
    height?: number;
};

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
    decode = vi.fn(() => Promise.resolve());

    set src(url: string) {
        loadedUrls.push(url);
        const behavior = imageBehaviors.shift() ?? { type: 'load', width: 100, height: 100 };
        this.naturalWidth = behavior.width ?? 100;
        this.naturalHeight = behavior.height ?? 100;
        this.width = this.naturalWidth;
        this.height = this.naturalHeight;

        queueMicrotask(() => {
            if (behavior.type === 'error') {
                this.onerror?.(new Event('error'));
            } else {
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
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
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

    it('loads a remote image into a readable styled canvas', async ({ expect }) => {
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
});
