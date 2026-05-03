import Dexie, { Table } from 'dexie';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  reminderAt: string | null;
  createdAt: string;
}

export interface UserStats {
  id: number; // Single row for stats
  totalCompleted: number;
  streak: number;
  lastActiveDate: string | null;
}

export class AuraDatabase extends Dexie {
  todos!: Table<Todo>;
  stats!: Table<UserStats>;

  constructor() {
    super('AuraDatabase');
    this.version(1).stores({
      todos: 'id, createdAt, completed', // Indexed fields
      stats: 'id'
    });
  }
}

export const db = new AuraDatabase();
