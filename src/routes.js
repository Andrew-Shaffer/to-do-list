import { Router } from "express";
import { TodoList } from "./todolist.js";
import { Priority } from "./types.js";
import { saveTodos } from "./storage.js";
export function createRouter(list) {
    const router = Router();
    // GET /todos — return all todos
    router.get("/", (_req, res) => {
        res.json(list.getTodos());
    });
    // GET a RANDOM todo
    router.get("/random", (_req, res) => {
        const todos = list.getTodos();
        if (todos.length === 0) {
            res.status(404).json({ error: "No todos to pick from" });
            return;
        }
        const randomIndex = Math.floor(Math.random() * todos.length);
        res.json(todos[randomIndex]);
    });
    // GET /todos/:id — return one todo
    router.get("/:id", (req, res) => {
        const id = Number(req.params.id);
        const todo = list.getTodos().find(t => t.id === id);
        if (!todo) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(todo);
    });
    // POST /todos — create a new todo
    router.post("/", async (req, res) => {
        const { title, priority, dueDate } = req.body;
        if (!title) {
            res.status(400).json({ error: "title is required" });
            return;
        }
        const todo = list.add(title, priority ?? Priority.Medium, dueDate);
        await saveTodos(list.getTodos());
        res.status(201).json(todo);
    });
    // PATCH /todos/:id/complete — mark done
    router.patch("/:id/complete", async (req, res) => {
        const id = Number(req.params.id);
        const todo = list.complete(id);
        if (!todo) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        await saveTodos(list.getTodos());
        res.json(todo);
    });
    // DELETE /todos/:id
    router.delete("/:id", async (req, res) => {
        const id = Number(req.params.id);
        const ok = list.delete(id);
        if (!ok) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        await saveTodos(list.getTodos());
        res.status(200).json({ deleted: id });
    });
    return router;
}
//# sourceMappingURL=routes.js.map