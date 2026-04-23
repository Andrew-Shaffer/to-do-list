import { Priority } from "./types.js"; // enum — exists at runtime
import { findById } from "./utils.js"; // function — exists at runtime
export class TodoList {
    todos = [];
    nextId = 1;
    name;
    constructor(name) {
        this.name = name;
    }
    get count() {
        return this.todos.length;
    }
    add(title, priority = Priority.Medium, dueDate) {
        const todo = {
            id: this.nextId++, title,
            isDone: false, priority,
            ...(dueDate !== undefined && { dueDate })
        };
        this.todos.push(todo);
        return todo;
    }
    complete(id) {
        const todo = findById(this.todos, id);
        if (!todo)
            return null;
        todo.isDone = true;
        return todo;
    }
    delete(id) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index === -1)
            return false;
        this.todos.splice(index, 1);
        return true;
    }
    list() {
        console.log(`\n${this.name} (${this.count} item${this.count !== 1 ? "s" : ""}):`);
        if (this.todos.length === 0) {
            console.log(" No todos!");
            return;
        }
        this.todos.forEach(todo => {
            const status = todo.isDone ? "✓" : "○";
            const due = todo.dueDate ? ` (due: ${todo.dueDate})` : "";
            const pri = Priority[todo.priority];
            console.log(` ${status} [${pri}] ${todo.title}${due}`);
        });
    }
    getTodos() {
        // Expose a copy so private todos stays protected
        return [...this.todos];
    }
    loadFromArray(todos) {
        this.todos = todos;
        this.nextId = todos.length > 0
            ? Math.max(...todos.map(t => Number(t.id))) + 1
            : 1;
    }
}
//# sourceMappingURL=todolist.js.map