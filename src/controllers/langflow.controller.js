import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import langflowMain from "../services/langflowclient.js";
import { ApiError } from "../utils/ApiError.js";

const langflowHit = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        throw new ApiError(400, "A message or prompt is required");
    }

    try {
        console.log("Fetching response...");
        const response = await langflowMain(message);

        return res
            .status(200)
            .json(new ApiResponse(200, response, "Response fetch successful"));
    } catch (error) {
        console.error("Error running flow:", error);
        throw new ApiError(
            500,
            `Langflow response error ${error.message}`,
            error
        );
    }
});

export default langflowHit;
