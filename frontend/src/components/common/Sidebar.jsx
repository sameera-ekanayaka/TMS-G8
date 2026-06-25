import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Folder, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: List, label: 'Tasks' },
    { path: '/projects', icon: Folder, label: 'Projects' },
    // users page is admin only (the route is guarded too)
    ...(user?.role === 'ADMIN'
      ? [{ path: '/users', icon: Users, label: 'Users' }]
      : []),
  ];

  return (
    <aside
      className="flex flex-col w-16 md:w-[248px] shrink-0 h-screen"
      style={{ background: 'var(--color-canvas)', borderRight: '1px solid var(--color-hairline)' }}
    >
      {/* Brand */}
      <div
        className="h-16 flex items-center px-3 md:px-6 shrink-0"
        style={{ borderBottom: '1px solid var(--color-hairline)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary)', borderRadius: 'var(--rounded-md)' }}
          >
            <span style={{ color: 'var(--color-on-primary)', fontWeight: 600, fontSize: 15 }}>T</span>
          </div>
          <div className="hidden md:block leading-tight">
            <h1 style={{ color: 'var(--color-ink)', fontWeight: 600, fontSize: 16, margin: 0 }}>TaskHub</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 11, margin: 0 }}>Task Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 md:px-3 py-4 space-y-1 overflow-y-auto ed-scroll">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 transition-colors ${isActive ? 'ed-nav-active' : 'ed-nav-idle'}`
            }
            style={{ borderRadius: 'var(--rounded-md)' }}
          >
            {({ isActive }) => (
              <>
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{
                    width: 3,
                    height: isActive ? 20 : 0,
                    background: 'var(--color-primary)',
                    borderRadius: '0 var(--rounded-full) var(--rounded-full) 0',
                    transition: 'height 0.15s ease',
                  }}
                />
                <item.icon size={19} style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-muted)', flexShrink: 0 }} />
                <span
                  className="hidden md:inline"
                  style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-body)', fontWeight: isActive ? 500 : 400, fontSize: 14 }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 md:px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-hairline)' }}>
        <button
          onClick={logout}
          title="Logout"
          className="ed-logout flex items-center gap-3 w-full px-3 py-2.5 transition-colors"
          style={{ color: 'var(--color-danger)', borderRadius: 'var(--rounded-md)' }}
        >
          <LogOut size={19} style={{ flexShrink: 0 }} />
          <span className="hidden md:inline" style={{ fontSize: 14, fontWeight: 500 }}>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
