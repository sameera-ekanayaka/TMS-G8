import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock, UserPlus, MessageSquare, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { socket, isConnected } = useSocket();
  const { token } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getNotifications(token);
      const rawNotifications = response.data.notifications || [];
      // Map backend response to expected format
      const mappedNotifications = rawNotifications.map(notif => ({
        ...notif,
        createdAt: notif.createdAt || new Date().toISOString(),
        type: notif.type || mapNotificationType(notif),
      }));
      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map notification type based on content
  const mapNotificationType = (notif) => {
    const message = notif.message || '';
    if (message.includes('assigned')) return 'task_assigned';
    if (message.includes('status')) return 'status_change';
    if (message.includes('comment')) return 'comment';
    if (message.includes('deadline') || message.includes('due')) return 'deadline';
    return 'admin_update';
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for specific events from backend
    const handleTaskAssigned = (data) => {
      console.log('📋 Task assigned event:', data);
      const newNotification = {
        id: data.id || Date.now(),
        message: data.message || `Task "${data.taskTitle}" assigned to you`,
        type: 'task_assigned',
        createdAt: data.timestamp || new Date().toISOString(),
        isRead: false,
        taskId: data.taskId || (data.task && data.task.id),
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleTaskStatusChanged = (data) => {
      console.log('🔄 Task status changed:', data);
      const newNotification = {
        id: data.id || Date.now(),
        message: data.message || `Task "${data.taskTitle}" status changed to ${data.newStatus}`,
        type: 'status_change',
        createdAt: data.timestamp || new Date().toISOString(),
        isRead: false,
        taskId: data.taskId || (data.task && data.task.id),
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle task comment events (if backend supports)
    const handleTaskCommented = (data) => {
      console.log('💬 Comment added:', data);
      const newNotification = {
        id: data.id || Date.now(),
        message: data.message || `New comment on "${data.taskTitle}"`,
        type: 'comment',
        createdAt: data.timestamp || new Date().toISOString(),
        isRead: false,
        taskId: data.taskId || (data.task && data.task.id),
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle deadline approaching events
    const handleDeadlineApproaching = (data) => {
      console.log('⏰ Deadline approaching:', data);
      const newNotification = {
        id: data.id || Date.now(),
        message: data.message || `Task "${data.taskTitle}" is due soon!`,
        type: 'deadline',
        createdAt: data.timestamp || new Date().toISOString(),
        isRead: false,
        taskId: data.taskId || (data.task && data.task.id),
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle administrative updates (role change, project-manager assignment)
    const handleAdminUpdate = (data) => {
      console.log('🛠️ Admin update:', data);
      const newNotification = {
        id: data.id || Date.now(),
        message: data.message,
        type: 'admin_update',
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
        taskId: data.taskId || null,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Register event listeners
    socket.on('task_assigned', handleTaskAssigned);
    socket.on('task_status_changed', handleTaskStatusChanged);
    socket.on('comment_added', handleTaskCommented);
    socket.on('deadline_approaching', handleDeadlineApproaching);
    socket.on('admin_update', handleAdminUpdate);

    // Handle reconnection - fetch missed notifications
    const handleReconnect = () => {
      console.log('🔄 Socket reconnected - fetching missed notifications');
      fetchNotifications();
    };

    socket.on('connect', handleReconnect);

    // Cleanup
    return () => {
      socket.off('task_assigned', handleTaskAssigned);
      socket.off('task_status_changed', handleTaskStatusChanged);
      socket.off('comment_added', handleTaskCommented);
      socket.off('deadline_approaching', handleDeadlineApproaching);
      socket.off('admin_update', handleAdminUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [socket]);

  // Initial fetch when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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
    if (!timestamp) return 'Just now';
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

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.taskId) {
      setIsOpen(false);
      navigate(`/tasks?taskId=${notif.taskId}`);
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
        className="ed-bell relative flex items-center justify-center transition-colors"
        style={{ width: 40, height: 40, borderRadius: 'var(--rounded-md)', color: 'var(--color-body)' }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center"
            style={{
              top: 4, right: 4, height: 17, minWidth: 17, padding: '0 4px',
              background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 600,
              borderRadius: 'var(--rounded-full)', border: '2px solid var(--color-canvas)',
            }}
          >
            {unreadCount}
          </span>
        )}
        {!isConnected && (
          <span
            className="absolute"
            style={{ bottom: 4, right: 4, width: 9, height: 9, background: 'var(--color-warning)', borderRadius: '50%', border: '2px solid var(--color-canvas)' }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 flex flex-col z-50 ed-scroll"
          style={{
            width: 360, maxHeight: 500, background: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="flex justify-between items-center px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-hairline)' }}
          >
            <div className="flex items-center gap-2">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>Notifications</h3>
              {!isConnected && (
                <span className="ed-badge ed-badge-medium">Offline</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-link)' }}
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--color-faint)' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto ed-scroll">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="ed-spinner" style={{ width: 28, height: 28 }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center" style={{ color: 'var(--color-muted)' }}>
                <Bell size={30} className="mx-auto mb-2" style={{ color: 'var(--color-hairline-strong)' }} />
                <p style={{ fontSize: 14 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="ed-notif px-4 py-3 transition-colors cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--color-hairline)',
                    background: !notif.isRead ? 'var(--color-info-soft)' : 'transparent',
                  }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--color-body)', fontWeight: !notif.isRead ? 500 : 400 }}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p style={{ fontSize: 11.5, color: 'var(--color-faint)' }}>{formatTime(notif.createdAt)}</p>
                        {!notif.isRead && (
                          <span className="ed-badge ed-badge-progress">New</span>
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