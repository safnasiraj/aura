import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface User {
  id: string;
  username: string;
  password?: string;
}

export interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  reminderAt: string | null;
  createdAt: string;
  completedAt: string | null;
  category?: 'Work' | 'Personal' | 'Fitness' | 'Urgent';
}

export interface UserStats {
  userId: string; // One row per user
  totalCompleted: number;
  streak: number;
  lastActiveDate: string | null;
}

export class AuraDatabase extends Dexie {
  users!: Table<User>;
  todos!: Table<Todo>;
  stats!: Table<UserStats>;

  constructor() {
    super('AuraDatabase');
    this.version(2).stores({
      users: 'id, username',
      todos: 'id, userId, createdAt, completed',
      stats: 'userId',
    });
  }
}

export const db = new AuraDatabase();
