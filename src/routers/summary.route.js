import { Router } from "express";
import { getVideoSummary, upload } from "../controllers/summary.controller.js";

const summaryRouter = Router();

summaryRouter.route("/").post(upload.single("file"), getVideoSummary);

export default summaryRouter;
