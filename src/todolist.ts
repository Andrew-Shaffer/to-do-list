import type { Todo, ID } from "./types.js";
import { Priority } from "./types.js";  // enum — exists at runtime
import { findById } from "./utils.js";  // function — exists at runtime

export class TodoList {
  private todos: Todo[] = [];
  private nextId: number = 1;
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  get count(): number {
    return this.todos.length;
  }

  public add(
    title: string,
    priority: Priority = Priority.Medium,
    dueDate?: string
  ): Todo {
    const todo: Todo = {
      id: this.nextId++, title,
      isDone: false, priority,
      ...(dueDate !== undefined && { dueDate })
    };
    this.todos.push(todo);
    return todo;
  }

  public complete(id: ID): Todo | null {
    const todo = findById(this.todos, id);
    if (!todo) return null;
    todo.isDone = true;
    return todo;
  }

  public delete(id: ID): boolean {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.todos.splice(index, 1);
    return true;
  }

  public list(): void {
    console.log(`\n${this.name} (${this.count} item${this.count !== 1 ? "s" : ""}):`);
    if (this.todos.length === 0) { console.log(" No todos!"); return; }
    this.todos.forEach(todo => {
      const status = todo.isDone ? "✓" : "○";
      const due = todo.dueDate ? ` (due: ${todo.dueDate})` : "";
      const pri = Priority[todo.priority];
      console.log(` ${status} [${pri}] ${todo.title}${due}`);
    });
  }

  public getTodos(): Todo[] {
  // Expose a copy so private todos stays protected
  return [...this.todos];
  }

  public loadFromArray(todos: Todo[]): void {
    this.todos = todos;
    this.nextId = todos.length > 0
      ? Math.max(...todos.map(t => Number(t.id))) + 1
      : 1;
  }
}