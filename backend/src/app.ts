import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { config } from "./config";
import authRouter from "./routes/auth";
import tasksRouter from "./routes/tasks";

export const createApp = () => {
    const app = express();

    app.use(cors({ origin: config.corsOrigin }));
    app.use(express.json({ limit: "100kb" }));

    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.use("/auth", authRouter);
    app.use("/tasks", tasksRouter);

    app.use((_req, res) => {
        res.status(404).json({ message: "Not found" });
    });

    app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
        if (err.type === "entity.parse.failed") {
            return res.status(400).json({ message: "Request body must be valid JSON" });
        }
        console.error(err);
        return res.status(500).json({ message: "Something went wrong" });
    });

    return app;
};
