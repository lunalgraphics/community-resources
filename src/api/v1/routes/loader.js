import fs from "fs";
import { Router } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
    
const __dirname = dirname(fileURLToPath(import.meta.url));

let router = Router();
let routeFiles = fs.readdirSync(__dirname + "/");

for (let file of routeFiles) {
    if (file != "loader.js") {
        let route = (await import("./" + file)).default;
        router.use(route);
    }
}

export default router;