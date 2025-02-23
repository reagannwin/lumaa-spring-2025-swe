import React, { useEffect, useState } from "react";
import api from "../services/api";
import { isAuthenticated } from "../utils/auth";
import { useNavigate } from "react-router-dom";


interface Task {
    id: number;
    title: string;
    description: string;
    isComplete: boolean;
}

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login");
        } else {
            fetchTasks();
        }
    }, [navigate]);

    // Fetch all tasks
    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");
            setTasks(response.data);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        }
    };

    // Create a new task
    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post("/tasks", {
                title: newTaskTitle,
                description: newTaskDescription,
            });
            setTasks([...tasks, response.data]);
            setNewTaskTitle("");
            setNewTaskDescription("");
        } catch (err) {
            console.error("Failed to create task", err);
        }
    };

    // Mark a task as complete/incomplete
    const toggleComplete = async (id: number, isComplete: boolean) => {
        try {
            const response = await api.put(`/tasks/${id}`, { isComplete: !isComplete });
            setTasks(tasks.map((task) => (task.id === id ? response.data : task)));
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    // Delete a task
    const deleteTask = async (id: number) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter((task) => task.id !== id));
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    return (
        <div>
            <h2>Tasks</h2>

            {/* Form to create a new task */}
            <form onSubmit={createTask}>
                <input
                    type="text"
                    placeholder="Title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <button type="submit">Add Task</button>
            </form>

            {/* List of tasks */}
            <ul>
                {tasks.map((task) => (
                    <li key={task.id}>
                        <h3 style={{ textDecoration: task.isComplete ? "line-through" : "none" }}>
                            {task.title}
                        </h3>
                        <p>{task.description}</p>
                        <button onClick={() => toggleComplete(task.id, task.isComplete)}>
                            {task.isComplete ? "Mark Incomplete" : "Mark Complete"}
                        </button>
                        <button onClick={() => deleteTask(task.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Tasks;