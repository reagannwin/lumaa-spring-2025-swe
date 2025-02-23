import pool from "../db";
import bcrypt from "bcryptjs";

class User {
    static async create(username: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
            [username, hashedPassword]
        );
        return result.rows[0];
    }

    static async findByUsername(username: string) {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [
            username,
        ]);
        return result.rows[0];
    }
}

export default User;