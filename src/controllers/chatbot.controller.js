import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";

dotenv.config();

// ✅ Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const chatbotHit = asyncHandler(async (req, res) => {
    const { userQuery } = req.body;

    const prompt = `
        You are an AI-powered educational assistant for an EdTech platform. Your purpose is to assist students with:

        Answering Subject-Related Queries - Provide structured explanations for academic topics.
        Generating Practice Questions - Create MCQs, short answers, or coding problems.
        Summarizing Lectures - Convert detailed topics into key points.
        Guiding Exam Preparation - Recommend study resources and strategies.
        Strict Content Policy:

        ONLY respond to education-related topics (math, science, programming, etc.).
        If a question is off-topic, politely decline:
        'I'm here to assist with educational topics only. Let's stay focused on learning!'
        Redirect users to the Exam Generator for test creation.
        Direct users to the Lecture Summarizer for content condensation.
        Response Guidelines:

        Keep explanations clear, structured, and student-friendly.
        Adapt to the user's level (beginner, intermediate, advanced).
        Maintain an interactive and engaging tone.


        response based on written above behaviour you have to follow and here is user query: ${userQuery}
    `;

    const result = await model.generateContent(prompt);
    let chatbotResponse = result.response.text();

    chatbotResponse = chatbotResponse
        .replace(/[*_]/g, "")
        .replace(/\n/g, " ")
        .trim();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                chatbotResponse,
                "Chatbot response fetch successful"
            )
        );
});

export default chatbotHit;
