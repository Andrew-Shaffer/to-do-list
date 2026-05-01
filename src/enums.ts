export const PRIORITIES = ["High", "Medium", "Low"] as const;
// Derive TypeScript types from the arrays
export type Priority = typeof PRIORITIES[number];