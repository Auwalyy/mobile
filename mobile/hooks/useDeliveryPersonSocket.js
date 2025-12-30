// ============================================
// hooks/useDeliveryPersonSocket.js
// ============================================
import { useEffect, useCallback, useState, useRef } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';

// Socket configuration
const SOCKET_URL = 'http://10.151.213.235:5000'; // For Android emulator

export const useDeliveryPersonSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [newDeliveryRequest, setNewDeliveryRequest] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [deliveryPersonId, setDeliveryPersonId] = useState(null);
  
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const locationSubscriptionRef = useRef(null);

  // Socket event helper functions
  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      console.log(`📤 Emitting ${event}:`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }, [connected]);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  // Fetch delivery person ID from API
  useEffect(() => {
    const fetchDeliveryPersonId = async () => {
      if (!user?._id) return;
      
      try {
        console.log('🔍 Fetching delivery person ID for user:', user._id);
        const response = await fetch(`http://10.151.213.235:5000/api/delivery-persons/user/${user._id}`);
        const data = await response.json();
        
        if (data.success && data.deliveryPerson) {
          console.log('✅ Found delivery person ID:', data.deliveryPerson._id);
          setDeliveryPersonId(data.deliveryPerson._id);
        } else {
          console.log('❌ No delivery person found for user');
        }
      } catch (error) {
        console.error('Error fetching delivery person ID:', error);
      }
    };

    fetchDeliveryPersonId();
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) {
      console.log('User not authenticated, skipping socket connection');
      return;
    }

    console.log('🔗 Attempting socket connection...');
    console.log('📝 Auth info:', { userId: user._id, token: token ? 'Present' : 'Missing' });
    
    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token,
        userId: user._id
      },
      query: {
        userType: 'delivery_person'
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socketInstance;

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setConnected(true);
      setSocketId(socketInstance.id);
      setSocket(socketInstance);
      
      // Register connection
      socketInstance.emit('delivery_person:register', {
        userId: user._id,
        deliveryPersonId: deliveryPersonId,
        userType: 'delivery_person'
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      setConnected(false);
      
      setTimeout(() => {
        if (!connected) {
          Alert.alert(
            'Connection Error',
            'Cannot connect to server. Please check your internet connection.',
            [{ text: 'OK' }]
          );
        }
      }, 1000);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      setIsOnline(false);
      setSocketId(null);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('error', (error) => {
      console.log('❌ Socket error:', error);
      Alert.alert('Socket Error', error.message || 'An error occurred');
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.disconnect();
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [token, user, deliveryPersonId]);

  // Setup event listeners
  useEffect(() => {
    if (!socketRef.current || !connected) return;

    const socketInstance = socketRef.current;

    // Listen for new delivery requests
    const handleNewRequest = (data) => {
      console.log('📬 New delivery request received!', data);
      setNewDeliveryRequest(data);
      
      // Show notification
      Alert.alert(
        '🚚 New Delivery Request!',
        `Distance: ${data.distance || 'N/A'}\nFrom: ${data.delivery?.pickupAddress || 'Unknown'}\nTo: ${data.delivery?.dropoffAddress || 'Unknown'}\n\nYou have 30 seconds to respond`,
        [
          {
            text: '❌ Reject',
            style: 'destructive',
            onPress: () => handleRejectDelivery(data.delivery?._id, 'Not interested')
          },
          {
            text: '✅ Accept',
            onPress: () => handleAcceptDelivery(data.delivery?._id)
          }
        ],
        { cancelable: false }
      );

      // Auto-reject after 30 seconds
      setTimeout(() => {
        if (newDeliveryRequest?.delivery?._id === data.delivery?._id) {
          console.log('⏰ Auto-rejecting delivery due to timeout');
          handleRejectDelivery(data.delivery?._id, 'Timeout');
          setNewDeliveryRequest(null);
        }
      }, 30000);
    };

    const handleAssignedSuccess = (data) => {
      console.log('✅ Delivery assigned to you!', data);
      setNewDeliveryRequest(null);
      Alert.alert(
        '🎉 Delivery Assigned!',
        'You have been assigned this delivery. Please proceed to pickup location.',
        [{ text: 'OK' }]
      );
    };

    const handleAcceptError = (data) => {
      console.log('❌ Error accepting delivery', data);
      Alert.alert('Accept Error', data.message || 'Failed to accept delivery');
    };

    const handleOnlineSuccess = (data) => {
      console.log('✅ You are now online', data);
      setIsOnline(true);
      Alert.alert('Online ✅', 'You are now online and ready to receive deliveries');
    };

    const handleOfflineSuccess = (data) => {
      console.log('❌ You are now offline', data);
      setIsOnline(false);
      Alert.alert('Offline ❌', 'You are now offline');
    };

    // Test event
    const handleTestEvent = (data) => {
      console.log('🧪 Test event received:', data);
    };

    // Register event listeners
    socketInstance.on('delivery:new_request', handleNewRequest);
    socketInstance.on('delivery:assigned_success', handleAssignedSuccess);
    socketInstance.on('delivery:accept_error', handleAcceptError);
    socketInstance.on('delivery_person:online_success', handleOnlineSuccess);
    socketInstance.on('delivery_person:offline_success', handleOfflineSuccess);
    socketInstance.on('test:event', handleTestEvent);

    // Cleanup listeners
    return () => {
      socketInstance.off('delivery:new_request', handleNewRequest);
      socketInstance.off('delivery:assigned_success', handleAssignedSuccess);
      socketInstance.off('delivery:accept_error', handleAcceptError);
      socketInstance.off('delivery_person:online_success', handleOnlineSuccess);
      socketInstance.off('delivery_person:offline_success', handleOfflineSuccess);
      socketInstance.off('test:event', handleTestEvent);
    };
  }, [connected, newDeliveryRequest]);

  /**
   * Start location tracking when going online
   */
  useEffect(() => {
    const startLocationTracking = async () => {
      if (!isOnline || !connected) return;

      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Location permission is required to track your position for deliveries.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const initialLocationData = {
          lat: initialLocation.coords.latitude,
          lng: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy
        };
        
        setCurrentLocation(initialLocationData);
        
        // Send initial location to server
        if (user?._id) {
          emit('delivery_person:location_update', {
            userId: user._id,
            location: initialLocationData
          });
        }

        // Start watching position
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50,
            timeInterval: 15000,
          },
          (location) => {
            const newLocation = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              accuracy: location.coords.accuracy,
              speed: location.coords.speed,
              heading: location.coords.heading,
              timestamp: new Date().toISOString()
            };
            
            setCurrentLocation(newLocation);
            
            // Send location update to server
            if (user?._id && connected) {
              emit('delivery_person:location_update', {
                userId: user._id,
                location: newLocation
              });
            }
          }
        );

        console.log('📍 Location tracking started');

      } catch (error) {
        console.error('Error starting location tracking:', error);
        Alert.alert(
          'Location Error',
          'Failed to start location tracking. Please check your location settings.'
        );
      }
    };

    const stopLocationTracking = () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
        console.log('📍 Location tracking stopped');
      }
    };

    if (isOnline && connected) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isOnline, connected, user, emit]);

  /**
   * Go online
   */
  const goOnline = useCallback(async () => {
    if (!connected) {
      Alert.alert('Not Connected', 'Please wait for connection to server');
      return;
    }

    try {
      // Get current location first
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to go online. Please enable location services.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000
      });

      const locationData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      };

      setCurrentLocation(locationData);

      // Send go online request to server
      emit('delivery_person:online', {
        userId: user._id,
        deliveryPersonId: deliveryPersonId,
        location: locationData,
        services: { deliveries: true, rides: false },
        timestamp: new Date().toISOString()
      });

      console.log('🟢 Going online with location:', locationData);

    } catch (error) {
      console.error('Error going online:', error);
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert(
          'Location Timeout',
          'Could not get your location. Please check GPS and try again.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to go online. Please try again.'
        );
      }
    }
  }, [connected, user, deliveryPersonId, emit]);

  /**
   * Go offline
   */
  const goOffline = useCallback(() => {
    if (!connected) {
      Alert.alert('Not Connected', 'Cannot go offline - not connected to server');
      return;
    }

    // Stop location tracking immediately
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    // Notify server
    emit('delivery_person:offline', {
      userId: user._id,
      deliveryPersonId: deliveryPersonId,
      timestamp: new Date().toISOString()
    });

    // Update local state
    setIsOnline(false);
    setNewDeliveryRequest(null);
    
    console.log('🔴 Going offline');
  }, [connected, user, deliveryPersonId, emit]);

  /**
   * Accept delivery request
   */
  const handleAcceptDelivery = useCallback((deliveryId) => {
    if (!connected) {
      Alert.alert('Not Connected', 'Cannot accept delivery - not connected to server');
      return;
    }

    if (!deliveryId) {
      Alert.alert('Error', 'Invalid delivery ID');
      return;
    }

    console.log('✅ Accepting delivery:', deliveryId, 'Delivery Person:', deliveryPersonId);
    
    emit('delivery_person:accept_delivery', {
      deliveryId,
      deliveryPersonId: deliveryPersonId,
      timestamp: new Date().toISOString()
    });

    setNewDeliveryRequest(null);
  }, [connected, deliveryPersonId, emit]);

  /**
   * Reject delivery request
   */
  const handleRejectDelivery = useCallback((deliveryId, reason) => {
    if (!connected) {
      console.warn('Cannot reject delivery - not connected');
      return;
    }

    console.log('❌ Rejecting delivery:', deliveryId, 'Reason:', reason);
    
    emit('delivery_person:reject_delivery', {
      deliveryId,
      reason: reason || 'Not available',
      timestamp: new Date().toISOString()
    });

    setNewDeliveryRequest(null);
  }, [connected, emit]);

  /**
   * Test socket connection
   */
  const testSocket = useCallback(() => {
    if (!connected) return;
    
    emit('test:event', {
      message: 'Test from delivery person',
      timestamp: new Date().toISOString()
    });
  }, [connected, emit]);

  return {
    // State
    connected,
    isOnline,
    currentLocation,
    newDeliveryRequest,
    socketId,
    deliveryPersonId,
    
    // Actions
    goOnline,
    goOffline,
    handleAcceptDelivery,
    handleRejectDelivery,
    testSocket,
    
    // Helper functions
    emit,
    on,
    off
  };
};

export default useDeliveryPersonSocket;