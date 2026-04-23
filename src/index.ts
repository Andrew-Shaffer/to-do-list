import express from "express";
import { TodoList } from "./todolist.js";
import { loadTodos } from "./storage.js";
import { createRouter } from "./routes.js";

const PORT = 3000;

async function main(): Promise<void> {
  // 1. Load saved data
  const list = new TodoList("My Tasks");
  const saved = await loadTodos();
  list.loadFromArray(saved);
  console.log(`Loaded ${saved.length} todo(s) from disk.`);

  // 2. Create Express app
  const app = express();
  app.use(express.json());  // middleware: parse request bodies

  // 3. Mount routes at /todos
  app.use("/todos", createRouter(list));

  // 4. Start listening
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try: GET http://localhost:${PORT}/todos`);
  });
}

main().catch(console.error);