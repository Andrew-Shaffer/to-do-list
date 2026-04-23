import type { ID } from "./types.js";

export function findById<T extends { id: ID }>(
  items: T[],
  id: ID
): T | null {
  return items.find(item => item.id === id) ?? null;
}