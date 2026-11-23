import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import pool from "../src/db";
import { migrate } from "../src/db/migrate";

const app = createApp();

const register = (username = "alice", password = "password123") =>
    request(app).post("/auth/register").send({ username, password });

const loginAs = async (username = "alice", password = "password123") => {
    await register(username, password);
    const res = await request(app).post("/auth/login").send({ username, password });
    return res.body.token as string;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
    await migrate();
});

beforeEach(async () => {
    await pool.query("TRUNCATE tasks, users RESTART IDENTITY CASCADE");
});

afterAll(async () => {
    await pool.end();
});

describe("health and routing", () => {
    it("reports healthy", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("returns JSON 404 for unknown routes", async () => {
        const res = await request(app).get("/nope");
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Not found");
    });

    it("rejects malformed JSON with 400", async () => {
        const res = await request(app)
            .post("/auth/register")
            .set("Content-Type", "application/json")
            .send("{not json");
        expect(res.status).toBe(400);
    });
});

describe("POST /auth/register", () => {
    it("creates a user and never returns the password", async () => {
        const res = await register();
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 1, username: "alice" });
    });

    it("stores a bcrypt hash, not the plain password", async () => {
        await register("alice", "password123");
        const { rows } = await pool.query("SELECT password_hash FROM users WHERE username = 'alice'");
        expect(rows[0].password_hash).not.toBe("password123");
        expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    });

    it("returns 409 for a duplicate username", async () => {
        await register();
        const res = await register();
        expect(res.status).toBe(409);
    });

    it("trims the username", async () => {
        const res = await register("  bob  ");
        expect(res.body.username).toBe("bob");
    });

    it.each<[object, string]>([
        [{}, "missing fields"],
        [{ username: "ab", password: "password123" }, "short username"],
        [{ username: "alice", password: "short" }, "short password"],
        [{ username: 123, password: "password123" }, "non-string username"],
    ])("returns 400 for %j (%s)", async (body: object) => {
        const res = await request(app).post("/auth/register").send(body);
        expect(res.status).toBe(400);
    });
});

describe("POST /auth/login", () => {
    it("returns a token for valid credentials", async () => {
        await register();
        const res = await request(app).post("/auth/login").send({ username: "alice", password: "password123" });
        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe("string");
        expect(res.body.user).toEqual({ id: 1, username: "alice" });
    });

    it("gives the same 401 for a wrong password and an unknown user", async () => {
        await register();
        const wrongPassword = await request(app)
            .post("/auth/login")
            .send({ username: "alice", password: "wrongpassword" });
        const unknownUser = await request(app)
            .post("/auth/login")
            .send({ username: "nobody", password: "password123" });

        expect(wrongPassword.status).toBe(401);
        expect(unknownUser.status).toBe(401);
        expect(wrongPassword.body).toEqual(unknownUser.body);
    });

    it("returns 400 when fields are missing", async () => {
        const res = await request(app).post("/auth/login").send({ username: "alice" });
        expect(res.status).toBe(400);
    });
});

describe("task routes require authentication", () => {
    it.each([
        ["get", "/tasks"],
        ["post", "/tasks"],
        ["put", "/tasks/1"],
        ["delete", "/tasks/1"],
    ] as const)("%s %s returns 401 without a token", async (method, path) => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
    });

    it("rejects a token signed with a different secret", async () => {
        const forged = jwt.sign({ userId: 1 }, "some-other-secret");
        const res = await request(app).get("/tasks").set(auth(forged));
        expect(res.status).toBe(401);
    });

    it("rejects an expired token", async () => {
        const expired = jwt.sign({ userId: 1 }, process.env.JWT_SECRET!, { expiresIn: -10 });
        const res = await request(app).get("/tasks").set(auth(expired));
        expect(res.status).toBe(401);
    });

    it("rejects a header without the Bearer prefix", async () => {
        const token = await loginAs();
        const res = await request(app).get("/tasks").set("Authorization", token);
        expect(res.status).toBe(401);
    });
});

