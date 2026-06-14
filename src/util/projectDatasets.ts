import JSZip from 'jszip';
import { DatasetSplit, ProjectDataset, ProjectDatasetImage, ProjectDatasetImageSource } from '@genaitm/state';
import randomId from './randomId';

const DATASET_ROOT = 'project-datasets';
const MANIFEST_PATH = `${DATASET_ROOT}/manifest.json`;
const IMAGE_ROOT = `${DATASET_ROOT}/images`;

interface SerializedDatasetImage {
    id: string;
    displayId?: string;
    split: DatasetSplit;
    path: string;
    source?: ProjectDatasetImageSource;
}

interface SerializedDataset {
    id: string;
    name: string;
    nextImageNumber?: number;
    images: SerializedDatasetImage[];
}

interface ProjectDatasetsManifest {
    version: 1;
    datasets: SerializedDataset[];
}

export const PROJECT_DATASETS_MANIFEST_PATH = MANIFEST_PATH;

export function createProjectDataset(name: string): ProjectDataset {
    return {
        id: `ds_${randomId(10)}`,
        name: name.trim() || 'Dataset',
        nextImageNumber: 1,
        images: [],
    };
}

export function createProjectDatasetImage(
    data: HTMLCanvasElement,
    split: DatasetSplit = 'training',
    source?: ProjectDatasetImageSource,
    displayId?: string
): ProjectDatasetImage {
    return {
        id: `img_${randomId(12)}`,
        displayId,
        split,
        data,
        source,
    };
}

function inferNextImageNumber(dataset: ProjectDataset): number {
    const highestAssignedNumber = dataset.images.reduce((highest, image) => {
        const match = image.displayId?.match(/_(\d+)$/);
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    return Math.max(highestAssignedNumber + 1, dataset.images.length + 1);
}

export function addImagesToProjectDataset(
    dataset: ProjectDataset,
    canvases: HTMLCanvasElement[],
    split: DatasetSplit = 'training',
    source?: ProjectDatasetImageSource
): ProjectDataset {
    if (canvases.length === 0) return dataset;

    const nextImageNumber = dataset.nextImageNumber ?? inferNextImageNumber(dataset);
    const images = canvases.map((canvas, index) =>
        createProjectDatasetImage(canvas, split, source, `${dataset.name}_${nextImageNumber + index}`)
    );

    return {
        ...dataset,
        nextImageNumber: nextImageNumber + images.length,
        images: [...images, ...dataset.images],
    };
}

export function getProjectDatasetImageDisplayId(
    dataset: ProjectDataset,
    image: ProjectDatasetImage,
    fallbackIndex: number
): string {
    return image.displayId ?? `${dataset.name}_${fallbackIndex + 1}`;
}

export function isDatasetSplit(value: unknown): value is DatasetSplit {
    return value === 'training' || value === 'test';
}

export function updateProjectDatasetImageSplit(
    datasets: ProjectDataset[],
    datasetId: string,
    imageId: string,
    split: DatasetSplit
): ProjectDataset[] {
    return datasets.map((dataset) =>
        dataset.id === datasetId
            ? {
                  ...dataset,
                  images: dataset.images.map((image) => (image.id === imageId ? { ...image, split } : image)),
              }
            : dataset
    );
}

export function removeProjectDatasetImage(
    datasets: ProjectDataset[],
    datasetId: string,
    imageId: string
): ProjectDataset[] {
    return datasets.map((dataset) =>
        dataset.id === datasetId
            ? {
                  ...dataset,
                  images: dataset.images.filter((image) => image.id !== imageId),
              }
            : dataset
    );
}

export function getProjectDatasetImagesBySplit(
    datasets: ProjectDataset[],
    split: DatasetSplit
): ProjectDatasetImage[] {
    return datasets.flatMap((dataset) => dataset.images.filter((image) => image.split === split));
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Could not serialize dataset image'));
        }, 'image/png');
    });
}

async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    const url = URL.createObjectURL(blob);
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Could not load dataset image'));
            image.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not create dataset image canvas');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function normalizeManifest(raw: unknown): ProjectDatasetsManifest {
    const manifest = raw as Partial<ProjectDatasetsManifest>;
    if (manifest.version !== 1 || !Array.isArray(manifest.datasets)) {
        return { version: 1, datasets: [] };
    }

    return {
        version: 1,
        datasets: manifest.datasets
            .filter((dataset): dataset is SerializedDataset => {
                return (
                    typeof dataset?.id === 'string' &&
                    typeof dataset.name === 'string' &&
                    Array.isArray(dataset.images)
                );
            })
            .map((dataset) => ({
                id: dataset.id,
                name: dataset.name,
                nextImageNumber:
                    typeof dataset.nextImageNumber === 'number' && dataset.nextImageNumber > 0
                        ? dataset.nextImageNumber
                        : undefined,
                images: dataset.images.filter((image) => {
                    return typeof image?.id === 'string' && isDatasetSplit(image.split) && typeof image.path === 'string';
                }),
            })),
    };
}

export async function addProjectDatasetsToZip(zip: JSZip, datasets: ProjectDataset[]): Promise<void> {
    const manifest: ProjectDatasetsManifest = {
        version: 1,
        datasets: [],
    };

    for (const dataset of datasets) {
        const serializedImages: SerializedDatasetImage[] = [];

        for (const image of dataset.images) {
            const imagePath = `${IMAGE_ROOT}/${dataset.id}_${image.id}.png`;
            zip.file(imagePath, await canvasToBlob(image.data));
            serializedImages.push({
                id: image.id,
                displayId: image.displayId,
                split: image.split,
                path: imagePath,
                source: image.source,
            });
        }

        manifest.datasets.push({
            id: dataset.id,
            name: dataset.name,
            nextImageNumber: dataset.nextImageNumber ?? inferNextImageNumber(dataset),
            images: serializedImages,
        });
    }

    zip.file(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function loadProjectDatasetsFromZip(file: Blob): Promise<ProjectDataset[]> {
    const zip = await JSZip.loadAsync(file);
    const manifestFile = zip.file(MANIFEST_PATH);
    if (!manifestFile) return [];

    let manifest: ProjectDatasetsManifest;
    try {
        manifest = normalizeManifest(JSON.parse(await manifestFile.async('string')));
    } catch {
        return [];
    }
    const datasets: ProjectDataset[] = [];

    for (const dataset of manifest.datasets) {
        const images: ProjectDatasetImage[] = [];

        for (const image of dataset.images) {
            const imageFile = zip.file(image.path);
            if (!imageFile) continue;
            try {
                images.push({
                    id: image.id,
                    displayId: image.displayId,
                    split: image.split,
                    source: image.source,
                    data: await blobToCanvas(await imageFile.async('blob')),
                });
            } catch {
                // Dataset images are optional project metadata. Keep loading the core project.
            }
        }

        datasets.push({
            id: dataset.id,
            name: dataset.name,
            nextImageNumber: dataset.nextImageNumber ?? inferNextImageNumber({ ...dataset, images }),
            images,
        });
    }

    return datasets;
}
