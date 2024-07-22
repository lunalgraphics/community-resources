import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";

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
    let resourceID = getValidRandomID(4);

    await octo.request("POST /repos/lunalgraphics/community-resources/git/refs", {
        owner: "lunalgraphics",
        repo: "community-resources",
        ref: "refs/heads/" + resourceID,
        sha: "b7a9a28a8398386ac2d22aaaec65a6276a4178b5",
    });    

    let infoFileContents = JSON.stringify({
        "name": req.body["name"],
        "type": req.body["type"],
        "author": req.body["author"],
        "description": req.body["description"],
        "tier": 1
    });

    await octo.repos.createOrUpdateFileContents({
        owner: "lunalgraphics",
        repo: "community-resources",
        branch: resourceID,
        path: "public/resources/" + resourceID + "/info.json",
        message: "Add info.json for resource " + resourceID,
        content: Buffer.from(infoFileContents).toString("base64"),
        committer: {
            name: "Lunal Graphics Bot",
            email: "github-bot@lunalgraphics.com",
        },
        author: {
            name: "Lunal Graphics Bot",
            email: "github-bot@lunalgraphics.com",
        },
    });

    if (req.body["type"] == "ctpreset") {
        await octo.repos.createOrUpdateFileContents({
            owner: "lunalgraphics",
            repo: "community-resources",
            branch: resourceID,
            path: "public/resources/" + resourceID + "/asset.ctxml",
            message: "Add asset.ctxml for resource " + resourceID,
            content: req.body["b64"],
            committer: {
                name: "Lunal Graphics Bot",
                email: "github-bot@lunalgraphics.com",
            },
            author: {
                name: "Lunal Graphics Bot",
                email: "github-bot@lunalgraphics.com",
            },
        });
    }
    else if (req.body["type"] == "srtexture") {
        await octo.repos.createOrUpdateFileContents({
            owner: "lunalgraphics",
            repo: "community-resources",
            branch: resourceID,
            path: "public/resources/" + resourceID + "/asset.png",
            message: "Add asset.png for resource " + resourceID,
            content: req.body["b64"],
            committer: {
                name: "Lunal Graphics Bot",
                email: "github-bot@lunalgraphics.com",
            },
            author: {
                name: "Lunal Graphics Bot",
                email: "github-bot@lunalgraphics.com",
            },
        });
    }

    await octo.pulls.create({
        owner: "lunalgraphics",
        repo: "community-resources",
        title: "Add resource #" + resourceID,
        head: resourceID,
        base: "main",
        body: `
**Resource Type:** ${req.body["type"]}
**Resource Name:** ${req.body["name"]}
**Created By:** ${req.body["author"]}
**Description:** ${req.body["description"]}
`,
    });

    return res.status(200).json({
        message: "success",
        data: resourceID,
    });
}