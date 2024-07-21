import { Router } from "express";
import { get } from "../controllers/ping.controller.js";

let router = Router();

router.get("/ping", get);

export default router;