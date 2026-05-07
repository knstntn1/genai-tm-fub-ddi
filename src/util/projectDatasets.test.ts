import { describe, it, vi } from 'vitest';
import JSZip from 'jszip';
import {
    addProjectDatasetsToZip,
    createProjectDatasetImage,
    getProjectDatasetImagesBySplit,
    loadProjectDatasetsFromZip,
    PROJECT_DATASETS_MANIFEST_PATH,
    removeProjectDatasetImage,
    updateProjectDatasetImageSplit,
} from './projectDatasets';
import { ProjectDataset } from '@genaitm/state';

function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    canvas.toBlob = vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' })));
    return canvas;
}

describe('projectDatasets', () => {
    it('creates dataset images with exactly one split', ({ expect }) => {
        const image = createProjectDatasetImage(createCanvas(), 'test', 'upload');

        expect(image.split).toBe('test');
        expect(image.source).toBe('upload');
        expect(image.data.width).toBe(224);
    });

    it('updates and filters image split tags', ({ expect }) => {
        const training = { id: 'img-1', split: 'training' as const, data: createCanvas() };
        const test = { id: 'img-2', split: 'test' as const, data: createCanvas() };
        const datasets: ProjectDataset[] = [{ id: 'ds-1', name: 'Dataset', images: [training, test] }];

        const updated = updateProjectDatasetImageSplit(datasets, 'ds-1', 'img-1', 'test');
        expect(getProjectDatasetImagesBySplit(updated, 'training')).toHaveLength(0);
        expect(getProjectDatasetImagesBySplit(updated, 'test')).toHaveLength(2);

        const removed = removeProjectDatasetImage(updated, 'ds-1', 'img-2');
        expect(removed[0].images.map((image) => image.id)).toEqual(['img-1']);
    });

    it('serializes project datasets into a manifest and image entries', async ({ expect }) => {
        const zip = new JSZip();
        await addProjectDatasetsToZip(zip, [
            {
                id: 'ds-1',
                name: 'Meine Daten',
                images: [{ id: 'img-1', split: 'training', data: createCanvas(), source: 'upload' }],
            },
        ]);

        const manifest = JSON.parse((await zip.file(PROJECT_DATASETS_MANIFEST_PATH)?.async('string')) ?? '{}');
        expect(manifest.datasets[0].name).toBe('Meine Daten');
        expect(manifest.datasets[0].images[0]).toMatchObject({
            id: 'img-1',
            split: 'training',
            path: 'project-datasets/images/ds-1_img-1.png',
            source: 'upload',
        });
        expect(zip.file('project-datasets/images/ds-1_img-1.png')).not.toBeNull();
    });

    it('loads no project datasets from legacy zips', async ({ expect }) => {
        const zip = new JSZip();
        const blob = await zip.generateAsync({ type: 'blob' });

        await expect(loadProjectDatasetsFromZip(blob)).resolves.toEqual([]);
    });
});
