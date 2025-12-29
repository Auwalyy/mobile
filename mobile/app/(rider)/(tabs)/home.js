import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { deliveryService } from '../../../services/delivery';
import { SafeMapView as MapView, SafeMarker as Marker, SafeProvider as PROVIDER_GOOGLE } from '../../../utils/mapWrapper';
import * as Location from 'expo-location';
import { COLORS } from '../../../utils/constants';

const { width, height } = Dimensions.get('window');

export default function RiderHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const mapRef = useRef(null);

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [acceptingDelivery, setAcceptingDelivery] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 4.8156, // Port Harcourt coordinates
    longitude: 7.0498,
  });
  const [locationName, setLocationName] = useState('Getting location...');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [watchingLocation, setWatchingLocation] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);
  
  // Map states
  const [region, setRegion] = useState({
    latitude: 4.8156,
    longitude: 7.0498,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
    fetchNearbyDeliveries();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionGranted) {
        startWatchingLocation();
      }
      return () => {
        stopWatchingLocation();
      };
    }, [permissionGranted])
  );

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see nearby deliveries',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      
      // Update map region
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Get address
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const readableAddress = [
            address.name,
            address.street,
            address.city
          ].filter(Boolean).join(', ');
          setLocationName(readableAddress || 'Current Location');
        }
      } catch (geocodeError) {
        console.error('Geocode error:', geocodeError);
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

    } catch (error) {
      console.error('Get location error:', error);
    }
  };

  const startWatchingLocation = async () => {
    if (watchingLocation) return;

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50, // Update every 50 meters
          timeInterval: 30000, // Update every 30 seconds
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation({ latitude, longitude });
        }
      );

      setLocationSubscription(sub);
      setWatchingLocation(true);
    } catch (error) {
      console.error('Watch location error:', error);
    }
  };

  const stopWatchingLocation = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setWatchingLocation(false);
  };

  const fetchNearbyDeliveries = async () => {
    try {
      setLoading(true);
      
      if (!currentLocation.latitude || !currentLocation.longitude) {
        await getCurrentLocation();
      }

      const response = await deliveryService.getNearbyDeliveries(
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      if (response.success) {
        setDeliveries(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load deliveries');
      }
    } catch (error) {
      console.error('Fetch nearby deliveries error:', error);
      Alert.alert('Error', 'Failed to load nearby deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptDelivery = async (deliveryId) => {
    try {
      setAcceptingDelivery(true);
      
      const response = await deliveryService.acceptDelivery(deliveryId);
      
      if (response.success) {
        Alert.alert(
          'Delivery Accepted',
          'You have successfully accepted this delivery',
          [
            {
              text: 'View Details',
              onPress: () => {
                router.push(`/delivery/${deliveryId}`);
              }
            },
            {
              text: 'OK',
              onPress: () => {
                fetchNearbyDeliveries();
              }
            }
          ]
        );
        setShowDeliveryDetails(false);
        setSelectedDelivery(null);
      } else {
        Alert.alert('Error', response.message || 'Failed to accept delivery');
      }
    } catch (error) {
      console.error('Accept delivery error:', error);
      Alert.alert('Error', 'Failed to accept delivery. Please try again.');
    } finally {
      setAcceptingDelivery(false);
    }
  };

  const handleSelectDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetails(true);
    
    // Animate map to show pickup location
    if (mapRef.current && delivery.pickup?.location) {
      mapRef.current.animateToRegion({
        latitude: delivery.pickup.lat || delivery.pickup.location.coordinates[1],
        longitude: delivery.pickup.lng || delivery.pickup.location.coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); // Distance in km
  };

  const calculateFare = (distance) => {
    // Simple fare calculation: ₦200 base + ₦100 per km
    const baseFare = 200;
    const perKm = 100;
    return baseFare + (distance * perKm);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyDeliveries();
    getCurrentLocation();
  };

  const renderDeliveryItem = ({ item }) => {
    const pickupLat = item.pickup?.lat || item.pickup?.location?.coordinates[1];
    const pickupLng = item.pickup?.lng || item.pickup?.location?.coordinates[0];
    
    const distance = currentLocation.latitude ? 
      calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        pickupLat,
        pickupLng
      ) : 'N/A';
    
    const estimatedFare = distance !== 'N/A' ? calculateFare(parseFloat(distance)) : 0;

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => handleSelectDelivery(item)}
        activeOpacity={0.7}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryType}>
            <Text style={styles.deliveryTypeText}>
              {item.itemType?.toUpperCase() || 'DELIVERY'}
            </Text>
          </View>
          <View style={styles.deliveryDistance}>
            <Text style={styles.distanceText}>{distance} km</Text>
          </View>
        </View>

        <View style={styles.deliveryBody}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.pickupDot]} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {item.pickup?.address || 'No address'}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.dropoffDot]} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>DROPOFF</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {item.dropoff?.address || 'No address'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.deliveryFooter}>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare:</Text>
            <Text style={styles.fareAmount}>₦{estimatedFare}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleSelectDelivery(item)}
          >
            <Text style={styles.acceptButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDeliveryDetails = () => (
    <Modal
      visible={showDeliveryDetails}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowDeliveryDetails(false);
        setSelectedDelivery(null);
      }}
    >
      <View style={styles.detailsModalContainer}>
        <View style={styles.detailsModalContent}>
          {/* Modal Header */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowDeliveryDetails(false);
                setSelectedDelivery(null);
              }}
              style={styles.detailsBackButton}
            >
              <Text style={styles.detailsBackText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Delivery Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            {/* Delivery Info */}
            <View style={styles.detailsSection}>
              <View style={styles.deliveryIdRow}>
                <Text style={styles.deliveryIdLabel}>Delivery ID:</Text>
                <Text style={styles.deliveryId}>{selectedDelivery?._id?.substring(0, 8)}...</Text>
              </View>
              
              <View style={styles.deliveryStatus}>
                <Text style={styles.deliveryStatusText}>
                  Status: {selectedDelivery?.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Pickup Location</Text>
              <View style={styles.locationCard}>
                <View style={[styles.locationDotLarge, styles.pickupDot]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress} numberOfLines={3}>
                    {selectedDelivery?.pickup?.address || 'No address provided'}
                  </Text>
                  {selectedDelivery?.pickup?.instructions && (
                    <Text style={styles.instructions}>
                      Instructions: {selectedDelivery.pickup.instructions}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Dropoff Location */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Dropoff Location</Text>
              <View style={styles.locationCard}>
                <View style={[styles.locationDotLarge, styles.dropoffDot]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress} numberOfLines={3}>
                    {selectedDelivery?.dropoff?.address || 'No address provided'}
                  </Text>
                  {selectedDelivery?.dropoff?.instructions && (
                    <Text style={styles.instructions}>
                      Instructions: {selectedDelivery.dropoff.instructions}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Package Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Package Details</Text>
              <View style={styles.packageCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedDelivery?.itemType?.toUpperCase() || 'PACKAGE'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>
                    {selectedDelivery?.itemDescription || 'No description'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}>
                    {selectedDelivery?.itemWeight || 1} kg
                  </Text>
                </View>
              </View>
            </View>

            {/* Fare Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Fare Details</Text>
              <View style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Distance:</Text>
                  <Text style={styles.fareValue}>
                    {selectedDelivery?.estimatedDistanceMeters ? 
                      (selectedDelivery.estimatedDistanceMeters / 1000).toFixed(1) : 'N/A'} km
                  </Text>
                </View>
                
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Duration:</Text>
                  <Text style={styles.fareValue}>
                    {selectedDelivery?.estimatedDurationSec ? 
                      Math.ceil(selectedDelivery.estimatedDurationSec / 60) : 'N/A'} mins
                  </Text>
                </View>
                
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Fare:</Text>
                  <Text style={styles.fareAmount}>
                    ₦{selectedDelivery?.estimatedDistanceMeters ? 
                      calculateFare(selectedDelivery.estimatedDistanceMeters / 1000) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => {
                  setShowDeliveryDetails(false);
                  setSelectedDelivery(null);
                }}
              >
                <Text style={styles.declineButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptActionButton]}
                onPress={() => selectedDelivery && acceptDelivery(selectedDelivery._id)}
                disabled={acceptingDelivery}
              >
                {acceptingDelivery ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.acceptActionButtonText}>Accept Delivery</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                By accepting this delivery, you agree to complete it as per the instructions provided.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading nearby deliveries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          description={locationName}
          pinColor={COLORS.primary}
        />

        {/* Delivery Markers */}
        {deliveries.map((delivery) => {
          const pickupLat = delivery.pickup?.lat || delivery.pickup?.location?.coordinates[1];
          const pickupLng = delivery.pickup?.lng || delivery.pickup?.location?.coordinates[0];
          
          if (!pickupLat || !pickupLng) return null;

          return (
            <Marker
              key={delivery._id}
              coordinate={{
                latitude: pickupLat,
                longitude: pickupLng,
              }}
              title={`Delivery #${delivery._id?.substring(0, 6)}`}
              description={`${delivery.itemType} - ${calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                pickupLat,
                pickupLng
              )} km away`}
              onPress={() => handleSelectDelivery(delivery)}
            >
              <View style={styles.deliveryMarker}>
                <Text style={styles.deliveryMarkerText}>📦</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationName} numberOfLines={1}>
                {locationName}
              </Text>
            </View>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Rider'}!</Text>
          <Text style={styles.subGreeting}>
            {deliveries.length > 0 
              ? `Found ${deliveries.length} nearby deliveries` 
              : 'Looking for nearby deliveries...'}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>
            Nearby Deliveries ({deliveries.length})
          </Text>
        </View>

        {deliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Deliveries Nearby</Text>
            <Text style={styles.emptyText}>
              New delivery requests will appear here
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            keyExtractor={(item) => item._id}
            renderItem={renderDeliveryItem}
            contentContainerStyle={styles.deliveriesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Delivery Details Modal */}
      {renderDeliveryDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  welcomeContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.gray,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.gray,
    borderRadius: 3,
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  deliveriesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryType: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deliveryTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  deliveryDistance: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  deliveryBody: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  pickupDot: {
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    backgroundColor: COLORS.danger,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareContainer: {
    flex: 1,
  },
  fareLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  deliveryMarker: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  deliveryMarkerText: {
    fontSize: 20,
  },
  // Modal Styles
  detailsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.85,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  detailsBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBackText: {
    fontSize: 20,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  detailsContent: {
    paddingHorizontal: 20,
  },
  detailsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  deliveryIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryIdLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  deliveryId: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  deliveryStatus: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  deliveryStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    color: COLORS.dark,
    lineHeight: 22,
  },
  instructions: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  packageCard: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
  },
  fareCard: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  fareValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.light,
  },
  acceptActionButton: {
    backgroundColor: COLORS.primary,
  },
  declineButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptActionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});