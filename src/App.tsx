import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Flame, Target, Trash2, LogOut, Calendar, Clock, ArrowLeft, History, Plus } from 'lucide-react';
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

const ActiveTaskList: React.FC<{ todos: Todo[], renderTask: (todo: Todo) => React.ReactNode }> = ({ todos, renderTask }) => {
  const grouped: Record<string, Todo[]> = {};

  todos.forEach(todo => {
    let dateStr = "No Date";
    if (todo.reminderAt) {
      const d = new Date(todo.reminderAt); 
      dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(todo);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    if (a === "No Date") return -1;
    if (b === "No Date") return 1;
    
    if (a === todayStr) return -1;
    if (b === todayStr) return 1;

    if (a === tomorrowStr) return -1;
    if (b === tomorrowStr) return 1;

    // For the rest, we need to know if they are past or future
    const timeA = new Date(a).getTime();
    const timeB = new Date(b).getTime();
    const todayTime = new Date(todayStr).getTime();

    const isPastA = timeA < todayTime;
    const isPastB = timeB < todayTime;

    if (isPastA && !isPastB) return -1; // Past comes before Future (day after tomorrow)
    if (!isPastA && isPastB) return 1;

    return timeA - timeB; 
  });

  return (
    <div className="history-timeline">
      {sortedKeys.map(dateStr => (
        <div key={dateStr} className="timeline-group" style={{ marginBottom: '1.5rem' }}>
          <div className="timeline-header" style={{ 
            color: 'var(--text-main)', 
            fontWeight: '600', 
            fontSize: '1rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', 
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{dateStr}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
              {grouped[dateStr].length} {grouped[dateStr].length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <div className="timeline-tasks" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grouped[dateStr].map(renderTask)}
          </div>
        </div>
      ))}
    </div>
  );
};

const TaskHistoryList: React.FC<{ todos: Todo[], renderTask: (todo: Todo) => React.ReactNode }> = ({ todos, renderTask }) => {
  if (todos.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>No completed tasks yet.</p>;
  }

  const grouped: Record<string, Todo[]> = {};

  todos.forEach(todo => {
    const d = new Date(todo.createdAt); 
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(todo);
  });

  return (
    <div className="history-timeline">
      {Object.keys(grouped).map(dateStr => (
        <div key={dateStr} className="timeline-group" style={{ marginBottom: '1.5rem' }}>
          <div className="timeline-header" style={{ 
            color: 'var(--text-main)', 
            fontWeight: '600', 
            fontSize: '1rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', 
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{dateStr}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
              {grouped[dateStr].length} {grouped[dateStr].length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <div className="timeline-tasks" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grouped[dateStr].map(renderTask)}
          </div>
        </div>
      ))}
    </div>
  );
};

const TodoApp: React.FC<{ userId: string, onLogout: () => void }> = ({ userId, onLogout }) => {
  const [view, setView] = useState<'tasks' | 'history'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [confirmTask, setConfirmTask] = useState<string | null>(null);
  const [lateConfirmTask, setLateConfirmTask] = useState<string | null>(null);
  const [manualCompletionDate, setManualCompletionDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const todos = useLiveQuery(() => db.todos.where('userId').equals(userId).reverse().sortBy('createdAt'), [userId]) || [];
  const stats = useLiveQuery(() => db.stats.get(userId), [userId]) || { userId, totalCompleted: 0, streak: 0, lastActiveDate: null };

  const activeTodos = [...todos.filter(t => !t.completed)].sort((a, b) => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const getPriority = (todo: any) => {
      if (!todo.reminderAt) return 1; // No date
      
      const todoDate = new Date(todo.reminderAt);
      const todoDateStr = todoDate.toDateString();
      
      if (todoDateStr === todayStr) return 2; // Today
      
      // If not today, check if it's past or future
      if (todoDate < now) return 3; // Yet to close (Past)
      return 4; // Future
    };

    const pA = getPriority(a);
    const pB = getPriority(b);

    if (pA !== pB) return pA - pB;
    
    // Within the same group, sort by time/date
    if (a.reminderAt && b.reminderAt) {
      return new Date(a.reminderAt).getTime() - new Date(b.reminderAt).getTime();
    }
    // For no-date tasks, sort by creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
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

    if (isRange && reminderDate && endDate) {
      const start = new Date(reminderDate);
      const end = new Date(endDate);
      const tasks = [];
      
      let current = new Date(start);
      while (current <= end) {
        tasks.push({
          id: crypto.randomUUID(),
          userId,
          text: newTaskText,
          completed: false,
          reminderAt: current.toISOString(),
          createdAt: new Date().toISOString(),
          completedAt: null
        });
        current.setDate(current.getDate() + 1);
      }
      
      await db.todos.bulkAdd(tasks);
    } else {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        userId,
        text: newTaskText,
        completed: false,
        reminderAt: reminderDate ? reminderDate.toISOString() : null,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      await db.todos.add(newTodo);
    }

    setNewTaskText('');
    setReminderDate(null);
    setEndDate(null);
    setIsRange(false);
  };

  const toggleTodo = async (id: string) => {
    const todo = await db.todos.get(id);
    if (!todo) return;

    if (!todo.completed && todo.reminderAt) {
      const reminderDate = new Date(todo.reminderAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reminderDay = new Date(reminderDate);
      reminderDay.setHours(0, 0, 0, 0);

      if (reminderDay > today) {
        setConfirmTask(id);
        return;
      }

      if (reminderDay < today) {
        setLateConfirmTask(id);
        setManualCompletionDate(new Date());
        return;
      }
    }

    const isCompleting = !todo.completed;
    await db.todos.update(id, { 
      completed: isCompleting,
      completedAt: isCompleting ? new Date().toISOString() : null
    });

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
      <div className="todo-content">
        <button 
          className="todo-checkbox" 
          onClick={() => toggleTodo(todo.id)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={todo.completed ? "Mark as pending" : "Mark as done"}
        >
          {todo.completed ? (
            <CheckCircle2 size={24} color="var(--primary)" />
          ) : (
            <Circle size={24} color="var(--text-muted)" />
          )}
        </button>
        <div className="todo-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="todo-text">{todo.text}</span>
            {todo.completed && todo.reminderAt && todo.completedAt && (() => {
              const r = new Date(todo.reminderAt);
              const c = new Date(todo.completedAt);
              r.setHours(0,0,0,0);
              c.setHours(0,0,0,0);
              
              if (c < r) {
                return (
                  <span title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString()}`} style={{ 
                    fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', 
                    background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.2)', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.02em'
                  }}>
                    ✨ Excellent! Early
                  </span>
                );
              } else if (c > r) {
                return (
                  <span title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString()}. You can do better!`} style={{ 
                    fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', 
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.02em'
                  }}>
                    ⏳ Late - Aim Higher
                  </span>
                );
              }
              return null;
            })()}
          </div>
          {todo.reminderAt && !todo.completed && (
            <span className="todo-reminder">
              <Bell size={14} />
              {new Date(todo.reminderAt).toLocaleString()}
            </span>
          )}
          {todo.completed && todo.completedAt && (
             <span className="todo-reminder" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
               Done: {new Date(todo.completedAt).toLocaleString()}
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
      <header style={{ position: 'relative', paddingBottom: '1rem' }}>
        <button 
          onClick={onLogout} 
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border)', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          className="icon-hover-btn"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
        {view === 'history' && (
          <button 
            onClick={() => setView('tasks')} 
            style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.75rem',
              zIndex: 10
            }}
            title="Back to Tasks"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <img src="./logo.png" alt="Aura Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', boxShadow: '0 0 15px var(--secondary-glow)' }} />
          <h1 style={{ margin: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>Aura</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Focus on what matters.</p>
      </header>

      {view === 'tasks' && (
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-label">Day Streak</div>
            <div className="stat-value">
              <Flame size={28} color="var(--secondary)" fill="var(--secondary)" style={{ opacity: 0.8 }} />
              {stats.streak}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Done</div>
            <div className="stat-value">
              <Target size={28} color="var(--success)" style={{ opacity: 0.8 }} />
              {stats.totalCompleted}
            </div>
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
                <button 
                  type="button"
                  onClick={() => setIsRange(!isRange)}
                  className={`range-toggle ${isRange ? 'active' : ''}`}
                  title="Add task for a range of dates"
                >
                  <Calendar size={16} /> {isRange ? 'Range Mode' : 'Add Range'}
                </button>
              </div>
              <div className="input-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                  <DatePicker
                    selected={reminderDate}
                    onChange={(date: Date | null) => setReminderDate(date)}
                    selectsStart
                    startDate={reminderDate}
                    endDate={endDate}
                    dateFormat="MMM d, yyyy"
                    placeholderText={isRange ? "Start Date" : "Add Date..."}
                    isClearable
                    className="custom-datepicker"
                    customInput={
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.8rem 1rem', cursor: 'pointer' }}>
                        <Calendar size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                        <input 
                          value={reminderDate ? reminderDate.toLocaleDateString() : ''}
                          readOnly
                          placeholder={isRange ? "Start Date" : "Date (Optional)"} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', cursor: 'pointer' }} 
                        />
                      </div>
                    }
                  />
                </div>

                {isRange && (
                  <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date)}
                      selectsEnd
                      startDate={reminderDate}
                      endDate={endDate}
                      minDate={reminderDate || undefined}
                      dateFormat="MMM d, yyyy"
                      placeholderText="End Date"
                      isClearable
                      className="custom-datepicker"
                      customInput={
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.8rem 1rem', cursor: 'pointer' }}>
                          <Calendar size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                          <input 
                            value={endDate ? endDate.toLocaleDateString() : ''}
                            readOnly
                            placeholder="End Date" 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', cursor: 'pointer' }} 
                          />
                        </div>
                      }
                    />
                  </div>
                )}

                {reminderDate && !isRange && (
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
                <button type="submit" className="add-btn">
                  <Plus size={20} strokeWidth={3} /> Add
                </button>
              </div>
            </form>

            <div className="todo-list">
              {activeTodos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  All caught up! Nothing to do.
                </p>
              ) : (
                <ActiveTaskList todos={activeTodos} renderTask={renderTask} />
              )}
            </div>
          </>
        ) : (
          <div className="history-view">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <History /> Task History
            </h2>
            <TaskHistoryList todos={completedTodos} renderTask={renderTask} />
          </div>
        )}
      </div>
      
      {view === 'tasks' && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => setView('history')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border)',
              padding: '0.75rem 1.5rem', borderRadius: '2rem',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit', fontSize: '0.9rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <History size={18} /> View Task History
          </button>
        </div>
      )}

      {confirmTask && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" /> Future Task
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
              This task is scheduled for a future date. Are you sure you want to complete it now?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="add-btn" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                onClick={() => setConfirmTask(null)}
              >
                Cancel
              </button>
              <button 
                className="add-btn" 
                style={{ flex: 1 }}
                onClick={async () => {
                  const id = confirmTask;
                  setConfirmTask(null);
                  const todo = await db.todos.get(id);
                  if (todo) {
                    await db.todos.update(id, { 
                      completed: true,
                      completedAt: new Date().toISOString()
                    });
                    await updateStatsOnCompletion();
                  }
                }}
              >
                Yes, Finish it
              </button>
            </div>
          </div>
        </div>
      )}
      {lateConfirmTask && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary)" /> When was it finished?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              This task was planned for an earlier date. When did you actually finish it?
            </p>
            
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <DatePicker
                selected={manualCompletionDate}
                onChange={(date: Date | null) => date && setManualCompletionDate(date)}
                maxDate={new Date()}
                dateFormat="MMM d, yyyy"
                className="custom-datepicker"
                inline
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="add-btn" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                onClick={() => setLateConfirmTask(null)}
              >
                Cancel
              </button>
              <button 
                className="add-btn" 
                style={{ flex: 1 }}
                onClick={async () => {
                  const id = lateConfirmTask;
                  setLateConfirmTask(null);
                  const todo = await db.todos.get(id);
                  if (todo) {
                    await db.todos.update(id, { 
                      completed: true,
                      completedAt: manualCompletionDate.toISOString()
                    });
                    await updateStatsOnCompletion();
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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
