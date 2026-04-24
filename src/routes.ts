import type { PrismaClient } from "../generated/client.js";
import { Priority } from "../generated/client.js";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
//import type { Todo } from "../generated/client.js";

export function createRouter(prisma: PrismaClient): FastifyPluginCallback {
  return (app: FastifyInstance, _opts, done) => {

  // GET /todos — return all todos
  app.get("/", async (_req, reply) => {
    try {
      const todos = await prisma.todo.findMany();
      return reply.send(todos);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      reply.status(500).send({ error: "Failed to fetch todos" });
    }
  });

  // GET a RANDOM todo
  app.get("/random", async (_req, reply) => {
    try {
      const todos = await prisma.todo.findMany();
      if (todos.length === 0) {
        reply.status(404).send({ error: "No todos to pick from" });
        return;
      }
      const randomIndex = Math.floor(Math.random() * todos.length);
      reply.send(todos[randomIndex]);
    } catch (error) {
      console.error("Failed to fetch random todo:", error);
      reply.status(500).send({ error: "Failed to fetch todos" });
    }
  });

  // GET /todos/:id — return one todo
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    try {
      const todo = await prisma.todo.findUnique({ where: { id } });
      if (!todo) { reply.status(404).send({ error: "Not found" }); return; }
      reply.send(todo);
    } catch (error) {
      console.error("Failed to fetch todo:", error);
      reply.status(500).send({ error: "Failed to fetch todo" });
    }
  });

  // POST /todos — create a new todo
  app.post<{ Body: { title: string; priority?: string; dueDate?: string } }>("/", async (req, reply) => {
    const { title, priority, dueDate } = req.body;
    
    if (!title || typeof title !== "string") {
      reply.status(400).send({ error: "title is required and must be a string" });
      return;
    }

    if (title.trim().length === 0) {
      reply.status(400).send({ error: "title cannot be blank" });
      return;
    }

    if (priority !== undefined && !(priority in Priority)) {
      reply.status(400).send({
        error: `priority must be one of: ${Object.keys(Priority).join(", ")}`,
      });
      return;
    }

    if (dueDate !== undefined && isNaN(Date.parse(dueDate)))
    {
      reply.status(400).send({ error: "dueDate must be a valid date string" });
      return;
    }

    try {
      const newTodo = await prisma.todo.create({
        data: {
          title: title.trim(),
          isDone: false,
          priority: priority as Priority ?? Priority.Medium,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });
      reply.status(201).send(newTodo);
    } catch (error) {
      console.error("Failed to create todo:", error);
      reply.status(500).send({ error: "Failed to create todo" });
    }
  });

  // PATCH /todos/:id/complete — mark done
  // prisma.todo.update throws a P2025 error if the id doesn't exist
  app.patch<{ Params: { id: string } }>("/:id/complete", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      reply.status(400).send({ error: "id number cannot be negative" });
      return;
    }

    try {
      const todo = await prisma.todo.update({
        where: { id },
        data: { isDone: true },
      });
      reply.send(todo);
    } catch (error: any) {
      if (error?.code === "P2025") {
        reply.status(404).send({ error: "Not found" });
      } else {
        console.error("Failed to mark todo as completed:", error);
        reply.status(500).send({ error: "Failed to update todo" });
      }
    }
  });

  // DELETE /todos/:id
  // prisma.todo.delete throws a P2025 error if the id doesn't exist
  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      reply.status(400).send({ error: "id number cannot be negative" });
      return;
    }

    try {
      await prisma.todo.delete({ where: { id } });
      reply.status(200).send({ deleted: id });
    } catch (error: any) {
      if (error?.code === "P2025") {
        reply.status(404).send({ error: "Not found" });
      } else {
        console.error("Failed to delete todo:", error);
        reply.status(500).send({ error: "Failed to delete todo" });
      }
    }
  });
  done();
  }
}