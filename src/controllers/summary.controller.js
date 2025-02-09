import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import langflowMain from "../services/langflowclient.js";

dotenv.config();

// ✅ Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function analyzeVideo(videoUrl, userQuery) {
    try {
        console.log("Processing video:", videoUrl);

        // Ensure correct model initialization
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = ` 
        Analyze the YouTube video at the following URL: ${videoUrl} and generate a structured, student-friendly summary based on the following key points:

        Key Topics Covered - Outline the main subjects discussed.
        Important Definitions & Terminologies - Highlight essential concepts with clear definitions.
        Step-by-Step Explanation of Concepts - Break down complex ideas into simple, logical steps.
        Real-World Applications & Examples - Provide practical use cases to enhance understanding.
        Critical Insights & Takeaways - Summarize the most valuable lessons from the video.

        Ensure the response is concise, well-structured, and easy to understand for students.
        Tailor the summary based on the user's query: ${userQuery}.
        Avoid unnecessary formatting or line breaks—deliver the response as a single, coherent paragraph
    `;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        return summary;
    } catch (error) {
        console.error("Error processing video:", error);
        return null;
    }
}

async function fetchQuestions(summary) {
    try {
        const prompt = `
        Based on the following summary text, generate insightful questions that assess comprehension and critical thinking:

        Summary: ${summary}

        Question Guidelines:
        Factual Questions - Direct questions based on key points from the summary.
        Conceptual Understanding - Questions that test deeper comprehension.
        Application-Based Questions - Scenario-based queries to apply knowledge.
        Critical Thinking Questions - Thought-provoking questions that encourage analysis.
        Multiple-Choice & Open-Ended Mix - A variety of question formats for assessment.

        Ensure the questions are well-structured, relevant to the summary, and diverse in difficulty level.
        Output the response as a single, coherent list without unnecessary formatting.
        `;

        const fetchedQuestions = await langflowMain(prompt);

        return fetchedQuestions;
    } catch (error) {
        throw new ApiError(
            500,
            `Error fetching questions ${error.message}`,
            error
        );
    }
}

const getVideoSummary = asyncHandler(async (req, res) => {
    const {
        videoUrl,
        userQuery = "Summarize the key points of the topic explained in this video.",
    } = req.body;

    if (!videoUrl || !videoUrl.includes("youtube.com")) {
        throw new ApiError(400, "A valid YouTube video URL is required.");
    }

    const summary = await analyzeVideo(videoUrl, userQuery);
    const questions = await fetchQuestions(summary);

    console.log(questions);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                summary: summary,
                questions: questions,
            },
            "Video processed successfully."
        )
    );
});

export default getVideoSummary;
