import { Router } from "express";
import multer from "multer";
import chatbotHit from "../controllers/chatbot.controller.js";

const upload = multer({ dest: "uploads/" }); // Store files in 'uploads/' folder

const chatbotRouter = Router();
chatbotRouter.route("/").post(upload.single("resumeFile"), chatbotHit); // Handle single file upload

export default chatbotRouter;
