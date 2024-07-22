import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Octokit } from "octokit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let octo = new Octokit({
    auth: process.env["GITHUB_TOKEN"],
});

function getValidRandomID(digits=4, taken=[]) {
    let id = Math.random().toFixed(digits).split(".").pop();
    if (taken.includes(id)) {
        id = getValidRandomID(digits, taken);
    }
    return id;
}

export async function get(req, res) {
    let folders = (await octo.request("GET /repos/lunalgraphics/community-resources/contents/public/resources")).data;

    let output = [];
    for (let folder of folders) {
        let data = {};
        data["id"] = folder["name"];
        let infoFile = (await octo.request("GET /repos/lunalgraphics/community-resources/contents/public/resources/" + folder["name"] + "/info.json")).data;
        let infoString = Buffer.from(infoFile["content"], "base64");
        data["info"] = JSON.parse(infoString);
        data["assetURL"] = "";
        if (data["info"]["type"] == "ctpreset") {
            let assetFile = (await octo.request("GET /repos/lunalgraphics/community-resources/contents/public/resources/" + folder["name"] + "/asset.ctxml")).data;
            data["assetURL"] = assetFile["download_url"];
        }
        else if (data["info"]["type"] == "srtexture") {
            let assetFile = (await octo.request("GET /repos/lunalgraphics/community-resources/contents/public/resources/" + folder["name"] + "/asset.png")).data;
            data["assetURL"] = assetFile["download_url"];
        }
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
        "tier": 1
    });
    fs.writeFileSync(path.resolve(resourcesDir, resourceID, "info.json"), infoFileContents, "utf-8");

    if (req.body["type"] == "ctpreset") {
        let assetContents = Buffer.from(req.body["b64"], "base64");
        fs.writeFileSync(path.resolve(resourcesDir, resourceID, "asset.ctxml"), assetContents, "utf-8");
    }
    else if (req.body["type"] == "srtexture") {
        let assetContents = Buffer.from(req.body["b64"], "base64");
        fs.writeFileSync(path.resolve(resourcesDir, resourceID, "asset.png"), assetContents, "utf-8");
    }

    return res.status(200).json({
        message: "success",
        data: resourceID,
    });
}