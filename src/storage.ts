import { readFile, writeFile } from "fs/promises";
import type { Todo } from "./types.js";
/*
const FILE_PATH = "todos.json";

export async function loadTodos(): Promise<Todo[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as Todo[];
  } catch {
    // File doesn't exist yet — start with empty list
    return [];
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  const json = JSON.stringify(todos, null, 2);
  await writeFile(FILE_PATH, json, "utf-8");
}
*/