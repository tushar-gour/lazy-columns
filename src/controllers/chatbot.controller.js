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

    if (resumeFile) {
        const resumeBuffer = fs.readFileSync(resumeFile.path);
        const base64Resume = resumeBuffer.toString("base64");

        prompt = `
            Analyze the given resume and provide a structured evaluation in JSON format. Assess the following parameters and provide percentage scores:

            - **Skills Match**: Evaluate how well the candidate's skills align with the target job description.
            - **Experience Analysis**: Assess the relevance and depth of work experience.
            - **Formatting Score**: Check for readability, structure, and professionalism.
            - **ATS Compatibility**: Determine how well the resume adheres to Applicant Tracking System (ATS) requirements.
            
            Additionally, provide improvement suggestions for enhancing the resume. 
            Ensure the output follows this **JSON structure** (return only valid JSON, no extra text):
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

            ⚠️ **Important**: Only return valid JSON, no explanations or additional text.
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
    } else {
        prompt = `
        You are an AI-powered educational assistant for an EdTech platform. Your tasks include:

        - Answering academic queries with structured explanations.
        - Generating MCQs, coding problems, and short-answer questions.
        - Summarizing lectures into key points.
        - Providing study resources and exam strategies.

        **Strict Policy**: 
        - Only answer education-related topics.
        - Decline questions unrelated to education.
        - Provide structured, beginner-friendly responses.

        Now, answer this question: ${userQuery}
        `;

        requestBody = [{ role: "user", parts: [{ text: prompt }] }];
    }

    // 🔥 Send request to Gemini AI
    const result = await model.generateContent({ contents: requestBody });
    let chatbotResponse = result.response.text().trim();

    // ✅ Extract JSON from mixed responses (if necessary)
    const jsonMatch = chatbotResponse.match(/\{[\s\S]*\}/); // Find JSON-like content
    if (jsonMatch) {
        chatbotResponse = jsonMatch[0];
    }

    // ✅ Attempt JSON parsing
    try {
        chatbotResponse = JSON.parse(chatbotResponse);
    } catch (error) {
        console.error("❌ Invalid JSON response from Gemini:", error);
        chatbotResponse = {
            error: "Gemini returned an unstructured response. Please try again.",
            rawResponse: chatbotResponse, // Show raw response for debugging
        };
    }

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
