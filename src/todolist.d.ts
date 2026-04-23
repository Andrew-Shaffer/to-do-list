import type { Todo, ID } from "./types.js";
import { Priority } from "./types.js";
export declare class TodoList {
    private todos;
    private nextId;
    readonly name: string;
    constructor(name: string);
    get count(): number;
    add(title: string, priority?: Priority, dueDate?: string): Todo;
    complete(id: ID): Todo | null;
    delete(id: ID): boolean;
    list(): void;
    getTodos(): Todo[];
    loadFromArray(todos: Todo[]): void;
}
//# sourceMappingURL=todolist.d.ts.map