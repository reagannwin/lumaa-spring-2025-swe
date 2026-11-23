import axios, { AxiosError } from "axios";
import type { Task, TaskChanges } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TOKEN_KEY = "token";
export const AUTH_EXPIRED_EVENT = "auth:expired";

export const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// If the server says the token is bad or expired, sign the user out
// everywhere instead of leaving them on a page that silently fails.
client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const isAuthCall = error.config?.url?.startsWith("/auth/");
        if (error.response?.status === 401 && !isAuthCall) {
            window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
        return Promise.reject(error);
    }
);

/** Pull the server's message out of an error, with a fallback. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        if (!error.response) return "Can't reach the server. Is the backend running?";
        const message = (error.response.data as { message?: unknown } | undefined)?.message;
        if (typeof message === "string") return message;
    }
    return fallback;
};

export const authApi = {
    register: (username: string, password: string) =>
        client.post("/auth/register", { username, password }),

    login: async (username: string, password: string): Promise<string> => {
        const { data } = await client.post<{ token: string }>("/auth/login", { username, password });
        return data.token;
    },
};

export const tasksApi = {
    list: async (): Promise<Task[]> => (await client.get<Task[]>("/tasks")).data,

    create: async (title: string, description: string): Promise<Task> =>
        (await client.post<Task>("/tasks", { title, description })).data,

    update: async (id: number, changes: TaskChanges): Promise<Task> =>
        (await client.put<Task>(`/tasks/${id}`, changes)).data,

    remove: async (id: number): Promise<void> => {
        await client.delete(`/tasks/${id}`);
    },
};
