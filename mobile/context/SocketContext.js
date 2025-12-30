// context/SocketContext.js - Simplified version for your app
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Server configuration
const SERVER_CONFIG = {
  development: {
    android: 'http://10.0.2.2:5000',
    ios: 'http://localhost:5000',
    default: 'http://192.168.1.100:5000', // CHANGE THIS to your computer's IP
  },
  production: 'https://your-production-server.com',
};

const getServerUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return SERVER_CONFIG.development.android;
    } else if (Platform.OS === 'ios') {
      return SERVER_CONFIG.development.ios;
    }
    return SERVER_CONFIG.development.default;
  }
  return SERVER_CONFIG.production;
};

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (isAuthenticated && token && user) {
      console.log('🔌 User authenticated, connecting socket...');
      connectSocket();
    } else {
      console.log('❌ User not authenticated, disconnecting socket...');
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, user]);

  const connectSocket = () => {
    // Don't create duplicate connections
    if (socketRef.current?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    try {
      const serverUrl = getServerUrl();
      console.log('🔗 Connecting to:', serverUrl);

      const socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setConnected(true);
        setError(null);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err.message);
        setConnected(false);
        setError(err.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        setConnected(true);
        setError(null);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('❌ Socket initialization error:', err);
      setError(err.message);
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitting: ${event}`);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  const value = {
    socket: socketRef.current,
    connected,
    error,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};