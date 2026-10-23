import fs from "fs";
import path from "path";
import pool from "../db";

// Works from both src/db (ts-node) and dist/db (compiled).
const SCHEMA_PATH = path.resolve(__dirname, "../../db/schema.sql");

export const migrate = async (): Promise<void> => {
    const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
    await pool.query(sql);
};

if (require.main === module) {
    migrate()
        .then(() => {
            console.log("Database schema is up to date.");
            return pool.end();
        })
        .catch((err) => {
            console.error("Migration failed:", err);
            process.exit(1);
        });
}
