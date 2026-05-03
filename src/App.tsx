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
  Play,
  Pause,
  RotateCcw,
  Search,
  CloudRain,
  Music,
  Moon,
  VolumeX,
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
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
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

const AuraHeatmap: React.FC<{ data: { date: Date; count: number }[] }> = ({ data }) => {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const getIntensity = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.03)';
    if (count <= 2) return 'color-mix(in srgb, var(--primary), transparent 70%)';
    if (count <= 5) return 'color-mix(in srgb, var(--primary), transparent 40%)';
    return 'var(--primary)';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Aura Focus Grid
      </h3>

      <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
        {/* Day labels column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '20px' }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              style={{
                height: '12px',
                fontSize: '9px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap Grid Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Month labels row */}
          <div style={{ display: 'flex', height: '16px', gap: '4px' }}>
            {weeks.map((week, wi) => {
              const firstDay = week[0].date;
              // Only show month name if it's the first week of the month
              // or if it's the very first week in the display
              const isNewMonth = firstDay.getDate() <= 7 && wi > 0;
              const monthName = firstDay.toLocaleDateString(undefined, { month: 'short' });
              return (
                <div
                  key={wi}
                  style={{
                    width: '12px',
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    position: 'relative',
                  }}
                >
                  {(wi === 0 || isNewMonth) && (
                    <span
                      style={{ position: 'absolute', left: 0, bottom: 0, whiteSpace: 'nowrap' }}
                    >
                      {monthName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Columns of days */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}: ${day.count} tasks completed`}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: getIntensity(day.count),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'help',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.25)';
                      e.currentTarget.style.boxShadow = `0 0 10px ${getIntensity(day.count)}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>Less</span>
        <div
          style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.03)' }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: 'color-mix(in srgb, var(--primary), transparent 70%)',
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: 'color-mix(in srgb, var(--primary), transparent 40%)',
          }}
        />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
        <span>More Glow</span>
      </div>
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

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeksToDisplay = 12;
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - weeksToDisplay * 7);

    // Align start to the beginning of the week (Sunday)
    while (startDay.getDay() !== 0) {
      startDay.setDate(startDay.getDate() - 1);
    }

    const data = [];
    const current = new Date(startDay);
    while (current <= today) {
      const d = new Date(current);
      const count = completed.filter((t) => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt).toDateString() === d.toDateString();
      }).length;
      data.push({ date: d, count });
      current.setDate(current.getDate() + 1);
    }
    return data;
  }, [completed]);

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

  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    completed.forEach((t) => {
      const cat = t.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [completed]);

  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    completed.forEach((t) => {
      if (t.completedAt) {
        const hour = new Date(t.completedAt).getHours();
        hours[hour]++;
      }
    });
    return hours.map((count, hour) => ({
      hour: hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`,
      count,
    }));
  }, [completed]);

  return (
    <div
      className="insights-view"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <BarChart2 /> Visual Insights
      </h2>

      <AuraHeatmap data={heatmapData} />

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

      <div className="insights-grid-stats">
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Total Tasks
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{todos.length}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {completed.length} Completed
          </p>
        </div>
        <div
          className="glass-panel"
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}
        >
          <div style={{ width: '100px', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={25}
                  outerRadius={35}
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
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Punctuality
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {statusData.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{d.name}:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="insights-grid-charts">
        <div className="glass-panel" style={{ padding: '1.5rem', height: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Tag Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tagData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="var(--text-muted)"
                fontSize={10}
                width={70}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', height: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Hourly Focus
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                stroke="var(--text-muted)"
                fontSize={9}
                interval={3}
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
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--secondary)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: 'var(--secondary)', stroke: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
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

const SOUNDSCAPES = [
  { id: 'none', label: 'Silence', url: '', icon: <VolumeX size={16} /> },
  {
    id: 'rain',
    label: 'Neon Rain',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    icon: <CloudRain size={16} />,
  },
  {
    id: 'lofi',
    label: 'Cyber Lo-Fi',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    icon: <Music size={16} />,
  },
  {
    id: 'space',
    label: 'Deep Space',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    icon: <Moon size={16} />,
  },
];

const ZenMode: React.FC<{ onPointsEarned: (points: number) => void }> = ({ onPointsEarned }) => {
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const secondsSpent = useRef(0);
  const [selectedSound, setSelectedSound] = useState('none');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isActive && selectedSound !== 'none') {
      const sound = SOUNDSCAPES.find((s) => s.id === selectedSound);
      if (sound && sound.url) {
        if (!audioRef.current) {
          audioRef.current = new Audio(sound.url);
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
        } else if (audioRef.current.src !== sound.url) {
          audioRef.current.pause();
          audioRef.current.src = sound.url;
          audioRef.current.load();
        }
        audioRef.current.play().catch((e) => console.log('Audio autoplay blocked or error:', e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive, selectedSound]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished!
            setIsActive(false);
            if (!isBreak) {
              const totalPoints = duration * 3;
              onPointsEarned(totalPoints);
              secondsSpent.current = 0;
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Zen Session Complete!', {
                  body: `You earned +${totalPoints} Aura points. Take a break.`,
                });
              }
            }
            return 0;
          }
          return prev - 1;
        });
        if (!isBreak) secondsSpent.current += 1;
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isBreak, onPointsEarned, duration, timeLeft]);

  const givePartialPoints = () => {
    if (!isBreak && secondsSpent.current >= 60) {
      const mins = Math.floor(secondsSpent.current / 60);
      onPointsEarned(mins);
      secondsSpent.current = 0;
    }
  };

  const toggleTimer = () => {
    if (isActive) givePartialPoints();
    setIsActive(!isActive);
  };
  const resetTimer = () => {
    givePartialPoints();
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : duration * 60);
  };
  const switchMode = () => {
    givePartialPoints();
    const nextIsBreak = !isBreak;
    setIsBreak(nextIsBreak);
    setTimeLeft(nextIsBreak ? 5 * 60 : duration * 60);
    setIsActive(false);
  };

  const changeDuration = (mins: number) => {
    if (isActive) givePartialPoints();
    setDuration(mins);
    setTimeLeft(mins * 60);
    setIsActive(false);
    setIsBreak(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = isBreak ? 5 * 60 : duration * 60;
  const progress = (timeLeft / totalTime) * 100;

  return (
    <div className={`zen-container ${isActive ? 'active' : ''}`}>
      <div
        className="glass-panel"
        style={{ padding: '3rem', textAlign: 'center', maxWidth: '450px', margin: '0 auto' }}
      >
        <h2
          style={{
            color: isBreak ? 'var(--secondary)' : 'var(--primary)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={24} /> {isBreak ? 'Zen Break' : 'Deep Focus'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {isBreak ? 'Rest your mind, regain your glow.' : 'Silence the noise. Ascend to flow.'}
        </p>

        {!isBreak && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            {[5, 10, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => changeDuration(mins)}
                style={{
                  background: duration === mins ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: duration === mins ? 'white' : 'var(--text-muted)',
                  padding: '0.4rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '0.4rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {SOUNDSCAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSound(s.id)}
              style={{
                background: selectedSound === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedSound === s.id ? 'var(--primary)' : 'var(--border)'}`,
                color: selectedSound === s.id ? 'white' : 'var(--text-muted)',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.75rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '2rem auto' }}>
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            <circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke={isBreak ? 'var(--secondary)' : 'var(--primary)'}
              strokeWidth="10"
              strokeDasharray="628.3"
              strokeDashoffset={628.3 * (1 - progress / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              style={{ fontSize: '3.5rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button
            onClick={toggleTimer}
            className="add-btn"
            style={{ width: '70px', height: '70px', borderRadius: '50%', padding: 0 }}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
          </button>
          <button
            onClick={resetTimer}
            className="add-btn"
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              padding: 0,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
            }}
          >
            <RotateCcw size={28} />
          </button>
        </div>

        <button
          onClick={switchMode}
          style={{
            marginTop: '2.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.9rem',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          Switch to {isBreak ? 'Focus Session' : 'Short Break'}
        </button>
      </div>
    </div>
  );
};

const getAuraRank = (points: number) => {
  if (points >= 10000)
    return { title: 'Enlightened One', color: '#fbbf24', secondary: '#f59e0b', icon: '💎' };
  if (points >= 5000)
    return { title: 'Aura Adept', color: '#f43f5e', secondary: '#e11d48', icon: '🔥' };
  if (points >= 2000)
    return { title: 'Glow Getter', color: '#a855f7', secondary: '#d946ef', icon: '✨' };
  if (points >= 500)
    return { title: 'Spark Seeker', color: '#06b6d4', secondary: '#2dd4bf', icon: '⚡' };
  return { title: 'Neon Novice', color: '#6366f1', secondary: '#fb923c', icon: '🌑' };
};

const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
}> = ({ isOpen, onClose, onAction }) => {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'tasks', label: 'Go to Tasks', icon: <CheckCircle2 size={18} />, category: 'Navigation' },
    { id: 'history', label: 'Go to History', icon: <History size={18} />, category: 'Navigation' },
    {
      id: 'insights',
      label: 'Go to Insights',
      icon: <BarChart2 size={18} />,
      category: 'Navigation',
    },
    { id: 'zen', label: 'Go to Zen Mode', icon: <Sparkles size={18} />, category: 'Navigation' },
    { id: 'new-task', label: 'Add New Task', icon: <Plus size={18} />, category: 'Quick Action' },
    {
      id: 'clear-completed',
      label: 'Clear Completed Tasks',
      icon: <Trash2 size={18} />,
      category: 'Quick Action',
    },
  ].filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % actions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + actions.length) % actions.length);
    } else if (e.key === 'Enter') {
      if (actions[activeIndex]) {
        onAction(actions[activeIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder="Type a command (e.g. 'zen', 'tasks')..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="command-actions">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={`command-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => {
                onAction(action.id);
                onClose();
              }}
            >
              {action.icon}
              <span>{action.label}</span>
              <span className="command-shortcut">{action.category}</span>
            </div>
          ))}
          {actions.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No commands found...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TodoApp: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const [view, setView] = useState<'tasks' | 'history' | 'insights' | 'zen'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleCommand = async (id: string) => {
    if (id === 'tasks') setView('tasks');
    else if (id === 'history') setView('history');
    else if (id === 'insights') setView('insights');
    else if (id === 'zen') setView('zen');
    else if (id === 'new-task') {
      setView('tasks');
      setTimeout(() => {
        const input = document.querySelector(
          'input[placeholder="What needs to be done?"]'
        ) as HTMLInputElement;
        input?.focus();
      }, 100);
    } else if (id === 'clear-completed') {
      if (confirm('Clear all completed tasks?')) {
        const completed = await db.todos.where('completed').equals(1).toArray();
        await db.todos.bulkDelete(completed.map((t) => t.id));
      }
    }
  };
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

  useEffect(() => {
    const rank = getAuraRank(stats.auraPoints || 0);
    const root = document.documentElement;
    root.style.setProperty('--primary', rank.color);
    root.style.setProperty('--primary-glow', `${rank.color}44`);
    root.style.setProperty('--secondary', rank.secondary);
    root.style.setProperty('--secondary-glow', `${rank.secondary}44`);
  }, [stats.auraPoints]);

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
      text.includes('homework') ||
      text.includes('test')
    ) {
      suggestions = ['Read focus chapters', 'Create summary notes', 'Take practice test'];
    } else if (
      text.includes('gym') ||
      text.includes('workout') ||
      text.includes('fitness') ||
      text.includes('run') ||
      text.includes('training') ||
      text.includes('exercise')
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
      text.includes('room') ||
      text.includes('tidy')
    ) {
      suggestions = ['Gather all supplies', 'Focus deep-clean area', 'Tidy & organize'];
    } else if (
      text.includes('cook') ||
      text.includes('dinner') ||
      text.includes('meal') ||
      text.includes('recipe') ||
      text.includes('lunch') ||
      text.includes('bake')
    ) {
      suggestions = ['Shop for ingredients', 'Prep & chop items', 'Cook & serve'];
    } else if (
      text.includes('code') ||
      text.includes('build') ||
      text.includes('app') ||
      text.includes('dev') ||
      text.includes('software') ||
      text.includes('bug')
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
      text.includes('tax') ||
      text.includes('budget')
    ) {
      suggestions = ['Verify amount due', 'Execute payment', 'Record in tracker'];
    } else if (
      text.includes('birthday') ||
      text.includes('party') ||
      text.includes('gift') ||
      text.includes('event') ||
      text.includes('wedding') ||
      text.includes('anniversary')
    ) {
      suggestions = ['Send invitations', 'Arrange logistics', 'Prepare surprise/gift'];
    } else if (
      text.includes('doctor') ||
      text.includes('health') ||
      text.includes('medical') ||
      text.includes('dentist') ||
      text.includes('appointment') ||
      text.includes('checkup')
    ) {
      suggestions = ['Gather symptoms/info', 'Attend appointment', 'Update health logs'];
    } else if (
      text.includes('car') ||
      text.includes('service') ||
      text.includes('oil') ||
      text.includes('tire') ||
      text.includes('drive') ||
      text.includes('vehicle')
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
      text.includes('peace') ||
      text.includes('mindful')
    ) {
      suggestions = ['Prepare mat/space', 'Set focus intention', 'Post-practice rest'];
    } else if (
      text.includes('post') ||
      text.includes('video') ||
      text.includes('photo') ||
      text.includes('content') ||
      text.includes('social') ||
      text.includes('youtube') ||
      text.includes('instagram')
    ) {
      suggestions = ['Capture/Design media', 'Draft caption/tags', 'Publish & engage'];
    } else if (
      text.includes('job') ||
      text.includes('resume') ||
      text.includes('cv') ||
      text.includes('apply') ||
      text.includes('career') ||
      text.includes('linkedin')
    ) {
      suggestions = ['Update resume/CV', 'Research company/role', 'Submit application'];
    } else if (
      text.includes('art') ||
      text.includes('paint') ||
      text.includes('draw') ||
      text.includes('sketch') ||
      text.includes('creative') ||
      text.includes('music')
    ) {
      suggestions = ['Set up workspace/tools', 'Draft initial idea', 'Refine & add detail'];
    } else if (
      text.includes('update') ||
      text.includes('backup') ||
      text.includes('phone') ||
      text.includes('computer') ||
      text.includes('laptop') ||
      text.includes('file')
    ) {
      suggestions = ['Backup important files', 'Run system updates', 'Organize digital folders'];
    } else if (
      text.includes('friend') ||
      text.includes('coffee') ||
      text.includes('hangout') ||
      text.includes('date') ||
      text.includes('visit')
    ) {
      suggestions = ['Confirm time & location', 'Prepare conversation/gift', 'Enjoy & follow up'];
    } else if (
      text.includes('skin') ||
      text.includes('hair') ||
      text.includes('selfcare') ||
      text.includes('grooming') ||
      text.includes('bath')
    ) {
      suggestions = ['Prepare products/tools', 'Execute routine steps', 'Relax & hydrate'];
    } else if (
      text.includes('morning') ||
      text.includes('wake') ||
      text.includes('night') ||
      text.includes('sleep') ||
      text.includes('routine')
    ) {
      suggestions = ['Hydrate & stretch', 'Review daily goals', 'Prepare next steps'];
    } else if (
      text.includes('move') ||
      text.includes('apartment') ||
      text.includes('pack') ||
      text.includes('box') ||
      text.includes('relocate')
    ) {
      suggestions = ['Declutter & sort items', 'Pack boxes & label', 'Update address/info'];
    } else if (
      text.includes('fix') ||
      text.includes('repair') ||
      text.includes('broken') ||
      text.includes('leak') ||
      text.includes('maint')
    ) {
      suggestions = ['Assess damage/issue', 'Get tools & parts', 'Execute fix & test'];
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
                      title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
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
                      title={`Planned for ${new Date(todo.reminderAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}. You can do better!`}
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
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAction={handleCommand}
      />
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
          onClick={() => setView('tasks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '0.5rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          className="logo-container"
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            marginTop: '1.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            maxWidth: '280px',
            margin: '1.25rem auto 0 auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Search size={16} />
          <span style={{ fontSize: '0.85rem', flex: 1, textAlign: 'left' }}>
            Search commands...
          </span>
          <span className="command-shortcut" style={{ fontSize: '0.65rem', opacity: 0.8 }}>
            Ctrl K
          </span>
        </div>
      </header>

      {view === 'tasks' && (
        <div className="stats-container">
          <div className="stat-item" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="stat-label">Streak</div>
            <div className="stat-value">
              <Flame
                size={20}
                color="var(--secondary)"
                fill="var(--secondary)"
                style={{ filter: 'drop-shadow(0 0 8px var(--secondary-glow))' }}
              />
              {stats.streak}
            </div>
          </div>
          <div className="stat-item" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-label">Farmed</div>
            <div className="stat-value">
              <Sparkles
                size={20}
                color="var(--primary)"
                style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}
              />
              {(stats.auraPoints || 0).toLocaleString()}
            </div>
          </div>
          <div
            className="stat-item"
            style={{ borderLeft: `4px solid ${getAuraRank(stats.auraPoints || 0).color}` }}
          >
            <div className="stat-label">Rank</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              <span style={{ fontSize: '1.2rem' }}>{getAuraRank(stats.auraPoints || 0).icon}</span>
              <span
                title={getAuraRank(stats.auraPoints || 0).title}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {getAuraRank(stats.auraPoints || 0).title}
              </span>
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
                          value={
                            reminderDate
                              ? reminderDate.toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : ''
                          }
                          readOnly
                          placeholder={isRange ? 'Start Date' : 'Add Date...'}
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
                            value={
                              endDate
                                ? endDate.toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : ''
                            }
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
                      timeIntervals={30}
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
        ) : view === 'insights' ? (
          <InsightsView todos={todos} />
        ) : (
          <ZenMode onPointsEarned={(points) => updateStatsOnCompletion(points)} />
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
            <button
              onClick={() => setView('zen')}
              className="load-more-btn"
              style={{
                flex: 1,
                marginTop: 0,
                background:
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(6, 182, 212, 0.1))',
                borderColor: 'rgba(34, 197, 94, 0.3)',
              }}
            >
              <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> Zen
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
