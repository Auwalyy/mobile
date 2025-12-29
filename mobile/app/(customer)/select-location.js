// app/(customer)/select-location.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationService } from '../../services/location';
import { LocationSearch } from '../../components/Map/LocationSearch';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { COLORS } from '../../utils/constants';

export default function SelectLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { type, returnTo } = params; // 'pickup' or 'dropoff'

  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarkerCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Get initial address
      const address = await locationService.reverseGeocode(
        location.latitude,
        location.longitude
      );
      
      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address?.formattedAddress || 'Current location',
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check permissions and try again.'
      );
      // Default location
      const defaultLocation = {
        latitude: 4.8156,
        longitude: 7.0498,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(defaultLocation);
      setMarkerCoordinate({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoordinate({ latitude, longitude });

    try {
      const address = await locationService.reverseGeocode(latitude, longitude);
      setSelectedLocation({
        latitude,
        longitude,
        address: address?.formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }
  };

  const handleLocationSelect = async (location) => {
    setMarkerCoordinate({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });
    
    setRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    setSearchVisible(false);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    // Navigate back with location data using router.back and setParams
    router.back();
    
    // Use a timeout to ensure navigation completes before setting params
    setTimeout(() => {
      router.setParams({
        [type]: JSON.stringify(selectedLocation),
      });
    }, 100);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Search Container */}
      {!searchVisible && (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Search location...</Text>
        </TouchableOpacity>
      )}

      {searchVisible && (
        <View style={styles.searchContainer}>
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder={`Search ${type} location...`}
          />
          <TouchableOpacity
            style={styles.closeSearch}
            onPress={() => setSearchVisible(false)}
          >
            <Text style={styles.closeSearchText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {markerCoordinate && (
          <Marker
            coordinate={markerCoordinate}
            title={type === 'pickup' ? 'Pickup Location' : 'Dropoff Location'}
            draggable
            onDragEnd={(e) => handleMapPress({ nativeEvent: e.nativeEvent })}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor:
                      type === 'pickup' ? COLORS.success : COLORS.danger,
                  },
                ]}
              >
                <Text style={styles.markerText}>
                  {type === 'pickup' ? '📍' : '🎯'}
                </Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Location Info Card */}
      <View style={styles.footer}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>
            {type === 'pickup' ? '📍 Pickup Location' : '🎯 Dropoff Location'}
          </Text>
          {selectedLocation && (
            <Text style={styles.locationAddress} numberOfLines={2}>
              {selectedLocation.address}
            </Text>
          )}
          <Text style={styles.hint}>
            Tap on the map or search to select a location
          </Text>
        </View>

        <Button
          title={`Confirm ${type === 'pickup' ? 'Pickup' : 'Dropoff'}`}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchButtonText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  closeSearch: {
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeSearchText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  markerText: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
});
