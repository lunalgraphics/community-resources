import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const REPO_RAW_BASE = "https://raw.githubusercontent.com/lunalgraphics/community-resources/main/resources";

const ASSET_FILENAMES = {
    ctpreset: "asset.ctxml",
    srtexture: "asset.png",
    pgf2preset: "asset.pgf2",
};

async function buildData() {
    const resourcesDir = join(process.cwd(), "resources");
    const folders = await readdir(resourcesDir, { withFileTypes: true });

    const resources = [];

    for (const folder of folders) {
        if (!folder.isDirectory()) continue;

        const id = folder.name;
        const infoPath = join(resourcesDir, id, "info.json");

        let info;
        try {
            const raw = await readFile(infoPath, "utf-8");
            info = JSON.parse(raw);
        } catch {
            console.warn(`Skipping ${id}: could not read info.json`);
            continue;
        }

        const assetFilename = ASSET_FILENAMES[info.type];
        const assetURL = assetFilename
            ? `${REPO_RAW_BASE}/${id}/${assetFilename}`
            : "";

        resources.push({
            id,
            info,
            assetURL,
            thumbnailURL: `${REPO_RAW_BASE}/${id}/thumbnail.png`,
        });
    }

    await writeFile(
        join(process.cwd(), "data.json"),
        JSON.stringify({ message: "success", data: resources }, null, 2)
    );

    console.log(`Built data.json with ${resources.length} resources.`);
}

buildData();
