import express from "express";
import "dotenv/config";
import router from "./api/v1/routes/loader.js";

let app = express();

let PORT = process.env["PORT"] || 3000;

app.use(express.json());

app.use("/api/v1", router);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})