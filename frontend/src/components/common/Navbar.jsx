import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationPanel from '../notification/NotificationPanel';
import { User, Sun, Moon } from 'lucide-react';

const formatRole = (role) =>
  (role || 'User')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)' }}
    >
      <h2 className="truncate" style={{ color: 'var(--color-ink)', fontSize: 16, fontWeight: 500 }}>
        Welcome, {user?.name || 'User'}
      </h2>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="ed-bell flex items-center justify-center transition-colors"
          style={{ width: 40, height: 40, borderRadius: 'var(--rounded-md)', color: 'var(--color-body)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <NotificationPanel />
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            background: 'var(--color-surface-soft)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--rounded-full)',
          }}
        >
          <User size={15} style={{ color: 'var(--color-muted)' }} />
          <span style={{ color: 'var(--color-body)', fontSize: 13, fontWeight: 500 }}>
            {formatRole(user?.role)}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
