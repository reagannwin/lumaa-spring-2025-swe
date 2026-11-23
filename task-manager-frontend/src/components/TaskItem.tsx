import { FormEvent, useState } from "react";
import type { Task, TaskChanges } from "../types";

interface TaskItemProps {
    task: Task;
    onUpdate: (id: number, changes: TaskChanges) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const TaskItem = ({ task, onUpdate, onDelete }: TaskItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? "");

    const run = async (action: () => Promise<void>) => {
        setIsBusy(true);
        try {
            await action();
        } catch {
            // The parent already shows the error; stay in the current state.
        } finally {
            setIsBusy(false);
        }
    };

    const startEditing = () => {
        setTitle(task.title);
        setDescription(task.description ?? "");
        setIsEditing(true);
    };

    const saveEdit = (e: FormEvent) => {
        e.preventDefault();
        run(async () => {
            await onUpdate(task.id, { title: title.trim(), description: description.trim() });
            setIsEditing(false);
        });
    };

    if (isEditing) {
        return (
            <li className="task editing">
                <form onSubmit={saveEdit} className="stack">
                    <input
                        aria-label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={255}
                        required
                        autoFocus
                    />
                    <textarea
                        aria-label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={2000}
                        rows={2}
                    />
                    <div className="row">
                        <button type="submit" className="primary" disabled={isBusy || !title.trim()}>
                            Save
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} disabled={isBusy}>
                            Cancel
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className={`task${task.isComplete ? " complete" : ""}`}>
            <label className="task-main">
                <input
                    type="checkbox"
                    checked={task.isComplete}
                    disabled={isBusy}
                    onChange={() => run(() => onUpdate(task.id, { isComplete: !task.isComplete }))}
                    aria-label={task.isComplete ? "Mark incomplete" : "Mark complete"}
                />
                <span>
                    <span className="task-title">{task.title}</span>
                    {task.description && <span className="task-description">{task.description}</span>}
                </span>
            </label>
            <div className="row">
                <button type="button" onClick={startEditing} disabled={isBusy}>
                    Edit
                </button>
                <button
                    type="button"
                    className="danger"
                    disabled={isBusy}
                    onClick={() => run(() => onDelete(task.id))}
                >
                    Delete
                </button>
            </div>
        </li>
    );
};

export default TaskItem;
