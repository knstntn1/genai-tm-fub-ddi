const fs = require("fs");
const path = require("path");

const localeRoot = path.join(__dirname, "..", "public", "locales");
const mode = process.argv[2] || "--check";

const germanOpenVerse = {
    title: "OpenVerse: {{className}}",
    searchLabel: "Suchbegriff",
    searchPlaceholder: "z. B. Katze",
    searchAction: "Bilder suchen",
    useImage: "Dieses Bild nutzen",
    initial: "Suche nach Bildern für diese Klasse.",
    loading: "Suche Bilder...",
    loadingMore: "Weitere Bilder werden geladen...",
    emptyQuery: "Gib einen Suchbegriff ein.",
    emptyTitle: "Keine Bilder gefunden.",
    emptyBody: "Versuche einen anderen Suchbegriff.",
    retryableError: "Die Bildsuche hat nicht geklappt. Bitte erneut versuchen.",
    rateLimit: "Gerade sind zu viele Suchanfragen aktiv. Versuche es gleich noch einmal.",
    retry: "Erneut versuchen",
    more: "Mehr Ergebnisse",
    pendingUse: "Bild wird hinzugefügt...",
    failedUse: "Dieses Bild konnte nicht genutzt werden. Bitte erneut versuchen.",
    fallbackAlt: "OpenVerse Bild",
};

const germanActions = {
    openverse: "Bildsuche",
};

const englishFallbackOpenVerse = {
    title: "OpenVerse: {{className}}",
    searchLabel: "Search term",
    searchPlaceholder: "e.g. cat",
    searchAction: "Search images",
    useImage: "Use this image",
    initial: "Search for images for this class.",
    loading: "Searching images...",
    loadingMore: "Loading more images...",
    emptyQuery: "Enter a search term.",
    emptyTitle: "No images found.",
    emptyBody: "Try another search term.",
    retryableError: "Image search did not work. Please try again.",
    rateLimit: "Too many searches are active right now. Try again in a moment.",
    retry: "Try again",
    more: "More results",
    pendingUse: "Adding image...",
    failedUse: "This image could not be used. Please try again.",
    fallbackAlt: "OpenVerse image",
};

const englishFallbackActions = {
    openverse: "Image search",
};

function getLocaleFiles() {
    return fs
        .readdirSync(localeRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
            locale: entry.name,
            file: path.join(localeRoot, entry.name, "image_adv.json"),
        }))
        .filter(({ file }) => fs.existsSync(file))
        .sort((a, b) => a.locale.localeCompare(b.locale));
}

function formatJson(json) {
    return `${JSON.stringify(json, null, 4)}\n`;
}

function nextContentFor(locale, file) {
    const current = JSON.parse(fs.readFileSync(file, "utf8"));
    current.trainingdata = current.trainingdata || {};
    current.trainingdata.actions = current.trainingdata.actions || {};
    current.trainingdata.actions.openverse =
        locale === "de-DE" ? germanActions.openverse : englishFallbackActions.openverse;
    current.trainingdata.openverse =
        locale === "de-DE" ? germanOpenVerse : englishFallbackOpenVerse;
    return formatJson(current);
}

if (!["--check", "--write"].includes(mode)) {
    console.error("Usage: node scripts/addOpenVerseLocaleKeys.cjs [--check|--write]");
    process.exit(1);
}

const localeFiles = getLocaleFiles();
const changed = [];

for (const { locale, file } of localeFiles) {
    const current = fs.readFileSync(file, "utf8");
    const next = nextContentFor(locale, file);

    if (current !== next) {
        changed.push(path.relative(process.cwd(), file));
        if (mode === "--write") {
            fs.writeFileSync(file, next);
        }
    }
}

const action = mode === "--write" ? "updated" : "validated";
console.log(`${action} ${localeFiles.length} image_adv locale files`);

if (mode === "--check" && changed.length > 0) {
    console.error(`would update ${changed.length} file(s):`);
    for (const file of changed) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}
