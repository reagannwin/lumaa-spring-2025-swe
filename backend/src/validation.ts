// Small hand-rolled validators. Each returns an error message, or null if valid.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const PASSWORD_MIN = 8;
export const TITLE_MAX = 255;
export const DESCRIPTION_MAX = 2000;

export const validateCredentials = (username: unknown, password: unknown): string | null => {
    if (typeof username !== "string" || typeof password !== "string") {
        return "Username and password are required";
    }
    const name = username.trim();
    if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
        return `Username must be ${USERNAME_MIN} to ${USERNAME_MAX} characters`;
    }
    if (password.length < PASSWORD_MIN) {
        return `Password must be at least ${PASSWORD_MIN} characters`;
    }
    return null;
};

export const validateTitle = (title: unknown): string | null => {
    if (typeof title !== "string" || title.trim().length === 0) return "Title is required";
    if (title.trim().length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters`;
    return null;
};

export const validateDescription = (description: unknown): string | null => {
    if (description === undefined || description === null) return null;
    if (typeof description !== "string") return "Description must be a string";
    if (description.length > DESCRIPTION_MAX) {
        return `Description must be at most ${DESCRIPTION_MAX} characters`;
    }
    return null;
};

/** Route params arrive as strings; only accept positive integers. */
export const parseId = (raw: string): number | null => {
    if (!/^\d+$/.test(raw)) return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
};
