import pool from "../db";

export interface Task {
    id: number;
    title: string;
    description: string | null;
    isComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TaskUpdate {
    title?: string;
    description?: string | null;
    isComplete?: boolean;
}

// Columns are snake_case in Postgres and camelCase in the API.
const COLUMNS = `
    id,
    title,
    description,
    is_complete AS "isComplete",
    created_at  AS "createdAt",
    updated_at  AS "updatedAt"
`;

export const TaskModel = {
    async findAllByUser(userId: number): Promise<Task[]> {
        const { rows } = await pool.query<Task>(
            `SELECT ${COLUMNS} FROM tasks WHERE user_id = $1 ORDER BY created_at, id`,
            [userId]
        );
        return rows;
    },

    async create(userId: number, title: string, description: string | null): Promise<Task> {
        const { rows } = await pool.query<Task>(
            `INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
            [title, description, userId]
        );
        return rows[0];
    },

    /**
     * Partial update: only fields that are present get changed, so
     * toggling isComplete doesn't wipe the title and description.
     * Returns undefined if the task doesn't exist or isn't this user's.
     */
    async update(userId: number, taskId: number, changes: TaskUpdate): Promise<Task | undefined> {
        const { rows } = await pool.query<Task>(
            `UPDATE tasks SET
                title       = CASE WHEN $1::boolean THEN $2 ELSE title END,
                description = CASE WHEN $3::boolean THEN $4 ELSE description END,
                is_complete = CASE WHEN $5::boolean THEN $6::boolean ELSE is_complete END,
                updated_at  = NOW()
             WHERE id = $7 AND user_id = $8
             RETURNING ${COLUMNS}`,
            [
                changes.title !== undefined,
                changes.title ?? null,
                changes.description !== undefined,
                changes.description ?? null,
                changes.isComplete !== undefined,
                changes.isComplete ?? null,
                taskId,
                userId,
            ]
        );
        return rows[0];
    },

    async delete(userId: number, taskId: number): Promise<boolean> {
        const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
            taskId,
            userId,
        ]);
        return (rowCount ?? 0) > 0;
    },
};
