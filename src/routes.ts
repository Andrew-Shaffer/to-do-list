import { Router } from "express";
import type { Request, Response } from "express";
import { TodoList } from "./todolist.js";
import { Priority } from "./types.js";
import { saveTodos } from "./storage.js";
//import { NetworkResources } from "inspector/promises";

export function createRouter(list: TodoList): Router {
  const router = Router();
  
  // GET /todos — return all todos
  router.get("/", (_req: Request, res: Response) => {
    res.json(list.getTodos());
  });

  // GET a RANDOM todo
  router.get("/random", (req: Request, res: Response) => {
    try{
      const todos = list.getTodos();
      if (todos.length === 0) {
        res.status(404).json({ error: "No todos to pick from" });
        return;
      }
      const randomIndex = Math.floor(Math.random() * todos.length);
      res.json(todos[randomIndex]);
    } 
    catch(error)
    {
        if(error instanceof Error){
          console.log(error);
        }
    } 
    finally{
      console.log("Done");
    }
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
        error: `priority must be one of: ${Object.keys(Priority).join(", ")}` 
      });
      return;
    }

    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
      res.status(400).json({ error: "dueDate must be a valid date string" });
      return;
    }
    // try/catch block for error handling
    try {
      const todo = list.add(title.trim(), priority ?? Priority.Medium, dueDate);
      await saveTodos(list.getTodos());
      res.status(201).json(todo);
    } catch (error) {
      // list.add() is unlikely to throw, but saveTodos() touches
      // the file system and can fail
      console.error("Failed to save todo:", error);
      res.status(500).json({ error: "Todo was created but could not be saved" });
    }
    finally{
      console.log("Post request has finished");
    }
  });

  // PATCH /todos/:id/complete — mark done
  router.patch("/:id/complete", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if(isNaN(id)){
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    else if(id < 0){
      res.status(400).json({error: "id number cannot be negative"})
      return;
    }

    const todo = list.complete(id);
    if (!todo) { 
      res.status(404).json({ error: "Not found" }); 
      return; 
    }

    try{
      await saveTodos(list.getTodos());
      res.json(todo);
    }
    catch(error){
      console.error("Failed to mark todo as completed:", error);
      res.status(500).json({ error: "Todo exists but could not be changed" });
    }
    finally{
      console.log("Patch to mark complete request has finished");
    }
  });

  // DELETE /todos/:id
  router.delete("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if(isNaN(id)){
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    else if(id < 0){
      res.status(400).json({error: "id number cannot be negative"})
      return;
    }

    try{
    const ok = list.delete(id);
    if (!ok) { res.status(404).json({ error: "Not found" }); return; }
    await saveTodos(list.getTodos());
    res.status(200).json({ deleted: id });
    }
    catch(error){
      console.error("Failed to delete todo: ", error);
      res.status(500).json({ error: "Todo not deleted" });
    }
    finally{
      console.log(`Delete attempted for id: ${id} has completed`);
    }
  });

  return router;
}