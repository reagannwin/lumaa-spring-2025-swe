import express from "express";
import { Pool } from "pg";
import authenticate from "../middleware/authenticate";

const router = express.Router();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
});

// Get all tasks for the authenticated user
router.get("/", authenticate, async (req, res) => {
    const userId = (req as any).userId;

    try {
        const result = await pool.query("SELECT * FROM tasks WHERE userId = $1", [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

// Create a new task
router.post("/", authenticate, async (req, res) => {
    const userId = (req as any).userId;
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, description, userId) VALUES ($1, $2, $3) RETURNING *",
            [title, description, userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create task" });
    }
});

// Update a task
router.put("/:id", authenticate, async (req, res) => {
    const userId = (req as any).userId;
    const taskId = req.params.id;
    const { title, description, isComplete } = req.body;

    try {
        const result = await pool.query(
            "UPDATE tasks SET title = $1, description = $2, isComplete = $3 WHERE id = $4 AND userId = $5 RETURNING *",
            [title, description, isComplete, taskId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update task" });
    }
});

// Delete a task
router.delete("/:id", authenticate, async (req, res) => {
    const userId = (req as any).userId;
    const taskId = req.params.id;

    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND userId = $2 RETURNING *", [
            taskId,
            userId,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete task" });
    }
});

export default router;