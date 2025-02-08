import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

class LangflowClient {
    constructor() {
        this.baseURL = "https://api.langflow.astra.datastax.com";
        this.applicationToken = process.env.LANGFLOW_TOKEN;

        // Ensure the application token is set
        if (!this.applicationToken) {
            throw new Error(
                "LANGFLOW_TOKEN is not set in the environment variables."
            );
        }
    }

    async post(
        endpoint,
        body,
        headers = { "Content-Type": "application/json" }
    ) {
        headers["Authorization"] = `Bearer ${this.applicationToken}`;
        const url = `${this.baseURL}${endpoint}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });

            let responseMessage;
            try {
                // Attempt to parse the JSON response
                responseMessage = await response.json();
            } catch (jsonError) {
                const textResponse = await response.text();
                console.error("Invalid JSON Response:", textResponse);
                throw new Error(`Invalid JSON response: ${textResponse}`);
            }

            if (!response.ok) {
                // Handle non-200 responses with detailed error information
                console.error(
                    "Error Response:",
                    JSON.stringify(responseMessage, null, 2)
                );
                throw new Error(
                    `${response.status} ${
                        response.statusText
                    } - ${JSON.stringify(responseMessage)}`
                );
            }

            return responseMessage;
        } catch (error) {
            console.error("Request Error:", error.message);
            throw error;
        }
    }

    async initiateSession(
        flowId,
        langflowId,
        inputValue,
        inputType = "chat",
        outputType = "chat",
        stream = false,
        tweaks = {}
    ) {
        const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;

        return this.post(endpoint, {
            input_value: inputValue,
            input_type: inputType,
            output_type: outputType,
            tweaks: tweaks,
        });
    }

    handleStream(streamUrl, onUpdate, onClose, onError) {
        const eventSource = new EventSource(streamUrl);

        // Handle updates from the stream
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onUpdate(data);
        };

        // Handle stream errors
        eventSource.onerror = (event) => {
            console.error("Stream Error:", event);
            onError(event);
            eventSource.close();
        };

        // Handle stream closure
        eventSource.addEventListener("close", () => {
            onClose("Stream closed");
            eventSource.close();
        });

        return eventSource;
    }

    async runFlow(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType = "chat",
        outputType = "chat",
        tweaks = {},
        stream = false,
        onUpdate,
        onClose,
        onError
    ) {
        try {
            const initResponse = await this.initiateSession(
                flowIdOrName,
                langflowId,
                inputValue,
                inputType,
                outputType,
                stream,
                tweaks
            );

            if (
                stream &&
                initResponse &&
                initResponse.outputs &&
                initResponse.outputs[0].outputs[0].artifacts.stream_url
            ) {
                const streamUrl =
                    initResponse.outputs[0].outputs[0].artifacts.stream_url;
                this.handleStream(streamUrl, onUpdate, onClose, onError);
            }

            return initResponse;
        } catch (error) {
            console.error("Error running flow:", error.message);
            onError("Error initiating session");
        }
    }
}

async function langflowMain(
    inputValue,
    inputType = "chat",
    outputType = "chat",
    stream = false
) {
    const flowIdOrName = process.env.FLOW_ID;
    const langflowId = process.env.LANGFLOW_ID;
    const langflowClient = new LangflowClient();

    try {
        const tweaks = {
            "ParseData-55QZT": {},
            "ChatInput-v5Bdq": {},
            "AstraDBToolComponent-jGUkb": {},
            "Agent-BWNbQ": {},
            "ChatOutput-xCrgo": {},
            "Prompt-plbUp": {},
        };

        const response = await langflowClient.runFlow(
            flowIdOrName,
            langflowId,
            inputValue,
            inputType,
            outputType,
            tweaks,
            stream,
            (data) => console.log("Received:", data.chunk), // Stream update callback
            (message) => console.log("Stream Closed:", message), // Stream close callback
            (error) => console.error("Stream Error:", error) // Stream error callback
        );

        // Process and display final output for non-streaming mode
        if (!stream && response && response.outputs) {
            const flowOutputs = response.outputs[0];
            const firstComponentOutputs = flowOutputs.outputs[0];
            const output = firstComponentOutputs.outputs.message;

            return output.message.text;
        }
    } catch (error) {
        console.error("Main Error", error.message);
    }
}

export default langflowMain;
