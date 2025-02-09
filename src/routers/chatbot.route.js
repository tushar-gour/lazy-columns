import { Router } from "express";
import multer from "multer";
import { analyzeResume, handleEducationQuery } from "../controllers/chatbot.controller.js";

const upload = multer({ dest: "uploads/" }); // Store files in 'uploads' directory
const chatbotRouter = Router();

chatbotRouter.route("/analyze-resume").post(upload.single("resume"), analyzeResume);
chatbotRouter.route("/education-query").post(handleEducationQuery);

export default chatbotRouter;
