import pool from "../db";

export interface User {
    id: number;
    username: string;
}

interface UserRow {
    id: number;
    username: string;
    password_hash: string;
}

export const UserModel = {
    async create(username: string, passwordHash: string): Promise<User> {
        const { rows } = await pool.query<User>(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [username, passwordHash]
        );
        return rows[0];
    },

    async findByUsername(username: string): Promise<UserRow | undefined> {
        const { rows } = await pool.query<UserRow>(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
            [username]
        );
        return rows[0];
    },
};