describe("tasks CRUD", () => {
    let token: string;

    beforeEach(async () => {
        token = await loginAs();
    });

    const createTask = (body: object = { title: "Buy milk", description: "2%" }) =>
        request(app).post("/tasks").set(auth(token)).send(body);

    it("starts with an empty list", async () => {
        const res = await request(app).get("/tasks").set(auth(token));
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("creates a task with camelCase fields and isComplete false", async () => {
        const res = await createTask();
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            id: 1,
            title: "Buy milk",
            description: "2%",
            isComplete: false,
        });
        expect(res.body).not.toHaveProperty("is_complete");
        expect(res.body).not.toHaveProperty("user_id");
    });

    it("lists created tasks in creation order", async () => {
        await createTask({ title: "First" });
        await createTask({ title: "Second" });
        const res = await request(app).get("/tasks").set(auth(token));
        expect(res.body.map((t: { title: string }) => t.title)).toEqual(["First", "Second"]);
    });

    it("stores an empty description as null", async () => {
        const res = await createTask({ title: "No details", description: "   " });
        expect(res.body.description).toBeNull();
    });

    it.each<[object, string]>([
        [{}, "missing title"],
        [{ title: "   " }, "blank title"],
        [{ title: "x".repeat(256) }, "title too long"],
        [{ title: "ok", description: 5 }, "non-string description"],
    ])("returns 400 on create for %s", async (body: object) => {
        const res = await createTask(body);
        expect(res.status).toBe(400);
    });

    it("marks a task complete without wiping its title or description", async () => {
        const { body: task } = await createTask();
        const res = await request(app).put(`/tasks/${task.id}`).set(auth(token)).send({ isComplete: true });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ title: "Buy milk", description: "2%", isComplete: true });
    });

    it("edits the title and description", async () => {
        const { body: task } = await createTask();
        const res = await request(app)
            .put(`/tasks/${task.id}`)
            .set(auth(token))
            .send({ title: "Buy oat milk", description: "" });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ title: "Buy oat milk", description: null, isComplete: false });
    });

    it.each<[object, string]>([
        [{}, "empty body"],
        [{ isComplete: "yes" }, "non-boolean isComplete"],
        [{ title: "" }, "blank title"],
    ])("returns 400 on update for %s", async (body: object) => {
        const { body: task } = await createTask();
        const res = await request(app).put(`/tasks/${task.id}`).set(auth(token)).send(body);
        expect(res.status).toBe(400);
    });

    it("returns 400 for a non-numeric id", async () => {
        const res = await request(app).put("/tasks/abc").set(auth(token)).send({ isComplete: true });
        expect(res.status).toBe(400);
    });

    it("returns 404 when updating or deleting a task that doesn't exist", async () => {
        const update = await request(app).put("/tasks/999").set(auth(token)).send({ isComplete: true });
        const del = await request(app).delete("/tasks/999").set(auth(token));
        expect(update.status).toBe(404);
        expect(del.status).toBe(404);
    });

    it("deletes a task", async () => {
        const { body: task } = await createTask();
        const del = await request(app).delete(`/tasks/${task.id}`).set(auth(token));
        expect(del.status).toBe(204);

        const list = await request(app).get("/tasks").set(auth(token));
        expect(list.body).toEqual([]);
    });
});

describe("users can only see and change their own tasks", () => {
    it("isolates tasks between users", async () => {
        const alice = await loginAs("alice");
        const bob = await loginAs("bobby");

        const { body: aliceTask } = await request(app)
            .post("/tasks")
            .set(auth(alice))
            .send({ title: "Alice's secret" });

        const bobList = await request(app).get("/tasks").set(auth(bob));
        expect(bobList.body).toEqual([]);

        const bobUpdate = await request(app)
            .put(`/tasks/${aliceTask.id}`)
            .set(auth(bob))
            .send({ title: "Hacked" });
        expect(bobUpdate.status).toBe(404);

        const bobDelete = await request(app).delete(`/tasks/${aliceTask.id}`).set(auth(bob));
        expect(bobDelete.status).toBe(404);

        const aliceList = await request(app).get("/tasks").set(auth(alice));
        expect(aliceList.body).toHaveLength(1);
        expect(aliceList.body[0].title).toBe("Alice's secret");
    });
});
