import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Flame, Target, Trash2, LogOut, Calendar, Clock, ArrowLeft, History } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from './db';
import type { Todo } from './db';

const Auth: React.FC<{ onLogin: (userId: string) => void }> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (isRegister) {
        const existing = await db.users.where('username').equals(username).first();
        if (existing) {
          setError('Username already exists');
          return;
        }
        const id = crypto.randomUUID();
        await db.users.add({ id, username, password });
        onLogin(id);
      } else {
        const user = await db.users.where('username').equals(username).first();
        if (!user || user.password !== password) {
          setError('Invalid username or password');
          return;
        }
        onLogin(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '400px' }}>
      <header>
        <h1>re-marking</h1>
        <p style={{ color: 'var(--text-muted)' }}>Focus on what matters.</p>
      </header>

      <div className="glass-panel">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="input-group">
          {error && <p style={{ color: '#ef4444', textAlign: 'center', margin: 0 }}>{error}</p>}
          <div className="input-row">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-row">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="add-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
};

const TodoApp: React.FC<{ userId: string, onLogout: () => void }> = ({ userId, onLogout }) => {
  const [view, setView] = useState<'tasks' | 'history'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);

  const todos = useLiveQuery(() => db.todos.where('userId').equals(userId).reverse().sortBy('createdAt'), [userId]) || [];
  const stats = useLiveQuery(() => db.stats.get(userId), [userId]) || { userId, totalCompleted: 0, streak: 0, lastActiveDate: null };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

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
    }, 60000);
    return () => clearInterval(interval);
  }, [todos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      userId,
      text: newTaskText,
      completed: false,
      reminderAt: reminderDate ? reminderDate.toISOString() : null,
      createdAt: new Date().toISOString()
    };

    await db.todos.add(newTodo);
    setNewTaskText('');
    setReminderDate(null);
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
    const currentStats = await db.stats.get(userId) || { userId, totalCompleted: 0, streak: 0, lastActiveDate: null };
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
      userId,
      totalCompleted: currentStats.totalCompleted + 1,
      streak: newStreak,
      lastActiveDate: todayStr
    });
  };

  const renderTask = (todo: Todo) => (
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
  );

  return (
    <div className="app-container">
      <header style={{ position: 'relative' }}>
        <button 
          onClick={onLogout} 
          style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="Logout"
        >
          <LogOut size={24} />
        </button>
        {view === 'history' && (
          <button 
            onClick={() => setView('tasks')} 
            style={{ position: 'absolute', left: 0, top: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="Back to Tasks"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1>re-marking</h1>
        <p style={{ color: 'var(--text-muted)' }}>Focus on what matters.</p>
      </header>

      {view === 'tasks' && (
        <div className="stats-container" style={{ cursor: 'pointer' }} onClick={() => setView('history')} title="View History">
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
          <div className="stat-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <History color="var(--text-muted)" size={28} />
          </div>
        </div>
      )}

      <div className="glass-panel">
        {view === 'tasks' ? (
          <>
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
              <div className="input-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                  <DatePicker
                    selected={reminderDate}
                    onChange={(date: Date | null) => setReminderDate(date)}
                    dateFormat="MMM d, yyyy"
                    placeholderText="Add Date..."
                    isClearable
                    className="custom-datepicker"
                    customInput={
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.8rem 1rem', cursor: 'pointer' }}>
                        <Calendar size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                        <input 
                          value={reminderDate ? reminderDate.toLocaleDateString() : ''}
                          readOnly
                          placeholder="Date (Optional)" 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', cursor: 'pointer' }} 
                        />
                      </div>
                    }
                  />
                </div>
                {reminderDate && (
                  <div style={{ flex: 1, position: 'relative', minWidth: '120px' }}>
                    <DatePicker
                      selected={reminderDate}
                      onChange={(time: Date | null) => {
                        if (time && reminderDate) {
                          const newDate = new Date(reminderDate);
                          newDate.setHours(time.getHours());
                          newDate.setMinutes(time.getMinutes());
                          setReminderDate(newDate);
                        }
                      }}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="custom-datepicker"
                      customInput={
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.8rem 1rem', cursor: 'pointer' }}>
                          <Clock size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                          <input 
                            value={reminderDate ? reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            readOnly
                            placeholder="Time" 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', cursor: 'pointer' }} 
                          />
                        </div>
                      }
                    />
                  </div>
                )}
                <button type="submit" className="add-btn">Add</button>
              </div>
            </form>

            <div className="todo-list">
              {activeTodos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  All caught up! Nothing to do.
                </p>
              ) : (
                activeTodos.map(renderTask)
              )}
            </div>
          </>
        ) : (
          <div className="history-view">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <History /> Task History
            </h2>
            <div className="todo-list">
              {completedTodos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  No completed tasks yet.
                </p>
              ) : (
                completedTodos.map(renderTask)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('aura_auth_id');
  });

  const handleLogin = (id: string) => {
    localStorage.setItem('aura_auth_id', id);
    setCurrentUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('aura_auth_id');
    setCurrentUserId(null);
  };

  if (!currentUserId) {
    return <Auth onLogin={handleLogin} />;
  }

  return <TodoApp userId={currentUserId} onLogout={handleLogout} />;
};

export default App;
