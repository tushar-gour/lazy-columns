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
    const { userQuery = "How can you help me?" } = req.body; // Extract user query
    const resumeFile = req.file; // Extract resume file

    let prompt;
    let requestBody = [];

    if (resumeFile) {
        // ✅ Read file and convert to Base64
        const resumeBuffer = fs.readFileSync(resumeFile.path);
        const base64Resume = resumeBuffer.toString("base64");

        // ✅ Create structured resume analysis prompt
        prompt = `
            Analyze the given resume and provide a structured evaluation in JSON format. Assess the following parameters and provide percentage scores:

            - **Skills Match**: Evaluate how well the candidate's skills align with the target job description.
            - **Experience Analysis**: Assess the relevance and depth of work experience.
            - **Formatting Score**: Check for readability, structure, and professionalism.
            - **ATS Compatibility**: Determine how well the resume adheres to Applicant Tracking System (ATS) requirements.
            
            Additionally, provide improvement suggestions for enhancing the resume. 
            Ensure the output follows this **JSON structure**:
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

            Adjust scores and suggestions based on the resume's content.
            ⚠️ Important: Return the JSON **without markdown formatting** (like \`\`\`json ... \`\`\`).
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
        // ✅ Default educational AI assistant prompt
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
    let chatbotResponse = result.response.text();

    // ✅ Remove Markdown and ensure valid JSON
    chatbotResponse = chatbotResponse.replace(/```json|```/g, "").trim();

    try {
        chatbotResponse = JSON.parse(chatbotResponse);
    } catch (error) {
        console.error("❌ Invalid JSON response from Gemini:", error);
        chatbotResponse = { error: "Failed to parse response as JSON." };
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
