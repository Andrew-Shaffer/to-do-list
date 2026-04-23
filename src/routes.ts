import { Router } from "express";
import type { Request, Response } from "express";
import type { PrismaClient } from "../generated/client.js";
import { Priority } from "../generated/client.js";

export function createRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /todos — return all todos
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const todos = await prisma.todo.findMany();
      res.json(todos);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // GET a RANDOM todo
  router.get("/random", async (_req: Request, res: Response) => {
    try {
      const todos = await prisma.todo.findMany();
      if (todos.length === 0) {
        res.status(404).json({ error: "No todos to pick from" });
        return;
      }
      const randomIndex = Math.floor(Math.random() * todos.length);
      res.json(todos[randomIndex]);
    } catch (error) {
      console.error("Failed to fetch random todo:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // GET /todos/:id — return one todo
  router.get("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    try {
      const todo = await prisma.todo.findUnique({ where: { id } });
      if (!todo) { res.status(404).json({ error: "Not found" }); return; }
      res.json(todo);
    } catch (error) {
      console.error("Failed to fetch todo:", error);
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  });

  // POST /todos — create a new todo
  router.post("/", async (req: Request, res: Response) => {
    const { title, priority, dueDate } = req.body;

    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required and must be a string" });
      return;
    }

    if (title.trim().length === 0) {
      res.status(400).json({ error: "title cannot be blank" });
      return;
    }

    if (priority !== undefined && !(priority in Priority)) {
      res.status(400).json({
        error: `priority must be one of: ${Object.keys(Priority).join(", ")}`,
      });
      return;
    }

    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
      res.status(400).json({ error: "dueDate must be a valid date string" });
      return;
    }

    try {
      const todo = await prisma.todo.create({
        data: {
          title: title.trim(),
          priority: priority ?? Priority.Medium,
          dueDate,
        },
      });
      res.status(201).json(todo);
    } catch (error) {
      console.error("Failed to create todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  // PATCH /todos/:id/complete — mark done
  // prisma.todo.update throws a P2025 error if the id doesn't exist
  router.patch("/:id/complete", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      res.status(400).json({ error: "id number cannot be negative" });
      return;
    }

    try {
      const todo = await prisma.todo.update({
        where: { id },
        data: { isDone: true },
      });
      res.json(todo);
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({ error: "Not found" });
      } else {
        console.error("Failed to mark todo as completed:", error);
        res.status(500).json({ error: "Failed to update todo" });
      }
    }
  });

  // DELETE /todos/:id
  // prisma.todo.delete throws a P2025 error if the id doesn't exist
  router.delete("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      res.status(400).json({ error: "id number cannot be negative" });
      return;
    }

    try {
      await prisma.todo.delete({ where: { id } });
      res.status(200).json({ deleted: id });
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({ error: "Not found" });
      } else {
        console.error("Failed to delete todo:", error);
        res.status(500).json({ error: "Failed to delete todo" });
      }
    }
  });

  return router;
}
