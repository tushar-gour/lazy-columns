import { Router } from "express";
import healthcheck from "../controllers/healthcheck.controller.js";

const healthRouter = Router();

healthRouter.route("/").get(healthcheck);

export default healthRouter;
