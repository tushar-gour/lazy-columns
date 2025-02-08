import express from "express";
import healthRouter from "./routers/healthcheck.route.js";
import langflowRouter from "./routers/langflow.route.js";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import summaryRouter from "./routers/summary.route.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use("/api/v1", healthRouter);
app.use("/api/v1/langflow", langflowRouter);
app.use("/api/v1/video-summary", summaryRouter);

export default app;
