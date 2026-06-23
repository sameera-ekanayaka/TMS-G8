import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Kanban, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: List, label: 'Tasks' },
    { path: '/kanban', icon: Kanban, label: 'Kanban' },
    // Users management is admin-only (route is also guarded in App.jsx)
    ...(user?.role === 'ADMIN'
      ? [{ path: '/users', icon: Users, label: 'Users' }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-blue-600">TMS</h1>
        <p className="text-xs text-gray-500">Task Management System</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;