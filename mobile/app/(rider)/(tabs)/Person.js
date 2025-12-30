import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useDeliveryPersonSocket } from '../../../hooks/useDeliveryPersonSocket';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function DeliveryPersonHomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const {
    connected,
    isOnline,
    currentLocation,
    newDeliveryRequest,
    goOnline,
    goOffline,
    handleAcceptDelivery,
    handleRejectDelivery
  } = useDeliveryPersonSocket();

  useEffect(() => {
    if (!user || !token) {
      Alert.alert(
        'Authentication Required',
        'Please login to continue',
        [{ text: 'Login', onPress: () => router.replace('/auth/login') }]
      );
    } else {
      setIsAuthenticated(true);
    }
  }, [user, token]);

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Checking authentication...</Text>
      </View>
    );
  }

  const handleToggleOnline = async () => {
    if (isOnline) {
      Alert.alert(
        'Go Offline',
        'Are you sure you want to go offline?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: goOffline
          }
        ]
      );
    } else {
      await goOnline();
    }
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={[
        styles.statusBar,
        connected ? styles.statusConnected : styles.statusDisconnected
      ]}>
        <Text style={styles.statusText}>
          {connected ? '✓ Connected' : '✗ Disconnected'}
        </Text>
      </View>

      {/* Online Toggle */}
      <View style={styles.onlineToggle}>
        <View>
          <Text style={styles.onlineTitle}>
            {isOnline ? "You're Online" : "You're Offline"}
          </Text>
          <Text style={styles.onlineSubtitle}>
            {isOnline 
              ? 'Ready to receive deliveries' 
              : 'Toggle to start receiving deliveries'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          disabled={!connected}
        />
      </View>

      {/* Current Location */}
      {isOnline && currentLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          <Text style={styles.locationText}>
            Lat: {currentLocation.lat?.toFixed(6) || '0.000000'}
          </Text>
          <Text style={styles.locationText}>
            Lng: {currentLocation.lng?.toFixed(6) || '0.000000'}
          </Text>
        </View>
      )}

      {/* New Delivery Request Modal */}
      {newDeliveryRequest && (
        <View style={styles.requestModal}>
          <Text style={styles.requestTitle}>New Delivery Request!</Text>
          <Text style={styles.requestText}>
            Distance: {newDeliveryRequest.distance || 'N/A'}
          </Text>
          <Text style={styles.requestText}>
            From: {newDeliveryRequest.delivery?.pickup?.address || 
                   newDeliveryRequest.delivery?.pickupAddress || 
                   'Unknown'}
          </Text>
          <Text style={styles.requestText}>
            To: {newDeliveryRequest.delivery?.dropoff?.address || 
                 newDeliveryRequest.delivery?.dropoffAddress || 
                 'Unknown'}
          </Text>
          
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.requestButton, styles.rejectButton]}
              onPress={() => handleRejectDelivery(
                newDeliveryRequest.delivery?._id,
                'Not interested'
              )}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => handleAcceptDelivery(newDeliveryRequest.delivery?._id)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Today's Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₦0</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    padding: 12,
    alignItems: 'center',
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#F44336',
  },
  statusConnecting: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  onlineToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  onlineSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  requestModal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  requestText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    lineHeight: 20,
  },
  requestButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  requestButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});