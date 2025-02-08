import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const upload = multer({ dest: "uploads/" });

const getVideoSummary = asyncHandler(async (req, res, next) => {
    const localFilePath = req.file?.path;

    if (!localFilePath) {
        return next(
            new ApiError(400, "No file uploaded", "Please upload a video file.")
        );
    }

    try {
        console.log("Processing video...");
        const userQuery = req.body.query || "";

        const analysisPrompt = `
            Extract detailed insights from the uploaded video, structuring the summary for student notes.
            The summary should include:

            1. *Key Topics Covered*
            2. *Important Definitions & Terminologies*
            3. *Step-by-Step Explanation of Concepts*
            4. *Real-World Applications & Examples*
            5. *Critical Insights & Takeaways*
            6. *Additional Supporting Information from Web Research*

            Ensure the summary is detailed, well-structured, and easy to understand, making it useful for study purposes.

            *User Query:* ${userQuery}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro" });
        const result = await model.generateContent([analysisPrompt]);
        const response = result.response;
        const summary = response.text();

        const outputFolder = "video_summaries";
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder);
        }

        const summaryFile = path.join(
            outputFolder,
            `${path.basename(localFilePath, path.extname(localFilePath))}_summary.txt`
        );
        fs.writeFileSync(summaryFile, summary, "utf-8");

        console.log(`Summary saved to ${summaryFile}`);
        fs.unlinkSync(localFilePath);

        return res.json(
            new ApiResponse(
                200,
                { summary },
                "Video summary generated successfully"
            )
        );
    } catch (error) {
        console.error("Error processing video:", error);
        return next(
            new ApiError(
                500,
                error.message,
                "Failed to analyze video",
                error.stack
            )
        );
    }
});

export { getVideoSummary, upload };
