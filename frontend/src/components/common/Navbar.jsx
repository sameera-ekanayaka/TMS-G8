import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notification/NotificationPanel';
import { User } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-gray-800">
          Welcome, {user?.name || 'User'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationPanel />
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
          <User size={16} className="text-gray-500" />
          <span className="text-sm text-gray-700">{user?.role || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;