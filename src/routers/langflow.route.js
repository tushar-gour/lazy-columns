import { Router } from "express";
import langflowHit from "../controllers/langflow.controller.js";

const langflowRouter = Router();

langflowRouter.route("/").post(langflowHit);

export default langflowRouter;
