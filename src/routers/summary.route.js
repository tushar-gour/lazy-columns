import { Router } from "express";
import getVideoSummary from "../controllers/summary.controller.js";

const summaryRouter = Router();

summaryRouter.route("/").post(getVideoSummary);

export default summaryRouter;
