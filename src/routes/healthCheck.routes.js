import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/").get(healthCheck);

export default router;
