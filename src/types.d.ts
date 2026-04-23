export declare enum Priority {
    High = 0,
    Medium = 1,
    Low = 2
}
export type ID = number | string;
export interface Todo {
    id: ID;
    title: string;
    isDone: boolean;
    priority: Priority;
    dueDate?: string;
}
//# sourceMappingURL=types.d.ts.map