import { FormEvent, useCallback, useEffect, useState } from "react";
import { getErrorMessage, tasksApi } from "../api";
import type { Task, TaskChanges } from "../types";
import TaskItem from "./TaskItem";

const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            setTasks(await tasksApi.list());
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't load your tasks"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const createTask = async (e: FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError("");
        try {
            const task = await tasksApi.create(newTitle.trim(), newDescription.trim());
            setTasks((current) => [...current, task]);
            setNewTitle("");
            setNewDescription("");
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't create the task"));
        } finally {
            setIsCreating(false);
        }
    };

    const updateTask = async (id: number, changes: TaskChanges) => {
        setError("");
        try {
            const updated = await tasksApi.update(id, changes);
            setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't update the task"));
            throw err;
        }
    };

    const deleteTask = async (id: number) => {
        setError("");
        try {
            await tasksApi.remove(id);
            setTasks((current) => current.filter((task) => task.id !== id));
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't delete the task"));
        }
    };

    const remaining = tasks.filter((task) => !task.isComplete).length;

    return (
        <section className="card">
            <h1>Your tasks</h1>

            <form onSubmit={createTask} className="stack new-task">
                <input
                    aria-label="New task title"
                    placeholder="What needs doing?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    maxLength={255}
                    required
                />
                <textarea
                    aria-label="New task description"
                    placeholder="Details (optional)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    maxLength={2000}
                    rows={2}
                />
                <button type="submit" className="primary" disabled={isCreating || !newTitle.trim()}>
                    {isCreating ? "Adding..." : "Add task"}
                </button>
            </form>

            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}

            {isLoading ? (
                <p className="muted">Loading...</p>
            ) : tasks.length === 0 ? (
                <p className="muted">No tasks yet. Add your first one above.</p>
            ) : (
                <>
                    <p className="muted">
                        {remaining} of {tasks.length} remaining
                    </p>
                    <ul className="task-list">
                        {tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onUpdate={updateTask}
                                onDelete={deleteTask}
                            />
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
};

export default Tasks;
