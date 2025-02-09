import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";

dotenv.config();

// ✅ Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function analyzeVideo(videoUrl, userQuery) {
    try {
        console.log("Processing video:", videoUrl);

        const prompt = ` 
        You are an AI assistant that generates structured educational summaries. Analyze the YouTube video at this URL: ${videoUrl} and create a student-friendly summary.

        📌 **Summary Requirements:**
        - Write a well-structured summary in a natural, flowing paragraph.
        - Do not use bullet points, asterisks, bold text, section headers, or extra line breaks.
        - Integrate key topics, important concepts, explanations, real-world applications, and takeaways into a coherent response.
        - Keep the language simple, concise, and engaging.
        - Tailor the summary based on the user's query: "${userQuery}".
        - word count minimum: 500

        📌 **Output Format:**
        - Return a single paragraph with no markdown, symbols, or special formatting.
        - Ensure smooth transitions between concepts to maintain readability.

        Structure the summary for student notes with these key points:

        1. Key Topics Covered
        2. Important Definitions & Terminologies
        3. Step-by-Step Explanation of Concepts
        4. Real-World Applications & Examples
        5. Critical Insights & Takeaways
        `;

        const result = await model.generateContent(prompt);
        let summary = result.response.text();

        // Remove all unwanted characters (**, *, \n)
        summary = summary.replace(/[*_]/g, "").replace(/\n/g, " ").trim();

        return summary;
    } catch (error) {
        console.error("Error processing video:", error);
        return null;
    }
}

async function fetchQuestions(summary) {
    try {
        console.log("Fetching Questions");

        const prompt = `
        Generate a diverse set of well-structured multiple-choice questions in JSON format based on the following summary. 

        📌 Summary: ${summary}

        📌 Question Guidelines:
        - Each question should be clear and well-structured.
        - Provide exactly 4 answer options.
        - Indicate the correct answer in the "answer" field.
        - Return only a JSON array (without extra text or formatting).
        - total 10 questions

        📌 Output Example:
        [
          {
            "question": "What is the main topic of the video?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": "Correct Option"
          },
          ...
        ]
        `;

        const result = await model.generateContent(prompt);
        let questionsText = result.response.text();

        // Remove any backticks and unnecessary formatting (if present)
        questionsText = questionsText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Parse the cleaned text into a JSON object
        const questions = JSON.parse(questionsText);

        return questions;
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
