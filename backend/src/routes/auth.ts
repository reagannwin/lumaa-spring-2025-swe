import express from "express";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const router = express.Router();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
});

// Register a new user
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user to the database
        const result = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
            [username, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed" });
    }
});

// Login a user
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Find the user in the database
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", {
            expiresIn: "1h", // Token expires in 1 hour
        });

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login failed" });
    }
});

export default router;