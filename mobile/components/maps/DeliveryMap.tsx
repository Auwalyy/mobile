// components/maps/DeliveryMap.tsx
import React from 'react';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import { MapRegion, LocationPoint } from '../../types';

interface DeliveryMapProps {
  region: MapRegion;
  pickupLocation?: LocationPoint;  // Make optional
  dropoffLocation?: LocationPoint; // Make optional
  onRegionChange?: (region: Region) => void;
  onUserLocation?: () => void;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  region,
  pickupLocation,
  dropoffLocation,
  onRegionChange,
  onUserLocation,
}) => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Markers will be added here */}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default DeliveryMap;