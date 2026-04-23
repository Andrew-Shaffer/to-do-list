import { Router } from "express";
import type { Request, Response } from "express";
import { TodoList } from "./todolist.js";
import { Priority } from "./types.js";
import { saveTodos } from "./storage.js";

export function createRouter(list: TodoList): Router {
  const router = Router();

  // GET /todos — return all todos
  router.get("/", (_req: Request, res: Response) => {
    res.json(list.getTodos());
  });

  // GET a RANDOM todo
  router.get("/random", (_req: Request, res: Response) => {
    const todos = list.getTodos();
    if (todos.length === 0) {
      res.status(404).json({ error: "No todos to pick from" });
    }
    const randomIndex = Math.floor(Math.random() * todos.length);
    res.json(todos[randomIndex]);
  });

  // GET /todos/:id — return one todo
  router.get("/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const todo = list.getTodos().find(t => t.id === id);
    if (!todo) { res.status(404).json({ error: "Not found" }); return; }
    res.json(todo);
  });

  // POST /todos — create a new todo
  router.post("/", async (req: Request, res: Response) => {
    const { title, priority, dueDate } = req.body;
    // add a try/catch block for error handling
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    const todo = list.add(title, priority ?? Priority.Medium, dueDate);
    await saveTodos(list.getTodos());
    res.status(201).json(todo);
  });

  // PATCH /todos/:id/complete — mark done
  router.patch("/:id/complete", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const todo = list.complete(id);
    if (!todo) { res.status(404).json({ error: "Not found" }); return; }
    await saveTodos(list.getTodos());
    res.json(todo);
  });

  // DELETE /todos/:id
  router.delete("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ok = list.delete(id);
    if (!ok) { res.status(404).json({ error: "Not found" }); return; }
    await saveTodos(list.getTodos());
    res.status(200).json({ deleted: id });
  });

  return router;
}