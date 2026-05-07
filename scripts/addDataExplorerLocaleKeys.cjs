const fs = require('node:fs');
const path = require('node:path');

const localeRoot = path.resolve(__dirname, '..', 'public', 'locales');

const fallback = {
    fields: { datasetName: 'Dataset name' },
    actions: {
        createDataset: 'Create dataset',
        deleteDataset: 'Delete dataset',
        deleteImage: 'Delete image',
    },
    split: { training: 'Training', test: 'Test' },
    empty: {
        noDatasets: 'Create a dataset to add images.',
        noImages: 'Add images by upload, webcam, or image search.',
    },
    labels: { image: 'Dataset image' },
    errors: { addFailed: 'The image could not be added.' },
    defaultDatasetName: 'Dataset',
};

const german = {
    fields: { datasetName: 'Datensatzname' },
    actions: {
        createDataset: 'Datensatz erstellen',
        deleteDataset: 'Datensatz löschen',
        deleteImage: 'Bild löschen',
    },
    split: { training: 'Training', test: 'Test' },
    empty: {
        noDatasets: 'Erstelle einen Datensatz, um Bilder hinzuzufügen.',
        noImages: 'Füge Bilder per Upload, Webcam oder Bildsuche hinzu.',
    },
    labels: { image: 'Datensatzbild' },
    errors: { addFailed: 'Das Bild konnte nicht hinzugefügt werden.' },
    defaultDatasetName: 'Datensatz',
};

function mergeMissing(target, source) {
    let changed = false;
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                target[key] = {};
                changed = true;
            }
            changed = mergeMissing(target[key], value) || changed;
        } else if (!(key in target)) {
            target[key] = value;
            changed = true;
        }
    }
    return changed;
}

let changedFiles = 0;
for (const locale of fs.readdirSync(localeRoot)) {
    const file = path.join(localeRoot, locale, 'image_adv.json');
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const source = locale === 'de-DE' ? german : fallback;
    if (mergeMissing(json, { dataExplorer: source })) {
        changedFiles += 1;
        fs.writeFileSync(file, `${JSON.stringify(json, null, 4)}\n`);
    }
}

if (process.argv.includes('--check') && changedFiles > 0) {
    console.error(`dataExplorer locale drift in ${changedFiles} files`);
    process.exit(1);
}

console.log(`validated ${fs.readdirSync(localeRoot).length} locale directories`);
