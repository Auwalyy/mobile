import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Driver, LocationPoint } from '../../types';

interface DriverMatchingProps {
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  availableDrivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  onDriverSelect: (driver: Driver) => void;
  onBack: () => void;
  onRefresh: () => void;
}

const DriverMatching: React.FC<DriverMatchingProps> = ({
  pickupLocation,
  dropoffLocation,
  availableDrivers,
  selectedDriver,
  loading,
  onDriverSelect,
  onBack,
  onRefresh,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Finding Drivers</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337bff" />
          <Text style={styles.loadingTitle}>Searching nearby drivers</Text>
          <Text style={styles.loadingText}>
            We're finding the best drivers for your delivery
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Available Drivers</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#337bff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            {availableDrivers.length} drivers available near you
          </Text>
          <Text style={styles.summaryText}>
            Select a driver to continue with your delivery
          </Text>
        </View>

        {/* Driver Cards */}
        <View style={styles.driversContainer}>
          {availableDrivers.map((driver, index) => (
            <TouchableOpacity
              key={driver.id}
              style={[
                styles.driverCard,
                selectedDriver?.id === driver.id && styles.driverCardSelected,
              ]}
              onPress={() => onDriverSelect(driver)}
              activeOpacity={0.7}
            >
              {/* Driver Avatar */}
              <View style={styles.driverAvatar}>
                {driver.photo ? (
                  <Image
                    source={{ uri: driver.photo }}
                    style={styles.driverImage}
                  />
                ) : (
                  <View style={styles.driverInitials}>
                    <Text style={styles.initialsText}>
                      {driver.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                    </Text>
                  </View>
                )}
                {selectedDriver?.id === driver.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </View>

              {/* Driver Details */}
              <View style={styles.driverDetails}>
                <View style={styles.driverHeader}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFA000" />
                    <Text style={styles.ratingText}>{driver.rating}</Text>
                  </View>
                </View>

                <View style={styles.driverInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="car" size={16} color="#666" />
                    <Text style={styles.infoText}>{driver.vehicle}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.infoText}>{driver.distance} away</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      ETA: <Text style={styles.etaText}>{driver.eta}</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Delivery Fee:</Text>
                  <Text style={styles.priceValue}>₦1,500</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommendations */}
        {!selectedDriver && availableDrivers.length > 0 && (
          <View style={styles.recommendationContainer}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="thumbs-up" size={20} color="#4CAF50" />
              <Text style={styles.recommendationTitle}>Recommended</Text>
            </View>
            <Text style={styles.recommendationText}>
              {availableDrivers[0].name} has the highest rating and is closest to your pickup location.
            </Text>
          </View>
        )}

        {/* Safety Info */}
        <View style={styles.safetyContainer}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.safetyTitle}>Safety First</Text>
          </View>
          <View style={styles.safetyItems}>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.safetyText}>Verified drivers</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.safetyText}>Real-time tracking</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.safetyText}>Contactless delivery</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.safetyText}>Insurance coverage</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      {selectedDriver && (
        <View style={styles.footer}>
          <View style={styles.selectedDriverInfo}>
            <View style={styles.selectedDriverAvatar}>
              {selectedDriver.photo ? (
                <Image
                  source={{ uri: selectedDriver.photo }}
                  style={styles.selectedDriverImage}
                />
              ) : (
                <View style={styles.selectedDriverInitials}>
                  <Text style={styles.selectedInitialsText}>
                    {selectedDriver.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.selectedDriverDetails}>
              <Text style={styles.selectedDriverName}>{selectedDriver.name}</Text>
              <Text style={styles.selectedDriverETA}>
                Will arrive in {selectedDriver.eta}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={() => onDriverSelect(selectedDriver)}>
            <Text style={styles.confirmButtonText}>Confirm Driver</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  driversContainer: {
    paddingVertical: 20,
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  driverCardSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#337bff',
  },
  driverAvatar: {
    marginRight: 16,
    position: 'relative',
  },
  driverImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  driverInitials: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#337bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  driverDetails: {
    flex: 1,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8F00',
    marginLeft: 4,
  },
  driverInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  etaText: {
    fontWeight: '600',
    color: '#337bff',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recommendationContainer: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  safetyContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  safetyItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDriverAvatar: {
    marginRight: 12,
  },
  selectedDriverImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedDriverInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#337bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInitialsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedDriverDetails: {
    flex: 1,
  },
  selectedDriverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  selectedDriverETA: {
    fontSize: 14,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#337bff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default DriverMatching;