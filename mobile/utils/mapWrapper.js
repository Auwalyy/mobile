// utils/mapWrapper.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Check if we're in development with Expo Go
const isExpoGo = __DEV__ && !global.expo?.modules?.ExponentConstants?.platform;

let MapView, Marker, PROVIDER_GOOGLE;

if (!isExpoGo) {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (error) {
    // Fallback to mock if native module fails
  }
}

// Mock components for Expo Go or when native module fails
export const MockMapView = ({ region, style, children, ...props }) => (
  <View style={[styles.container, style]}>
    <Text style={styles.title}>📍 Map View</Text>
    {region && (
      <Text style={styles.coordinates}>
        Lat: {region.latitude?.toFixed(6) || '0'}, Lng: {region.longitude?.toFixed(6) || '0'}
      </Text>
    )}
    {children}
  </View>
);

export const MockMarker = ({ coordinate, title, description }) => (
  <View style={[styles.marker, { 
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -10,
    marginTop: -10
  }]}>
    <View style={styles.markerDot} />
    <Text style={styles.markerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
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
  marker: {
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF0000',
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

// Export the appropriate component
export const SafeMapView = MapView || MockMapView;
export const SafeMarker = Marker || MockMarker;
export const SafeProvider = PROVIDER_GOOGLE || 'google';


/// import  { SafeMapView as MapView, SafeMarker as Marker, SafeProvider as PROVIDER_GOOGLE } from '../utils/mapWrapper';