import { createApp } from "./app";
import { config } from "./config";
import pool from "./db";

const app = createApp();

const server = app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});

const shutdown = () => {
    server.close(() => {
        pool.end().finally(() => process.exit(0));
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
