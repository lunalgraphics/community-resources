import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getValidRandomID(digits=4, taken=[]) {
    let id = Math.random().toFixed(digits).split(".").pop();
    if (taken.includes(id)) {
        id = getValidRandomID(digits, taken);
    }
    return id;
}

export async function get(req, res) {
    let resourcesDir = path.resolve(__dirname, "../../../../public/resources");
    let folders = fs.readdirSync(resourcesDir);

    let output = [];
    for (let resourceID of folders) {
        let data = {};
        data["id"] = resourceID;
        let infoFilePath = path.resolve(resourcesDir, resourceID, "info.json");
        data["info"] = JSON.parse(fs.readFileSync(infoFilePath));
        output.push(data);
    }

    return res.status(200).json({
        message: "success",
        data: output,
    });
}

export async function post(req, res) {
    let resourcesDir = path.resolve(__dirname, "../../../../public/resources");
    let folders = fs.readdirSync(resourcesDir);

    let resourceID = getValidRandomID(4, folders);
    fs.mkdirSync(path.resolve(resourcesDir, resourceID));

    let infoFileContents = JSON.stringify({
        "name": req.body["name"],
        "type": req.body["type"],
        "author": req.body["author"],
        "description": req.body["description"],
        "goldStar": false
    });
    fs.writeFileSync(path.resolve(resourcesDir, resourceID, "info.json"), infoFileContents, "utf-8");

    return res.status(200).json({
        message: "success",
        data: resourceID,
    });
}