// components/Map/MapView.js
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../utils/constants';

export const CustomMapView = ({
  initialRegion,
  markers = [],
  onRegionChangeComplete,
  onMarkerPress,
  showsUserLocation = true,
  children,
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialRegion && mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 1000);
    }
  }, [initialRegion]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={true}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress && onMarkerPress(marker)}
          >
            {marker.customMarker}
          </Marker>
        ))}
        {children}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
