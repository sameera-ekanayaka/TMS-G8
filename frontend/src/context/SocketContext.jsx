import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { token, logout } = useAuth();

  useEffect(() => {
    if (!token) {
      console.log('⚠️ No token found, skipping socket connection');
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Get the WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io');
    
    console.log('🔌 Connecting to socket:', wsUrl);

    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('🔔 New notification:', data);
      setNotifications(prev => [data, ...prev]);
    });

    // Server asks this session to re-authenticate (e.g. the admin changed the
    // user's role — the role is baked into the JWT, so a fresh login is needed).
    newSocket.on('force_logout', (data) => {
      toast(data?.message || 'Your session has changed. Please log in again.', { icon: '🔄', duration: 6000 });
      logout();
    });

    // NOTE: task events (taskCreated/taskUpdated/taskDeleted/task_status_changed)
    // are handled in TaskContext, which patches the shared task state. They were
    // previously also subscribed here as console.log-only no-ops — removed to
    // avoid dead/duplicate listeners.

    setSocket(newSocket);

    // Cleanup on unmount or token change
    return () => {
      console.log('🔌 Closing socket connection');
      newSocket.close();
    };
  }, [token]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const value = {
    socket,
    isConnected,
    notifications,
    setNotifications,
    clearNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};