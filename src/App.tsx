import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Circle,
  Flame,
  Trash2,
  LogOut,
  Calendar,
  Clock,
  ArrowLeft,
  History,
  Plus,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from './db';
import type { Todo } from './db';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

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
    } catch {
      setError('An error occurred');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '400px' }}>
      <header>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <img
            src="./logo.png"
            alt="Aura Logo"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              boxShadow: '0 0 10px var(--secondary-glow)',
            }}
          />
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Aura</h1>
        </div>
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

        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginTop: '1rem',
            cursor: 'pointer',
          }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>

      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          marginTop: '2rem',
          fontSize: '0.9rem',
          opacity: 0.7,
        }}
      >
        Built with ❤️ by <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>SaFz</span>
      </p>
    </div>
  );
};

const ActiveTaskList: React.FC<{ todos: Todo[]; renderTask: (todo: Todo) => React.ReactNode }> = ({
  todos,
  renderTask,
}) => {
  const grouped: Record<string, Todo[]> = {};

  todos.forEach((todo) => {
    let dateStr = 'No Date';
    if (todo.reminderAt) {
      const d = new Date(todo.reminderAt);
      dateStr = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(todo);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (a === 'No Date') return -1;
    if (b === 'No Date') return 1;

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
      {sortedKeys.map((dateStr) => (
        <div key={dateStr} className="timeline-group" style={{ marginBottom: '1.5rem' }}>
          <div
            className="timeline-header"
            style={{
              color: 'var(--text-main)',
              fontWeight: '600',
              fontSize: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{dateStr}</span>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem 0.6rem',
                borderRadius: '1rem',
              }}
            >
              {grouped[dateStr].length} {grouped[dateStr].length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <div
            className="timeline-tasks"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {grouped[dateStr].map(renderTask)}
          </div>
        </div>
      ))}
    </div>
  );
};

const InsightsView: React.FC<{ todos: Todo[] }> = ({ todos }) => {
  const completed = todos.filter((t) => t.completed);

  // Last 7 days activity
  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = completed.filter(
        (t) => new Date(t.completedAt!).toDateString() === d.toDateString()
      ).length;
      return { name: dateStr, count, date: d };
    })
    .reverse();

  // Completion Status
  const statusData = [
    {
      name: 'Early',
      value: completed.filter((t) => {
        if (!t.reminderAt || !t.completedAt) return false;
        return new Date(t.completedAt) < new Date(t.reminderAt);
      }).length,
      color: '#2dd4bf',
    },
    {
      name: 'On Time',
      value: completed.filter((t) => {
        if (!t.reminderAt || !t.completedAt) return true;
        const r = new Date(t.reminderAt);
        const c = new Date(t.completedAt);
        return c.toDateString() === r.toDateString();
      }).length,
      color: '#818cf8',
    },
    {
      name: 'Late',
      value: completed.filter((t) => {
        if (!t.reminderAt || !t.completedAt) return false;
        return (
          new Date(t.completedAt) > new Date(t.reminderAt) &&
          new Date(t.completedAt).toDateString() !== new Date(t.reminderAt).toDateString()
        );
      }).length,
      color: '#fb923c',
    },
  ].filter((d) => d.value > 0);

  return (
    <div
      className="insights-view"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <BarChart2 /> Visual Insights
      </h2>

      <div className="glass-panel" style={{ padding: '1.5rem', height: '300px' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Last 7 Days Activity
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'var(--text-main)' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              fillOpacity={1}
              fill="url(#colorCount)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Total Tasks
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{todos.length}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {completed.length} Completed
          </p>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={statusData}
                innerRadius={30}
                outerRadius={40}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
            {statusData.map((d) => (
              <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />{' '}
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskHistoryList: React.FC<{ todos: Todo[]; renderTask: (todo: Todo) => React.ReactNode }> = ({
  todos,
  renderTask,
}) => {
  if (todos.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
        No completed tasks yet.
      </p>
    );
  }

  const grouped: Record<string, Todo[]> = {};

  todos.forEach((todo) => {
    const d = new Date(todo.createdAt);
    const dateStr = d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(todo);
  });

  return (
    <div className="history-timeline">
      {Object.keys(grouped).map((dateStr) => (
        <div key={dateStr} className="timeline-group" style={{ marginBottom: '1.5rem' }}>
          <div
            className="timeline-header"
            style={{
              color: 'var(--text-main)',
              fontWeight: '600',
              fontSize: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{dateStr}</span>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem 0.6rem',
                borderRadius: '1rem',
              }}
            >
              {grouped[dateStr].length} {grouped[dateStr].length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <div
            className="timeline-tasks"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {grouped[dateStr].map(renderTask)}
          </div>
        </div>
      ))}
    </div>
  );
};
const TodoApp: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const [view, setView] = useState<'tasks' | 'history' | 'insights'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [confirmTask, setConfirmTask] = useState<string | null>(null);
  const [lateConfirmTask, setLateConfirmTask] = useState<string | null>(null);
  const [manualCompletionDate, setManualCompletionDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<Todo['category']>();
  const [filterCategory, setFilterCategory] = useState<Todo['category'] | 'All'>('All');

  const liveTodos = useLiveQuery(
    () => db.todos.where('userId').equals(userId).reverse().sortBy('createdAt'),
    [userId]
  );
  const todos = useMemo(() => liveTodos || [], [liveTodos]);

  const liveStats = useLiveQuery(() => db.stats.get(userId), [userId]);
  const stats = useMemo(
    () =>
      liveStats || {
        userId,
        totalCompleted: 0,
        auraPoints: 0,
        streak: 0,
        lastActiveDate: null,
      },
    [liveStats, userId]
  );

  const activeTodos = [...todos.filter((t) => !t.completed)]
    .filter((t) => filterCategory === 'All' || t.category === filterCategory)
    .sort((a, b) => {
      const now = new Date();
      const todayStr = now.toDateString();

      const getPriority = (todo: Todo) => {
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
  const completedTodos = todos.filter((t) => t.completed);

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
  }, [stats]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const notifiedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach((todo) => {
        if (!todo.completed && todo.reminderAt && !notifiedReminders.current.has(todo.id)) {
          const reminderTime = new Date(todo.reminderAt);
          if (now >= reminderTime) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: `It's time to: ${todo.text}`,
                icon: '/vite.svg',
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

      const current = new Date(start);
      while (current <= end) {
        tasks.push({
          id: crypto.randomUUID(),
          userId,
          text: newTaskText,
          completed: false,
          reminderAt: current.toISOString(),
          createdAt: new Date().toISOString(),
          completedAt: null,
          category: selectedCategory,
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
        completedAt: null,
        category: selectedCategory,
      };
      await db.todos.add(newTodo);
    }

    setNewTaskText('');
    setReminderDate(null);
    setEndDate(null);
    setSelectedCategory(undefined);
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
      completedAt: isCompleting ? new Date().toISOString() : null,
    });

    if (isCompleting) {
      const points = calculateAuraPoints(todo, new Date());
      await updateStatsOnCompletion(points);
    }
  };

  const calculateAuraPoints = (todo: Todo, completionDate: Date) => {
    let points = 100;
    if (todo.reminderAt) {
      const planned = new Date(todo.reminderAt);
      planned.setHours(0, 0, 0, 0);
      const actual = new Date(completionDate);
      actual.setHours(0, 0, 0, 0);

      const diffTime = actual.getTime() - planned.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Early
        points += Math.abs(diffDays) * 50;
      } else if (diffDays > 0) {
        // Late
        points = Math.max(10, points - diffDays * 20);
      }
    }
    return points;
  };

  const deleteTodo = async (id: string) => {
    await db.todos.delete(id);
  };
  const generateSubtasks = async (id: string) => {
    const todo = await db.todos.get(id);
    if (!todo) return;
    const text = todo.text.toLowerCase();
    let suggestions: string[];
    if (
      text.includes('trip') ||
      text.includes('travel') ||
      text.includes('vacation') ||
      text.includes('flight') ||
      text.includes('hotel')
    ) {
      suggestions = ['Book transport & stay', 'Pack essentials & docs', 'Finalize itinerary'];
    } else if (
      text.includes('meeting') ||
      text.includes('call') ||
      text.includes('presentation') ||
      text.includes('zoom') ||
      text.includes('interview')
    ) {
      suggestions = ['Draft agenda & goals', 'Gather research/assets', 'Set follow-up tasks'];
    } else if (
      text.includes('study') ||
      text.includes('exam') ||
      text.includes('learn') ||
      text.includes('course') ||
      text.includes('homework')
    ) {
      suggestions = ['Read focus chapters', 'Create summary notes', 'Take practice test'];
    } else if (
      text.includes('gym') ||
      text.includes('workout') ||
      text.includes('fitness') ||
      text.includes('run') ||
      text.includes('training')
    ) {
      suggestions = ['Dynamic warm-up', 'Execute main routine', 'Cool down & stretch'];
    } else if (
      text.includes('project') ||
      text.includes('work') ||
      text.includes('report') ||
      text.includes('task') ||
      text.includes('assignment')
    ) {
      suggestions = ['Break into milestones', 'Draft first version', 'Proofread & submit'];
    } else if (
      text.includes('clean') ||
      text.includes('home') ||
      text.includes('house') ||
      text.includes('laundry') ||
      text.includes('room')
    ) {
      suggestions = ['Gather all supplies', 'Focus deep-clean area', 'Tidy & organize'];
    } else if (
      text.includes('cook') ||
      text.includes('dinner') ||
      text.includes('meal') ||
      text.includes('recipe') ||
      text.includes('lunch')
    ) {
      suggestions = ['Shop for ingredients', 'Prep & chop items', 'Cook & serve'];
    } else if (
      text.includes('code') ||
      text.includes('build') ||
      text.includes('app') ||
      text.includes('dev') ||
      text.includes('software')
    ) {
      suggestions = ['Plan architecture', 'Write core logic', 'Test & fix bugs'];
    } else if (
      text.includes('buy') ||
      text.includes('shop') ||
      text.includes('grocery') ||
      text.includes('order') ||
      text.includes('market')
    ) {
      suggestions = ['Make precise list', 'Compare prices/stores', 'Pick up & store'];
    } else if (
      text.includes('bill') ||
      text.includes('pay') ||
      text.includes('bank') ||
      text.includes('finance') ||
      text.includes('tax')
    ) {
      suggestions = ['Verify amount due', 'Execute payment', 'Record in tracker'];
    } else if (
      text.includes('birthday') ||
      text.includes('party') ||
      text.includes('gift') ||
      text.includes('event') ||
      text.includes('wedding')
    ) {
      suggestions = ['Send invitations', 'Arrange logistics', 'Prepare surprise/gift'];
    } else if (
      text.includes('doctor') ||
      text.includes('health') ||
      text.includes('medical') ||
      text.includes('dentist') ||
      text.includes('appointment')
    ) {
      suggestions = ['Gather symptoms/info', 'Attend appointment', 'Update health logs'];
    } else if (
      text.includes('car') ||
      text.includes('service') ||
      text.includes('oil') ||
      text.includes('tire') ||
      text.includes('drive')
    ) {
      suggestions = ['Check maintenance list', 'Book service/shop', 'Verify repairs done'];
    } else if (
      text.includes('pet') ||
      text.includes('dog') ||
      text.includes('cat') ||
      text.includes('vet') ||
      text.includes('feed')
    ) {
      suggestions = ['Check supply levels', 'Engage/Care for pet', 'Tidy pet area'];
    } else if (
      text.includes('garden') ||
      text.includes('plant') ||
      text.includes('water') ||
      text.includes('mow') ||
      text.includes('yard')
    ) {
      suggestions = ['Prune & weed area', 'Water & fertilize', 'Cleanup tools'];
    } else if (
      text.includes('read') ||
      text.includes('book') ||
      text.includes('article') ||
      text.includes('novel') ||
      text.includes('chapter')
    ) {
      suggestions = ['Find quiet space', 'Read focus section', 'Reflect/Take notes'];
    } else if (
      text.includes('yoga') ||
      text.includes('meditate') ||
      text.includes('breath') ||
      text.includes('relax') ||
      text.includes('peace')
    ) {
      suggestions = ['Prepare mat/space', 'Set focus intention', 'Post-practice rest'];
    } else if (
      text.includes('post') ||
      text.includes('video') ||
      text.includes('photo') ||
      text.includes('content') ||
      text.includes('social')
    ) {
      suggestions = ['Capture/Design media', 'Draft caption/tags', 'Publish & engage'];
    } else {
      suggestions = ['Define specific goal', 'Take the first step', 'Review progress'];
    }
    const subtasks = suggestions.map((s) => ({
      id: crypto.randomUUID(),
      text: s,
      completed: false,
    }));
    await db.todos.update(id, { subtasks });
  };
  const toggleSubtask = async (todoId: string, subtaskId: string) => {
    const todo = await db.todos.get(todoId);
    if (!todo || !todo.subtasks) return;
    const newSubtasks = todo.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await db.todos.update(todoId, { subtasks: newSubtasks });
  };

  const updateStatsOnCompletion = async (points: number = 100) => {
    const currentStats = (await db.stats.get(userId)) || {
      userId,
      totalCompleted: 0,
      auraPoints: 0,
      streak: 0,
      lastActiveDate: null,
    };
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
      auraPoints: (currentStats.auraPoints || 0) + points,
      streak: newStreak,
      lastActiveDate: todayStr,
    });
  };

  const renderTask = (todo: Todo) => (
    <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <button
          className="todo-checkbox"
          onClick={() => toggleTodo(todo.id)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={todo.completed ? 'Mark as pending' : 'Mark as done'}
        >
          {todo.completed ? (
            <CheckCircle2 size={24} color="var(--primary)" />
          ) : (
            <Circle size={24} color="var(--text-muted)" />
          )}
        </button>
        <div className="todo-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              className={`todo-text ${todo.category ? `text-${todo.category.toLowerCase()}` : ''}`}
            >
              {todo.text}
            </span>
            {!todo.subtasks && !todo.completed && (
              <button
                onClick={() => generateSubtasks(todo.id)}
                className="magic-btn"
                title="AI Smart Breakdown"
              >
                <Sparkles size={14} /> Breakdown
              </button>
            )}
            {todo.completed &&
              todo.reminderAt &&
              todo.completedAt &&
              (() => {
                const r = new Date(todo.reminderAt);
                const c = new Date(todo.completedAt);
                r.setHours(0, 0, 0, 0);
                c.setHours(0, 0, 0, 0);

                if (c < r) {
                  return (
                    <span
                      title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString()}`}
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '1rem',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ✨ Excellent! Early
                    </span>
                  );
                } else if (c > r) {
                  return (
                    <span
                      title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString()}. You can do better!`}
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ⏳ Late - Aim Higher
                    </span>
                  );
                }
                return null;
              })()}
          </div>
          {todo.subtasks && todo.subtasks.length > 0 && (
            <div className="subtask-list">
              {todo.subtasks.map((st) => (
                <div key={st.id} className={`subtask-item ${st.completed ? 'completed' : ''}`}>
                  <button onClick={() => toggleSubtask(todo.id, st.id)} className="subtask-check">
                    {st.completed ? (
                      <CheckCircle2 size={12} color="var(--primary)" />
                    ) : (
                      <Circle size={12} color="var(--text-muted)" />
                    )}
                  </button>
                  <span className="subtask-text">{st.text}</span>
                </div>
              ))}
            </div>
          )}
          {todo.reminderAt && !todo.completed && (
            <span className="todo-reminder">
              <Bell size={14} />
              {new Date(todo.reminderAt).toLocaleString()}
            </span>
          )}
          {todo.completed && todo.completedAt && (
            <span
              className="todo-reminder"
              style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
            >
              Done: {new Date(todo.completedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          deleteTodo(todo.id);
        }}
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
            transition: 'all 0.2s',
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
              zIndex: 10,
            }}
            title="Back to Tasks"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          <img
            src="./logo.png"
            alt="Aura Logo"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              boxShadow: '0 0 15px var(--secondary-glow)',
            }}
          />
          <h1 style={{ margin: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>Aura</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Focus on what matters.</p>
      </header>

      {view === 'tasks' && (
        <div className="stats-container">
          <div className="stat-item" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="stat-label">Aura Streak</div>
            <div className="stat-value">
              <Flame
                size={28}
                color="var(--secondary)"
                fill="var(--secondary)"
                style={{ filter: 'drop-shadow(0 0 8px var(--secondary-glow))' }}
              />
              {stats.streak}
            </div>
          </div>
          <div className="stat-item" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-label">Aura Farmed</div>
            <div className="stat-value">
              <Sparkles
                size={28}
                color="var(--primary)"
                style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}
              />
              {(stats.auraPoints || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel">
        {view === 'tasks' ? (
          <>
            <form onSubmit={handleAddTodo} className="input-group">
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  overflowX: 'auto',
                  paddingBottom: '0.25rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: '0.25rem',
                  }}
                >
                  Tag:
                </span>
                {(['Work', 'Personal', 'Fitness', 'Urgent'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                    className={`category-chip ${selectedCategory === cat ? 'active' : ''} tag-${cat.toLowerCase()}`}
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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
                    placeholderText={isRange ? 'Start Date' : 'Add Date...'}
                    isClearable
                    className="custom-datepicker"
                    customInput={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '0.8rem 1rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Calendar
                          size={18}
                          color="var(--text-muted)"
                          style={{ marginRight: '0.5rem' }}
                        />
                        <input
                          value={reminderDate ? reminderDate.toLocaleDateString() : ''}
                          readOnly
                          placeholder={isRange ? 'Start Date' : 'Date (Optional)'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            outline: 'none',
                            width: '100%',
                            cursor: 'pointer',
                          }}
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            padding: '0.8rem 1rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Calendar
                            size={18}
                            color="var(--text-muted)"
                            style={{ marginRight: '0.5rem' }}
                          />
                          <input
                            value={endDate ? endDate.toLocaleDateString() : ''}
                            readOnly
                            placeholder="End Date"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-main)',
                              outline: 'none',
                              width: '100%',
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                      }
                    />
                  </div>
                )}

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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            padding: '0.8rem 1rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Clock
                            size={18}
                            color="var(--text-muted)"
                            style={{ marginRight: '0.5rem' }}
                          />
                          <input
                            value={
                              reminderDate
                                ? reminderDate.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''
                            }
                            readOnly
                            placeholder="Time"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-main)',
                              outline: 'none',
                              width: '100%',
                              cursor: 'pointer',
                            }}
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
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}
                >
                  Filter:
                </span>
                <button
                  onClick={() => setFilterCategory('All')}
                  className={`filter-chip ${filterCategory === 'All' ? 'active' : ''}`}
                >
                  All
                </button>
                {(['Work', 'Personal', 'Fitness', 'Urgent'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`filter-chip ${filterCategory === cat ? 'active' : ''} tag-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {activeTodos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  All caught up! Nothing to do.
                </p>
              ) : (
                <>
                  <ActiveTaskList
                    todos={activeTodos.slice(0, visibleCount)}
                    renderTask={renderTask}
                  />
                  {activeTodos.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="load-more-btn"
                    >
                      Show More ({activeTodos.length - visibleCount} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        ) : view === 'history' ? (
          <div className="history-view">
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                color: 'var(--primary)',
              }}
            >
              <History /> Task History
            </h2>
            <TaskHistoryList todos={completedTodos} renderTask={renderTask} />
          </div>
        ) : (
          <InsightsView todos={todos} />
        )}
      </div>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {view === 'tasks' ? (
          <>
            <button
              onClick={() => setView('history')}
              className="load-more-btn"
              style={{ flex: 1, marginTop: 0 }}
            >
              <History size={18} style={{ marginRight: '0.5rem' }} /> History
            </button>
            <button
              onClick={() => setView('insights')}
              className="load-more-btn"
              style={{
                flex: 1,
                marginTop: 0,
                background:
                  'linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(251, 146, 60, 0.1))',
              }}
            >
              <BarChart2 size={18} style={{ marginRight: '0.5rem' }} /> Insights
            </button>
          </>
        ) : (
          <button
            onClick={() => setView('tasks')}
            className="load-more-btn"
            style={{ width: 'auto', padding: '0.75rem 2rem', marginTop: 0 }}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to Tasks
          </button>
        )}
      </div>

      {confirmTask && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3
              style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
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
                      completedAt: new Date().toISOString(),
                    });
                    const points = calculateAuraPoints(todo, new Date());
                    await updateStatsOnCompletion(points);
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
            <h3
              style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
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
                      completedAt: manualCompletionDate.toISOString(),
                    });
                    const points = calculateAuraPoints(todo, manualCompletionDate);
                    await updateStatsOnCompletion(points);
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
