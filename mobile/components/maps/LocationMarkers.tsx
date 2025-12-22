import React from 'react';
import { Marker, Polyline } from 'react-native-maps';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationPoint } from '../../types/delivery.types';

interface LocationMarkersProps {
  pickupLocation?: LocationPoint;
  dropoffLocation?: LocationPoint;
}

const LocationMarkers: React.FC<LocationMarkersProps> = ({
  pickupLocation,
  dropoffLocation,
}) => {
  return (
    <>
      {/* Pickup Marker */}
      {pickupLocation && (
        <Marker
          coordinate={{
            latitude: pickupLocation.lat,
            longitude: pickupLocation.lng,
          }}
          title="Pickup Location"
          description={pickupLocation.address}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.pickupMarker]}>
              <Ionicons name="arrow-up-circle" size={22} color="white" />
            </View>
          </View>
        </Marker>
      )}

      {/* Dropoff Marker */}
      {dropoffLocation && (
        <Marker
          coordinate={{
            latitude: dropoffLocation.lat,
            longitude: dropoffLocation.lng,
          }}
          title="Dropoff Location"
          description={dropoffLocation.address}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.dropoffMarker]}>
              <Ionicons name="flag" size={22} color="white" />
            </View>
          </View>
        </Marker>
      )}

      {/* Route Line */}
      {pickupLocation && dropoffLocation && (
        <Polyline
          coordinates={[
            { latitude: pickupLocation.lat, longitude: pickupLocation.lng },
            { latitude: dropoffLocation.lat, longitude: dropoffLocation.lng },
          ]}
          strokeColor="#337bff"
          strokeWidth={3}
          lineDashPattern={[10, 10]}
        />
      )}
    </>
  );
};

const styles = {
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: '#4CAF50',
  },
  dropoffMarker: {
    backgroundColor: '#F44336',
  },
};

export default LocationMarkers;