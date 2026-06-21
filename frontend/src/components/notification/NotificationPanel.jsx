import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock, UserPlus, MessageSquare, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const token = localStorage.getItem('token');

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getNotifications(token);
      const fetchedNotifications = response.data.notifications || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Real-time notification listener
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const getIcon = (type) => {
    const icons = {
      task_assigned: <UserPlus className="text-blue-500" size={20} />,
      status_change: <CheckCircle className="text-green-500" size={20} />,
      comment: <MessageSquare className="text-purple-500" size={20} />,
      deadline: <Clock className="text-red-500" size={20} />,
      admin_update: <AlertCircle className="text-yellow-500" size={20} />,
    };
    return icons[type] || <Bell className="text-gray-500" size={20} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      task_assigned: 'border-blue-500',
      status_change: 'border-green-500',
      comment: 'border-purple-500',
      deadline: 'border-red-500',
      admin_update: 'border-yellow-500',
    };
    return colors[type] || 'border-gray-300';
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(token, id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border max-h-[500px] flex flex-col z-50">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-gray-55 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-blue-50' : ''
                  } border-l-4 ${getTypeColor(notif.type)}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-medium' : 'text-gray-650'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{formatTime(notif.createdAt)}</p>
                        {!notif.isRead && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;