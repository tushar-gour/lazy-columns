import { Router } from "express";
import chatbotHit from "../controllers/chatbot.controller.js";

const chatbotRouter = Router();

chatbotRouter.route("/").post(chatbotHit);

export default chatbotRouter;
