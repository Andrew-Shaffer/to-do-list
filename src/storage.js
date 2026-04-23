import { readFile, writeFile } from "fs/promises";
const FILE_PATH = "todos.json";
export async function loadTodos() {
    try {
        const raw = await readFile(FILE_PATH, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        // File doesn't exist yet — start with empty list
        return [];
    }
}
export async function saveTodos(todos) {
    const json = JSON.stringify(todos, null, 2);
    await writeFile(FILE_PATH, json, "utf-8");
}
//# sourceMappingURL=storage.js.map