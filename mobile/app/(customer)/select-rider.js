
// app/(customer)/select-rider.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { SafeMapView as MapView, SafeMarker as Marker } from '../../utils/mapWrapper';
import { RiderMarker } from '../../components/Map/RiderMarker';
import { LocationMarker } from '../../components/Map/LocationMarker';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { deliveryService } from '../../services/delivery';
import { COLORS } from '../../utils/constants';

export default function SelectRiderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [pickupLocation] = useState(JSON.parse(params.pickupLocation));
  const [dropoffLocation] = useState(JSON.parse(params.dropoffLocation));
  const [pickupContact] = useState(JSON.parse(params.pickupContact));
  const [dropoffContact] = useState(JSON.parse(params.dropoffContact));
  const [packageDetails] = useState(params.packageDetails || '');

  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchNearbyRiders();
  }, []);

  const fetchNearbyRiders = async () => {
    try {
      const nearbyRiders = await deliveryService.getNearbyRiders(pickupLocation);
      setRiders(nearbyRiders);
    } catch (error) {
      console.error('Fetch riders error:', error);
      Alert.alert('Error', 'Failed to fetch nearby riders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    if (!selectedRider) {
      Alert.alert('Error', 'Please select a rider');
      return;
    }

    setCreating(true);
    try {
      const deliveryData = {
        pickupLocation: {
          coordinates: [pickupLocation.longitude, pickupLocation.latitude],
          address: pickupLocation.address,
          contactName: pickupContact.name,
          contactPhone: pickupContact.phoneNumber,
        },
        dropoffLocation: {
          coordinates: [dropoffLocation.longitude, dropoffLocation.latitude],
          address: dropoffLocation.address,
          contactName: dropoffContact.name,
          contactPhone: dropoffContact.phoneNumber,
        },
        packageDetails,
        riderId: selectedRider.id,
      };

      await deliveryService.createDelivery(deliveryData);

      Alert.alert(
        'Success',
        'Delivery order created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(customer)/home'),
          },
        ]
      );
    } catch (error) {
      console.error('Create delivery error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create delivery'
      );
    } finally {
      setCreating(false);
    }
  };

  const renderRiderCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.riderCard,
        selectedRider?.id === item.id && styles.selectedRiderCard,
      ]}
      onPress={() => setSelectedRider(item)}
    >
      <View style={styles.riderInfo}>
        <Text style={styles.riderName}>{item.name}</Text>
        <View style={styles.riderDetails}>
          <Text style={styles.riderRating}>⭐ {item.rating}</Text>
          <Text style={styles.riderDistance}>📍 {item.distance}</Text>
        </View>
      </View>
      {selectedRider?.id === item.id && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  const midLatitude = (pickupLocation.latitude + dropoffLocation.latitude) / 2;
  const midLongitude = (pickupLocation.longitude + dropoffLocation.longitude) / 2;
  const latDelta = Math.abs(pickupLocation.latitude - dropoffLocation.latitude) * 2;
  const lonDelta = Math.abs(pickupLocation.longitude - dropoffLocation.longitude) * 2;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: midLatitude,
            longitude: midLongitude,
            latitudeDelta: Math.max(latDelta, 0.02),
            longitudeDelta: Math.max(lonDelta, 0.02),
          }}
        >
          {/* Pickup Marker */}
          <MapView.Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
          >
            <LocationMarker type="pickup" />
          </MapView.Marker>

          {/* Dropoff Marker */}
          <MapView.Marker
            coordinate={{
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            }}
          >
            <LocationMarker type="dropoff" />
          </MapView.Marker>

          {/* Rider Markers */}
          {riders.map((rider) => (
            <RiderMarker
              key={rider.id}
              rider={rider}
              onPress={() => setSelectedRider(rider)}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.ridersContainer}>
        <Text style={styles.ridersTitle}>Select a Rider</Text>
        {riders.length === 0 ? (
          <Text style={styles.noRidersText}>No riders available nearby</Text>
        ) : (
          <FlatList
            data={riders}
            keyExtractor={(item) => item.id}
            renderItem={renderRiderCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ridersList}
          />
        )}

        <Button
          title="Create Delivery"
          onPress={handleCreateDelivery}
          loading={creating}
          disabled={!selectedRider || riders.length === 0}
          style={styles.createButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  ridersContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  ridersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  ridersList: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  riderCard: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRiderCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  riderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riderRating: {
    fontSize: 14,
    color: COLORS.gray,
  },
  riderDistance: {
    fontSize: 14,
    color: COLORS.gray,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noRidersText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 14,
    marginVertical: 16,
  },
  createButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});