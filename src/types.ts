export enum Priority { High, Medium, Low }

export type ID = number | string;

export interface Todo {
  id: ID;
  title: string;
  isDone: boolean;
  priority: Priority;
  dueDate?: string;
}