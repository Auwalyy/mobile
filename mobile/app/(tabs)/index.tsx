import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getMyDeliveries } from '@/services/DeliveryService'; // Import the function directly
import { locationService } from '@/services/LocationServices';
import DeliveryCard from '@/components/DeliveryCard';
import DeliveryModal from '@/components/DeliveryModal';
import { Delivery } from '@/types';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [userLocation, setUserLocation] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user location
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location.address);
      } else {
        setUserLocation('31, Sudan st, zone 6 Abuja');
      }

      // Get deliveries
      await fetchDeliveries();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await getMyDeliveries(1, 5);
      
      // IMPORTANT: Check the response structure
      console.log('Delivery response:', JSON.stringify(response, null, 2));
      
      // Adjust based on your API response structure
      // If response.data exists, use response.data.deliveries
      // If response.deliveries exists, use response.deliveries
      if (response.data && response.data.deliveries) {
        setDeliveries(response.data.deliveries);
      } else if (response.deliveries) {
        setDeliveries(response.deliveries);
      } else if (Array.isArray(response)) {
        setDeliveries(response);
      } else {
        setDeliveries([]);
      }
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      
      // Handle unauthorized error
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          {
            text: 'Login',
            onPress: () => logout(),
          },
        ]);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeliveryCreated = () => {
    fetchDeliveries();
  };

  const handleViewDelivery = (deliveryId: string) => {
    router.push(`/delivery/${deliveryId}`);
  };

  const handleViewAll = () => {
    router.push('/(tabs)/deliveries');
  };

  const getActiveDeliveries = () => {
    return deliveries.filter(
      d => !['delivered', 'cancelled'].includes(d.status)
    ).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => locationService.getCurrentLocation()}
        >
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {userLocation}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#337bff']}
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color="#337bff" />
            <Text style={styles.statNumber}>{deliveries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>{getActiveDeliveries()}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>
              {deliveries.filter(d => d.status === 'delivered').length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Create Delivery Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.createButtonContent}>
            <Ionicons name="cube" size={24} color="#000" />
            <View style={styles.createButtonText}>
              <Text style={styles.createButtonTitle}>Send package to</Text>
              <Text style={styles.createButtonSubtitle}>Create a new delivery</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Deliveries</Text>
            <TouchableOpacity onPress={handleViewAll}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {deliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No deliveries yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first delivery to get started
              </Text>
            </View>
          ) : (
            deliveries.slice(0, 5).map((delivery) => (
              <DeliveryCard
                key={delivery._id}
                delivery={delivery}
                onPress={() => handleViewDelivery(delivery._id)}
              />
            ))
          )}
        </View>

        {/* Footer Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Delivery Modal */}
      <DeliveryModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleDeliveryCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    maxWidth: '90%',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  createButtonText: {
    flex: 1,
  },
  createButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  createButtonSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  spacer: {
    height: 30,
  },
});