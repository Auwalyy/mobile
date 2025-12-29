// components/Map/MockMapView.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MockMapView = ({ region, style, children, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>📍 Map View</Text>
      {region && (
        <Text style={styles.coordinates}>
          Lat: {region.latitude?.toFixed(6)}, Lng: {region.longitude?.toFixed(6)}
        </Text>
      )}
      {children}
    </View>
  );
};

export const Marker = ({ coordinate, title }) => {
  return (
    <View style={styles.markerContainer}>
      <View style={styles.markerDot} />
      <Text style={styles.markerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerTitle: {
    marginTop: 4,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});