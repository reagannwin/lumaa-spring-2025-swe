export interface Task {
    id: number;
    title: string;
    description: string | null;
    isComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TaskChanges {
    title?: string;
    description?: string;
    isComplete?: boolean;
}
