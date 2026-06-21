import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('⚠️ No token found, skipping socket connection');
      return;
    }

    // Get the WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    
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

    // Listen for task events
    newSocket.on('taskCreated', (data) => {
      console.log('📝 Task created:', data);
    });

    newSocket.on('taskUpdated', (data) => {
      console.log('📝 Task updated:', data);
    });

    newSocket.on('taskDeleted', (data) => {
      console.log('📝 Task deleted:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing socket connection');
      newSocket.close();
    };
  }, []);

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