import { Router } from "express";
import { get, post } from "../controllers/resources.controller.js";

let router = Router();

router.get("/resources", get);
router.post("/resources", post);

export default router;