import { Octokit } from "@octokit/rest";
import { readFile } from "fs/promises";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

let octo = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function GET() {
    try {
        const dataPath = join(process.cwd(), "data.json");
        const raw = await readFile(dataPath, "utf-8");
        const data = JSON.parse(raw);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({
            message: "error",
            error: "Failed to read resource index",
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });
    }
}

export async function POST(request) {
    let body = await request.json();

    // Read current data to determine next sequential ID
    const dataPath = join(process.cwd(), "data.json");
    const raw = await readFile(dataPath, "utf-8");
    const currentData = JSON.parse(raw);
    let resourceID = currentData.data.length > 0
        ? currentData.data[currentData.data.length - 1].id + 1
        : 0;

    // Get the current SHA of main to branch from
    let mainRef = await octo.request("GET /repos/lunalgraphics/community-resources/git/ref/heads/main");
    let mainSha = mainRef.data.object.sha;

    // Find a free branch name by incrementing if the branch already exists
    while (true) {
        try {
            await octo.request("GET /repos/lunalgraphics/community-resources/git/ref/heads/" + resourceID);
            // Branch exists, try next ID
            resourceID++;
        } catch {
            // Branch doesn't exist, we can use this ID
            break;
        }
    }

    resourceID = String(resourceID);

    await octo.request("POST /repos/lunalgraphics/community-resources/git/refs", {
        owner: "lunalgraphics",
        repo: "community-resources",
        ref: "refs/heads/" + resourceID,
        sha: mainSha,
    });    

    let infoFileContents = JSON.stringify({
        "name": body["name"],
        "type": body["type"],
        "author": body["author"],
        "description": body["description"],
        "tier": 1
    }, null, 4);

    await octo.repos.createOrUpdateFileContents({
        owner: "lunalgraphics",
        repo: "community-resources",
        branch: resourceID,
        path: "resources/" + resourceID + "/info.json",
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
            path: "resources/" + resourceID + "/asset.ctxml",
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
            path: "resources/" + resourceID + "/asset.png",
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
    else if (body["type"] == "pgf2preset") {
        await octo.repos.createOrUpdateFileContents({
            owner: "lunalgraphics",
            repo: "community-resources",
            branch: resourceID,
            path: "resources/" + resourceID + "/asset.pgf2",
            message: "Add asset.pgf2 for resource " + resourceID,
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
        path: "resources/" + resourceID + "/thumbnail.png",
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

    return new Response(JSON.stringify({
        message: "success",
        data: resourceID,
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
        }
    });
}