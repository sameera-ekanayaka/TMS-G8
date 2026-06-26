import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, getUsers } from '../services/api';

/* ── Stat Card — flat white canvas, hairline border ── */
const StatCard = ({ title, value, icon, accentColor }) => (
  <div style={{
    background: 'var(--color-canvas)',
    borderRadius: 'var(--rounded-md)',          /* 10px */
    border: '1px solid var(--color-hairline)',
    padding: 'var(--space-xl)',                 /* 32px */
    flex: 1,
    minWidth: 150,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{
          color: 'var(--color-muted)',
          fontSize: '12px',
          fontWeight: '500',
          margin: '0 0 var(--space-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: 'var(--text-display-lg)',   /* ~40px */
          fontWeight: '400',                    /* design.md: weight via size, not boldness */
          color: 'var(--color-ink)',
          margin: 0,
          lineHeight: 1,
        }}>
          {value}
        </p>
      </div>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--rounded-sm)',      /* 6px */
        background: accentColor + '15',
        border: `1px solid ${accentColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
      }}>
        {icon}
      </div>
    </div>
    {/* Minimal bottom accent line */}
    <div style={{ height: '2px', background: accentColor, borderRadius: 'var(--rounded-full)', marginTop: 'var(--space-lg)', width: '32px', opacity: 0.7 }} />
  </div>
);

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0 });
  const [tasks, setTasks] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [token]);

  const fetchData = async () => {
    if (!token) return;
    try {
      const taskRes = await getTasks(token);
      const allTasks = taskRes.data.tasks;
      setTasks(allTasks.slice(0, 5));
      setStats({
        total: allTasks.length,
        todo: allTasks.filter(t => t.status === 'TODO').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: allTasks.filter(t => t.status === 'COMPLETED').length,
      });
      if (user?.role === 'ADMIN') {
        const userRes = await getUsers(token);
        setUserCount(userRes.data.users.length);
      }
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const getPriorityStyle = (priority) => {
    if (priority === 'HIGH') return { bg: '#fff5f5', color: 'var(--color-danger)', dot: 'var(--color-danger)' };
    if (priority === 'MEDIUM') return { bg: '#fffbeb', color: 'var(--color-warning)', dot: 'var(--color-warning)' };
    return { bg: '#f0fdf4', color: 'var(--color-success)', dot: 'var(--color-success)' };
  };

  const getStatusStyle = (status) => {
    if (status === 'COMPLETED') return { bg: '#f0fdf4', color: 'var(--color-success)' };
    if (status === 'IN_PROGRESS') return { bg: '#eff6ff', color: 'var(--color-info)' };
    return { bg: 'var(--color-surface-soft)', color: 'var(--color-muted)' };
  };

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Morning' : timeOfDay < 17 ? 'Afternoon' : 'Evening';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-body-md)' }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>

        {/* ── Page Header ── */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              Good {greeting}, {user?.name?.split(' ')[0]}
            </h1>
            <p style={styles.pageSubtitle}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ── Stats Grid — white canvas cards ── */}
        <div style={styles.statsGrid}>
          <StatCard title="Total Tasks" value={stats.total} icon="☰" accentColor="var(--color-primary)" />
          <StatCard title="To Do" value={stats.todo} icon="○" accentColor="var(--color-warning)" />
          <StatCard title="In Progress" value={stats.inProgress} icon="◑" accentColor="var(--color-info)" />
          <StatCard title="Completed" value={stats.completed} icon="◉" accentColor="var(--color-success)" />
          {user?.role === 'ADMIN' && (
            <StatCard title="Team Members" value={userCount} icon="⊙" accentColor="var(--color-sig-coral)" />
          )}
        </div>

        {/* ── Content Grid ── */}
        <div className="ed-dash-grid">

          {/* Progress Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Task Progress</h2>

            {/* Completion donut */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
              <svg viewBox="0 0 100 100" style={{ width: '110px', height: '110px' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-hairline)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="8"
                  strokeDasharray={`${completionRate * 2.51} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="47" textAnchor="middle" fill="var(--color-ink)" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">{completionRate}%</text>
                <text x="50" y="62" textAnchor="middle" fill="var(--color-muted)" fontSize="8" fontFamily="Inter, sans-serif">Complete</text>
              </svg>
            </div>

            {/* Progress bars */}
            {[
              { label: 'Completed', value: stats.completed, total: stats.total, color: 'var(--color-success)' },
              { label: 'In Progress', value: stats.inProgress, total: stats.total, color: 'var(--color-info)' },
              { label: 'To Do', value: stats.todo, total: stats.total, color: 'var(--color-warning)' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-body)', fontWeight: '400' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>
                    {item.value} / {item.total}
                  </span>
                </div>
                <div style={{ background: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-full)', height: '6px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{
                    width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                    background: item.color,
                    borderRadius: 'var(--rounded-full)',
                    height: '4px',
                    marginTop: '0px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Tasks Card */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 style={styles.cardTitle}>Recent Tasks</h2>
              <button
                onClick={() => window.location.href = '/tasks'}
                style={{ background: 'none', border: 'none', color: 'var(--color-link)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: 'var(--font-base)' }}
              >
                View all →
              </button>
            </div>

            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xxl) var(--space-lg)', color: 'var(--color-muted)' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>☰</p>
                <p style={{ fontSize: 'var(--text-body-md)' }}>No tasks yet</p>
              </div>
            ) : (
              tasks.map(task => {
                const ps = getPriorityStyle(task.priority);
                const ss = getStatusStyle(task.status);
                return (
                  <div key={task.id} style={styles.taskItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink)', margin: 0, flex: 1, lineHeight: 1.4 }}>
                        {task.title}
                      </p>
                      <span style={{ ...styles.taskBadge, background: ps.bg, color: ps.color, marginLeft: '8px' }}>
                        {task.priority}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...styles.taskBadge, background: ss.bg, color: ss.color }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.dueDate && (
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Role Card — signature-dark treatment (design.md: hero-card-dark) */}
          <div style={{ ...styles.card, background: 'var(--color-surface-dark)', border: 'none' }}>
            <h2 style={{ ...styles.cardTitle, color: 'var(--color-on-dark)', fontWeight: '400' }}>Your Role</h2>
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
              <div style={{
                width: '60px', height: '60px',
                borderRadius: 'var(--rounded-lg)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', margin: '0 auto var(--space-md)',
              }}>
                {user?.role === 'ADMIN' ? '◈' : user?.role === 'PROJECT_MANAGER' ? '◎' : '◉'}
              </div>
              <p style={{ color: 'var(--color-on-dark)', fontSize: 'var(--text-title-md)', fontWeight: '400', margin: '0 0 var(--space-xs)' }}>
                {user?.role?.replace('_', ' ')}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                {user?.role === 'ADMIN' && 'Full system access including user management'}
                {user?.role === 'PROJECT_MANAGER' && 'Create & manage tasks, assign to collaborators'}
                {user?.role === 'COLLABORATOR' && 'View & update status of assigned tasks'}
              </p>
            </div>

            {/* Quick stats on dark */}
            <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)' }}>
              {[
                { label: 'Tasks', value: stats.total },
                { label: 'Done', value: `${completionRate}%` },
                ...(user?.role === 'ADMIN' ? [{ label: 'Users', value: userCount }] : []),
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--rounded-md)', padding: 'var(--space-sm)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-on-dark)', fontSize: '18px', fontWeight: '400', margin: '0 0 3px' }}>{s.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, fontWeight: '400' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

const styles = {
  page: {
    width: '100%',
    /* chrome (sidebar, navbar, padding, max-width) is provided by MainLayout */
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-xl)',
    paddingBottom: 'var(--space-xl)',
    borderBottom: '1px solid var(--color-hairline)',
  },
  pageTitle: {
    fontSize: 'var(--text-title-lg)',            /* 24px */
    fontWeight: '400',
    color: 'var(--color-ink)',
    margin: '0 0 var(--space-xxs)',
    lineHeight: 1.3,
  },
  pageSubtitle: {
    color: 'var(--color-muted)',
    fontSize: 'var(--text-body-md)',
    fontWeight: '400',
    margin: 0,
  },
  statsGrid: {
    display: 'flex',
    gap: 'var(--space-md)',                       /* 16px — gutter */
    marginBottom: 'var(--space-lg)',
    flexWrap: 'wrap',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-md)',
  },
  card: {
    background: 'var(--color-canvas)',
    borderRadius: 'var(--rounded-md)',            /* 10px */
    border: '1px solid var(--color-hairline)',
    padding: 'var(--space-xl)',                   /* 32px */
  },
  cardTitle: {
    fontSize: 'var(--text-label-md)',             /* 16px */
    fontWeight: '500',
    color: 'var(--color-ink)',
    margin: '0 0 var(--space-lg)',
    lineHeight: 1.4,
  },
  taskItem: {
    background: 'var(--color-surface-soft)',
    borderRadius: 'var(--rounded-sm)',            /* 6px */
    padding: 'var(--space-sm) var(--space-md)',
    marginBottom: 'var(--space-xs)',
    border: '1px solid var(--color-hairline)',
  },
  taskBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 'var(--rounded-full)',
    fontSize: '11px',
    fontWeight: '500',
  },
};

export default Dashboard;
