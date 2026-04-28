/*
import type { PrismaClient } from "../generated/client.js";
import { Priority } from "../generated/client.js";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import { sendSlackMessage, sendSlackBlock } from './services/slack.service.js';

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

  // GET a RANDOM INCOMPLETE todo
  app.get("/random", async (_req, reply) => {
    try {
      const todos = await prisma.todo.findMany();
      const sortedTodos = todos.filter(item => !item.isDone);
      if (sortedTodos.length === 0) {
        // Error 404: There are no to-dos on the sorted array to choose from
        reply.status(404).send({ error: "No incomplete todos to pick from" });
        return;
      }
      const randomIndex = Math.floor(Math.random() * sortedTodos.length);
      reply.send(sortedTodos[randomIndex]);
    } catch (error) {
      console.error("Failed to fetch random incomplete todo:", error);
      // Error 500: A to-do was NOT fetched
      reply.status(500).send({ error: "Failed to fetch todos" });
    }
  });

  // GET a 'Reminisce' item, a RANDOM ALREADY COMPLETED todo
  app.get("/reminisce", async (_req, reply) => {
    try {
      const todos = await prisma.todo.findMany();
      const sortedTodos = todos.filter(item => item.isDone);
      if (sortedTodos.length === 0) {
        // Error 404: There are no to-dos in the sorted array to choose from
        reply.status(404).send({ error: "No completed todos to pick from" });
        return;
      }
      const randomIndex = Math.floor(Math.random() * sortedTodos.length);
      reply.send(sortedTodos[randomIndex]);
    } catch (error) {
      console.error("Failed to fetch random completed todo:", error);
      // Error 500: A to-do was NOT fetched
      reply.status(500).send({ error: "Failed to fetch todos" });
    }
  });

  // GET /todos/:id — return one todo
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      // Error 400: The supplied ID number is not a number
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    try {
      const todo = await prisma.todo.findUnique({ where: { id } });
      // Error 404: There is no to-do with that ID number
      if (!todo) { reply.status(404).send({ error: "Not found" }); return; }
      reply.send(todo);
    } catch (error) {
      console.error("Failed to fetch todo:", error);
      // Error 500: A to-do was NOT fetched
      reply.status(500).send({ error: "Failed to fetch todo" });
    }
  });

  // POST /todos — create a new todo
  app.post<{ Body: { title: string; priority?: string; dueDate?: string } }>("/", async (req, reply) => {
    const { title, priority, dueDate } = req.body;
    
    if (!title || typeof title !== "string") {
      //Error 400: Title was either not received or it is not a string
      reply.status(400).send({ error: "title is required and must be a string" });
      return;
    }

    if (title.trim().length === 0) {
      //Error 400: Title is an empty string
      reply.status(400).send({ error: "title cannot be blank" });
      return;
    }

    if (priority !== undefined && !(priority in Priority)) {
      // Error 400: Priority is not one of the predefined priorities
      reply.status(400).send({
        error: `priority must be one of: ${Object.keys(Priority).join(", ")}`,
      });
      return;
    }

    if (dueDate !== undefined && isNaN(Date.parse(dueDate)))
    {
      //Error 400: The date is not in a valid data format
      reply.status(400).send({ error: "dueDate must be a valid date string" });
      return;
    }

    try {
      // Attempt to create a new to-do in the database
      const newTodo = await prisma.todo.create({
        data: {
          title: title.trim(),
          isDone: false,
          priority: priority as Priority ?? Priority.Medium,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });
      // Send a message to slack
      const dueDateStr = newTodo.dueDate
        ? ` (due ${newTodo.dueDate.toDateString()})`
        : '';
      sendSlackMessage(`New todo created: "${newTodo.title}"${dueDateStr}`).catch(console.error);
      reply.status(201).send(newTodo);
    } catch (error) {
      //Error 500: To-do not created
      console.error("Failed to create todo:", error);
      reply.status(500).send({ error: "Failed to create todo" });
    }
  });

  // PATCH /todos/:id/complete — mark done
  // prisma.todo.update throws a P2025 error if the id doesn't exist
  app.patch<{ Params: { id: string } }>("/:id/complete", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      //Error 400: id number is not a number
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      //Error 400: id number is a negative number
      reply.status(400).send({ error: "id number cannot be negative" });
      return;
    }

    try {
      //attempt to mark the to-do at the specified ID number as completed
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
        // Error 500: A to-do was NOT Updated
        reply.status(500).send({ error: "Failed to update todo" });
      }
    }
  });

  // DELETE /todos/:id
  // prisma.todo.delete throws a P2025 error if the id doesn't exist
  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      //Error 400: id number is not a number
      reply.status(400).send({ error: "id must be a number" });
      return;
    }
    if (id < 0) {
      //Error 400: id number is a negative number
      reply.status(400).send({ error: "id number cannot be negative" });
      return;
    }

    try {
      await prisma.todo.delete({ where: { id } });
      reply.status(200).send({ deleted: id });
    } catch (error: any) {
      if (error?.code === "P2025") {
        // Error 404: To-do with the specified ID not found
        reply.status(404).send({ error: "Not found" });
      } else {
        console.error("Failed to delete todo:", error);
        // Error 500: A to-do was NOT deleted
        reply.status(500).send({ error: "Failed to delete todo" });
      }
    }
  });
  done();
  }
}

*/