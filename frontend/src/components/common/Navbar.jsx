import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationPanel from '../notification/NotificationPanel';
import ProfileMenu from './ProfileMenu';
import { Sun, Moon, Menu } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — opens the sidebar drawer on mobile */}
        <button
          onClick={onMenuClick}
          className="ed-bell md:hidden flex items-center justify-center transition-colors shrink-0"
          style={{ width: 40, height: 40, borderRadius: 'var(--rounded-md)', color: 'var(--color-body)' }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="truncate" style={{ color: 'var(--color-ink)', fontSize: 16, fontWeight: 500 }}>
          Welcome, {user?.name || 'User'}
        </h2>
      </div>

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
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Navbar;
