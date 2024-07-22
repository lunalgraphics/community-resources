import { Octokit } from "@octokit/rest";
import { json } from "@sveltejs/kit";
import { GITHUB_TOKEN } from "$env/static/private";

let octo = new Octokit({
    auth: GITHUB_TOKEN,
});

function getValidRandomID(digits=4, taken=[]) {
    let id = Math.random().toFixed(digits).split(".").pop();
    if (taken.includes(id)) {
        id = getValidRandomID(digits, taken);
    }
    return id;
}

export async function GET() {
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
        data["thumbnailURL"] = "";
        let thumbnailFile = (await octo.request("GET /repos/lunalgraphics/community-resources/contents/public/resources/" + folder["name"] + "/thumbnail.png")).data;
        data["thumbnailURL"] = thumbnailFile["download_url"];
        output.push(data);
    }

    return json({
        message: "success",
        data: output,
    });
}

export async function POST({ request }) {
    let body = await request.json();

    let resourceID = getValidRandomID(4);

    await octo.request("POST /repos/lunalgraphics/community-resources/git/refs", {
        owner: "lunalgraphics",
        repo: "community-resources",
        ref: "refs/heads/" + resourceID,
        sha: "b7a9a28a8398386ac2d22aaaec65a6276a4178b5",
    });    

    let infoFileContents = JSON.stringify({
        "name": body["name"],
        "type": body["type"],
        "author": body["author"],
        "description": body["description"],
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

    if (body["type"] == "ctpreset") {
        await octo.repos.createOrUpdateFileContents({
            owner: "lunalgraphics",
            repo: "community-resources",
            branch: resourceID,
            path: "public/resources/" + resourceID + "/asset.ctxml",
            message: "Add asset.ctxml for resource " + resourceID,
            content: body["b64"],
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
    else if (body["type"] == "srtexture") {
        await octo.repos.createOrUpdateFileContents({
            owner: "lunalgraphics",
            repo: "community-resources",
            branch: resourceID,
            path: "public/resources/" + resourceID + "/asset.png",
            message: "Add asset.png for resource " + resourceID,
            content: body["b64"],
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

    await octo.repos.createOrUpdateFileContents({
        owner: "lunalgraphics",
        repo: "community-resources",
        branch: resourceID,
        path: "public/resources/" + resourceID + "/thumbnail.png",
        message: "Add thumbnail.png for resource " + resourceID,
        content: body["thumbnail64"],
        committer: {
            name: "Lunal Graphics Bot",
            email: "github-bot@lunalgraphics.com",
        },
        author: {
            name: "Lunal Graphics Bot",
            email: "github-bot@lunalgraphics.com",
        },
    });

    await octo.pulls.create({
        owner: "lunalgraphics",
        repo: "community-resources",
        title: "Add resource #" + resourceID,
        head: resourceID,
        base: "main",
        body: `
**Resource Type:** ${body["type"]}
**Resource Name:** ${body["name"]}
**Created By:** ${body["author"]}
**Description:** ${body["description"]}
`,
    });

    let notification = new URLSearchParams();
    notification.set("topic", "New submission to Community Resources");
    notification.set("message", `ID: ${resourceID} \n\n View pull requests at https://github.com/lunalgraphics/community-resources/pulls`);
    fetch("https://formspree.io/f/xrgjqgqq", {
        method: "POST",
        body: notification,
    });

    return json({
        message: "success",
        data: resourceID,
    });
}