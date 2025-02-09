import dotenv from "dotenv";
import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";

dotenv.config();

// ✅ Initialize Google Generative AI (Use Gemini 1.5)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const chatbotHit = asyncHandler(async (req, res) => {
    const { userQuery = "How can you help me?" } = req.body;
    const resumeFile = req.file;

    let prompt;
    let requestBody = [];
    let response;

    if (resumeFile) {
        const resumeBuffer = fs.readFileSync(resumeFile.path);
        const base64Resume = resumeBuffer.toString("base64");

        prompt = `
            Analyze the given resume and provide a structured evaluation in JSON format. Assess the following parameters and provide percentage scores:

            Skills Match: Evaluate how well the candidate's skills align with the target job description.
            Experience Analysis: Assess the relevance and depth of work experience.
            Formatting Score: Check for readability, structure, and professionalism.
            ATS Compatibility: Determine how well the resume adheres to Applicant Tracking System (ATS) requirements.
            Additionally, provide improvement suggestions for enhancing the resume. Ensure the output follows this JSON structure:
            json
            Copy
            Edit
            {
            "skills": "80%",
            "experience": "80%",
            "formatting": "80%",
            "ats": "80%",
            "improvements": [
                "Add quantifiable achievements to strengthen impact",
                "Include relevant certifications section"
            ]
            }
            Adjust scores and suggestions based on the resume's content:
        `;

        requestBody = [
            { role: "user", parts: [{ text: prompt }] },
            {
                role: "user",
                parts: [
                    {
                        inline_data: {
                            mime_type: resumeFile.mimetype,
                            data: base64Resume,
                        },
                    },
                ],
            },
        ];
        const result = await model.generateContent({ contents: requestBody });
        response = result.response;
    } else {
        prompt = `
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

        Here is user query: ${userQuery}

        return the response in text.
        `;

        requestBody = [{ role: "user", parts: [{ text: prompt }] }];
        const result = await model.generateContent({ contents: requestBody });
        response = result.response.text().trim();
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Chatbot response fetch successful")
        );
});

export default chatbotHit;
