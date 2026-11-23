import { Request, Response } from "express";
import { requireUserId } from "../middleware/authenticate";
import { TaskModel, TaskUpdate } from "../models/Task";
import { parseId, validateDescription, validateTitle } from "../validation";

const normalizeDescription = (description: unknown): string | null =>
    typeof description === "string" && description.trim() ? description.trim() : null;

export const listTasks = async (req: Request, res: Response) => {
    const tasks = await TaskModel.findAllByUser(requireUserId(req));
    res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
    const { title, description } = req.body ?? {};
    const error = validateTitle(title) ?? validateDescription(description);
    if (error) return res.status(400).json({ message: error });

    const task = await TaskModel.create(requireUserId(req), title.trim(), normalizeDescription(description));
    return res.status(201).json(task);
};

export const updateTask = async (req: Request, res: Response) => {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: "Invalid task id" });

    const { title, description, isComplete } = req.body ?? {};
    const changes: TaskUpdate = {};

    if (title !== undefined) {
        const error = validateTitle(title);
        if (error) return res.status(400).json({ message: error });
        changes.title = title.trim();
    }
    if (description !== undefined) {
        const error = validateDescription(description);
        if (error) return res.status(400).json({ message: error });
        changes.description = normalizeDescription(description);
    }
    if (isComplete !== undefined) {
        if (typeof isComplete !== "boolean") {
            return res.status(400).json({ message: "isComplete must be true or false" });
        }
        changes.isComplete = isComplete;
    }
    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ message: "Provide at least one of title, description, isComplete" });
    }

    const task = await TaskModel.update(requireUserId(req), taskId, changes);
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: "Invalid task id" });

    const deleted = await TaskModel.delete(requireUserId(req), taskId);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    return res.status(204).send();
};
