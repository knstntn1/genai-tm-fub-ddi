import { chromium } from 'playwright';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:5173/image/general?c=N4IghgJgbmB2DGBTCBZRsCuIBcAXAThogL5A';
const artifactDir = path.resolve('.planning/phases/04-live-browser-validation');
const redSample = path.join(artifactDir, 'sample-red.svg');
const blueSample = path.join(artifactDir, 'sample-blue.svg');

const browser = await chromium.launch({ headless: true });

async function newPage(viewport) {
    const context = await browser.newContext({
        viewport,
        acceptDownloads: true,
    });
    await context.addInitScript(() => {
        window.localStorage.setItem('i18nextLng', 'de-DE');
    });
    const page = await context.newPage();
    page.on('dialog', (dialog) => dialog.accept().catch(() => undefined));
    page.setDefaultTimeout(30_000);
    return { context, page };
}

async function countSamples(page, classIndex) {
    return page.locator('section[aria-label^="Trainingsdaten"]').nth(classIndex).locator('ol canvas').count();
}

async function importOpenVerseSample(page, query, maxAttempts = 12) {
    await page.getByTestId('openversebutton').first().click();
    await page.getByRole('heading', { name: /OpenVerse:/ }).waitFor();
    await page.getByLabel('Suchbegriff').fill(query);
    await page.getByRole('button', { name: 'Bilder suchen' }).click();
    await page.locator('button[aria-label^="Dieses Bild nutzen:"]').first().waitFor();

    const metadataText = await page
        .locator('text=/Lizenz|license|Attribution|Quelle|Source|Creator|Urheber|Dateityp|Filter/i')
        .count();

    let failedAttempts = 0;
    for (let i = 0; i < maxAttempts; i += 1) {
        const buttons = page.locator('button[aria-label^="Dieses Bild nutzen:"]');
        const count = await buttons.count();
        if (i >= count) break;

        await buttons.nth(i).scrollIntoViewIfNeeded();
        await buttons.nth(i).hover();
        const before = await countSamples(page, 0);
        await buttons.nth(i).click();

        try {
            await page.locator('[role="dialog"]').waitFor({ state: 'detached', timeout: 12_000 });
            const after = await countSamples(page, 0);
            return {
                success: true,
                attempts: i + 1,
                failedAttempts,
                before,
                after,
                metadataText,
            };
        } catch {
            failedAttempts += 1;
            await page.locator('text=Dieses Bild konnte nicht genutzt werden').first().waitFor({ timeout: 5_000 });
        }
    }

    return {
        success: false,
        attempts: maxAttempts,
        failedAttempts,
        before: await countSamples(page, 0),
        after: await countSamples(page, 0),
        metadataText,
    };
}

async function validateViewport(name, viewport) {
    const { context, page } = await newPage(viewport);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(artifactDir, `${name}-initial.png`), fullPage: true });
    await page.getByTestId('openversebutton').first().click();
    await page.getByRole('heading', { name: /OpenVerse:/ }).waitFor();
    await page.getByLabel('Suchbegriff').fill('Baum');
    await page.getByRole('button', { name: 'Bilder suchen' }).click();
    await page.locator('button[aria-label^="Dieses Bild nutzen:"]').first().waitFor();
    await page.screenshot({ path: path.join(artifactDir, `${name}-dialog.png`), fullPage: true });
    const firstResult = page.locator('button[aria-label^="Dieses Bild nutzen:"]').first();
    await firstResult.focus();
    const focusedActionVisible = await firstResult.locator('text=Dieses Bild nutzen').isVisible();
    const metadataText = await page
        .locator('text=/Lizenz|license|Attribution|Quelle|Source|Creator|Urheber|Dateityp|Filter/i')
        .count();
    const openverseButtons = await page.getByTestId('openversebutton').count();
    await context.close();
    return {
        viewport,
        openverseButtons,
        focusedActionVisible,
        metadataText,
    };
}

async function validateRecoverableFailure() {
    const { context, page } = await newPage({ width: 1280, height: 820 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByTestId('openversebutton').first().click();
    await page.getByLabel('Suchbegriff').fill('Katze');
    await page.getByRole('button', { name: 'Bilder suchen' }).click();
    await page.locator('button[aria-label^="Dieses Bild nutzen:"]').first().waitFor();
    await page.route(/^https?:\/\//, async (route) => {
        const url = route.request().url();
        if (url.includes('127.0.0.1') || url.includes('api.openverse.engineering')) {
            await route.continue();
            return;
        }
        await route.abort('failed');
    });
    await page.locator('button[aria-label^="Dieses Bild nutzen:"]').first().click();
    await page.locator('text=Dieses Bild konnte nicht genutzt werden').first().waitFor({ timeout: 15_000 });
    const dialogStillOpen = await page.getByRole('heading', { name: /OpenVerse:/ }).isVisible();
    await page.screenshot({ path: path.join(artifactDir, 'recoverable-failure.png'), fullPage: true });
    await context.close();
    return { dialogStillOpen };
}

const { context, page } = await newPage({ width: 1440, height: 900 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(artifactDir, 'desktop-start.png'), fullPage: true });

const importResult = await importOpenVerseSample(page, 'Katze');

if (importResult.success) {
    await page.setInputFiles('input[data-testid="file-Klasse 1"]', blueSample);
    await page.waitForFunction(() => document.querySelectorAll('section[aria-label^="Trainingsdaten"]')[0]?.querySelectorAll('ol canvas').length >= 2);
    await page.setInputFiles('input[data-testid="file-Klasse 2"]', [redSample, blueSample]);
    await page.waitForFunction(() => document.querySelectorAll('section[aria-label^="Trainingsdaten"]')[1]?.querySelectorAll('ol canvas').length >= 2);
}

const sampleCountsBeforeTraining = {
    class1: await countSamples(page, 0),
    class2: await countSamples(page, 1),
};

let trainingComplete = false;
if (sampleCountsBeforeTraining.class1 >= 2 && sampleCountsBeforeTraining.class2 >= 2) {
    await page.locator('.MuiAccordionSummary-root').first().click();
    await page.locator('#epochs').fill('2');
    await page.locator('#batch').fill('2');
    await page.getByTestId('train-button').click();
    await page.getByTestId('alert-complete').waitFor({ timeout: 180_000 });
    trainingComplete = true;
}

let savedZipPath = null;
let loadCounts = null;
if (trainingComplete) {
    await page.getByTestId('save-project').click();
    await page.getByLabel('Name').fill('OpenVerse Live Validation');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('save-save').click();
    const download = await downloadPromise;
    savedZipPath = path.join(artifactDir, 'openverse-live-validation.zip');
    await download.saveAs(savedZipPath);

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByTestId('open-project').click();
    await page.setInputFiles('#openfile', savedZipPath);
    await page.waitForTimeout(5_000);
    loadCounts = {
        class1: await countSamples(page, 0),
        class2: await countSamples(page, 1),
    };
    await page.screenshot({ path: path.join(artifactDir, 'loaded-project.png'), fullPage: true });
}

const viewportResults = [];
viewportResults.push(await validateViewport('desktop', { width: 1440, height: 900 }));
viewportResults.push(await validateViewport('tablet', { width: 820, height: 1180 }));
viewportResults.push(await validateViewport('mobile', { width: 390, height: 844 }));

const recoverableFailure = await validateRecoverableFailure();

await context.close();
await browser.close();

console.log(
    JSON.stringify(
        {
            importResult,
            sampleCountsBeforeTraining,
            trainingComplete,
            savedZipPath,
            loadCounts,
            viewportResults,
            recoverableFailure,
        },
        null,
        2
    )
);
