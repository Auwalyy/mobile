// hooks/useDeliverySocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IMPORTANT: Replace with your actual server IP
const SOCKET_URL = 'http://10.151.213.235:5000';

export const useDeliverySocket = () => {
  const [connected, setConnected] = useState(false);
  const [searching, setSearching] = useState(false);
  const [assignedDelivery, setAssignedDelivery] = useState(null);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [error, setError] = useState(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const currentDeliveryIdRef = useRef(null);

  const connect = useCallback(async () => {
    // Prevent multiple connection attempts
    if (socketRef.current?.connected || !mountedRef.current) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log('⚠️ No auth credentials, skipping socket connection');
        setConnectionAttempted(true);
        return;
      }

      console.log('🔌 Attempting socket connection to:', SOCKET_URL);

      // Disconnect any existing socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Create new socket connection
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Try polling first
        reconnection: false, // Manual reconnection
        timeout: 10000,
        autoConnect: true
      });

      // Connection successful
      socketRef.current.on('connect', () => {
        if (!mountedRef.current) return;
        console.log('✅ Socket connected:', socketRef.current.id);
        setConnected(true);
        setError(null);
        setConnectionAttempted(true);
      });

      // Connection error
      socketRef.current.on('connect_error', (err) => {
        if (!mountedRef.current) return;
        console.error('❌ Socket connection error:', err.message);
        setConnected(false);
        setError(err.message);
        setConnectionAttempted(true);
      });

      // Disconnected
      socketRef.current.on('disconnect', (reason) => {
        if (!mountedRef.current) return;
        console.log('🔌 Socket disconnected:', reason);
        setConnected(false);
      });

      // General error
      socketRef.current.on('error', (err) => {
        if (!mountedRef.current) return;
        console.error('❌ Socket error:', err);
      });

      // ==========================================
      // DELIVERY EVENTS
      // ==========================================

      socketRef.current.on('delivery:searching', (data) => {
        if (!mountedRef.current) return;
        console.log('🔍 Searching:', data);
        setSearching(true);
        setNearbyCount(data.nearbyCount || 0);
      });

      socketRef.current.on('delivery:assigned', (data) => {
        if (!mountedRef.current) return;
        console.log('✅ Assigned:', data);
        setSearching(false);
        setAssignedDelivery(data.delivery);
        currentDeliveryIdRef.current = null;
      });

      socketRef.current.on('delivery:no_persons_available', (data) => {
        if (!mountedRef.current) return;
        console.log('⚠️ No persons available');
        setSearching(false);
        setNearbyCount(0);
        currentDeliveryIdRef.current = null;
      });

      socketRef.current.on('delivery:auto_cancelled', (data) => {
        if (!mountedRef.current) return;
        console.log('❌ Auto-cancelled');
        setSearching(false);
        currentDeliveryIdRef.current = null;
      });

      socketRef.current.on('delivery:cancelled', (data) => {
        if (!mountedRef.current) return;
        console.log('❌ Cancelled');
        setSearching(false);
        currentDeliveryIdRef.current = null;
      });

      socketRef.current.on('delivery:search_error', (data) => {
        if (!mountedRef.current) return;
        console.error('❌ Search error:', data);
        setSearching(false);
        setError(data.message);
        currentDeliveryIdRef.current = null;
      });

    } catch (error) {
      console.error('❌ Socket setup error:', error);
      setError(error.message);
      setConnectionAttempted(true);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const createDeliveryAndSearch = useCallback((delivery, pickupLocation) => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket not connected');
      return false;
    }

    console.log('📦 Creating delivery and searching');
    currentDeliveryIdRef.current = delivery._id;
    setSearching(true);
    setNearbyCount(0);
    setAssignedDelivery(null);

    socketRef.current.emit('delivery:create_and_search', {
      delivery,
      pickupLocation
    });

    return true;
  }, []);

  const cancelDeliverySearch = useCallback(() => {
    if (!socketRef.current?.connected || !currentDeliveryIdRef.current) {
      console.error('❌ Cannot cancel');
      return;
    }

    socketRef.current.emit('delivery:cancel_search', {
      deliveryId: currentDeliveryIdRef.current
    });

    setSearching(false);
    setNearbyCount(0);
    currentDeliveryIdRef.current = null;
  }, []);

  const trackDelivery = useCallback((deliveryId) => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket not connected');
      return;
    }

    socketRef.current.emit('delivery:track', { deliveryId });
  }, []);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    searching,
    assignedDelivery,
    nearbyCount,
    error,
    connectionAttempted,
    createDeliveryAndSearch,
    cancelDeliverySearch,
    trackDelivery,
    reconnect: connect,
    disconnect
  };
};