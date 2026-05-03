import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Flame, Target, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Todo, UserStats } from './db';

const App: React.FC = () => {
  // Fetch real-time data from IndexedDB
  const todos = useLiveQuery(() => db.todos.orderBy('createdAt').reverse().toArray()) || [];
  const stats = useLiveQuery(() => db.stats.get(1)) || { id: 1, totalCompleted: 0, streak: 0, lastActiveDate: null };

  const [newTaskText, setNewTaskText] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Check streaks and reset if missed a day
  useEffect(() => {
    const checkStreak = async () => {
      if (stats.lastActiveDate) {
        const today = new Date().toDateString();
        const lastDate = new Date(stats.lastActiveDate);
        const diffTime = Math.abs(new Date(today).getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1 && stats.streak > 0) {
          await db.stats.put({ ...stats, streak: 0 });
        }
      }
    };
    checkStreak();
  }, [stats.lastActiveDate, stats.streak]);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Reminder Checker
  const notifiedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach(todo => {
        if (!todo.completed && todo.reminderAt && !notifiedReminders.current.has(todo.id)) {
          const reminderTime = new Date(todo.reminderAt);
          if (now >= reminderTime) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: `It's time to: ${todo.text}`,
                icon: '/vite.svg'
              });
            }
            notifiedReminders.current.add(todo.id);
          }
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todos]);

  // DB Operations
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: newTaskText,
      completed: false,
      reminderAt: reminderTime || null,
      createdAt: new Date().toISOString()
    };

    await db.todos.add(newTodo);
    setNewTaskText('');
    setReminderTime('');
  };

  const toggleTodo = async (id: string) => {
    const todo = await db.todos.get(id);
    if (!todo) return;

    const isCompleting = !todo.completed;
    await db.todos.update(id, { completed: isCompleting });

    if (isCompleting) {
      await updateStatsOnCompletion();
    }
  };

  const deleteTodo = async (id: string) => {
    await db.todos.delete(id);
  };

  const updateStatsOnCompletion = async () => {
    const currentStats = await db.stats.get(1) || { id: 1, totalCompleted: 0, streak: 0, lastActiveDate: null };
    const todayStr = new Date().toDateString();
    let newStreak = currentStats.streak;

    if (currentStats.lastActiveDate !== todayStr) {
      if (!currentStats.lastActiveDate) {
        newStreak = 1;
      } else {
        const lastDate = new Date(currentStats.lastActiveDate);
        const diffTime = Math.abs(new Date(todayStr).getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    await db.stats.put({
      id: 1,
      totalCompleted: currentStats.totalCompleted + 1,
      streak: newStreak,
      lastActiveDate: todayStr
    });
  };

  return (
    <div className="app-container">
      <header>
        <h1>Aura Tasks</h1>
        <p style={{ color: 'var(--text-muted)' }}>Focus on what matters.</p>
      </header>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">
            <Flame color="var(--secondary)" />
            {stats.streak}
          </div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            <Target color="var(--success)" />
            {stats.totalCompleted}
          </div>
          <div className="stat-label">Tasks Done</div>
        </div>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleAddTodo} className="input-group">
          <div className="input-row">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              required
            />
          </div>
          <div className="input-row">
            <input
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              title="Set a reminder"
            />
            <button type="submit" className="add-btn">Add Task</button>
          </div>
        </form>

        <div className="todo-list">
          {todos.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
              No tasks yet. Start your journey!
            </p>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-content" onClick={() => toggleTodo(todo.id)}>
                  <div className="todo-checkbox">
                    {todo.completed ? (
                      <CheckCircle2 size={24} color="var(--primary)" />
                    ) : (
                      <Circle size={24} color="var(--text-muted)" />
                    )}
                  </div>
                  <div className="todo-info">
                    <span className="todo-text">{todo.text}</span>
                    {todo.reminderAt && !todo.completed && (
                      <span className="todo-reminder">
                        <Bell size={14} />
                        {new Date(todo.reminderAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                  title="Delete Task"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
