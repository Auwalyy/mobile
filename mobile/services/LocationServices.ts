// services/locationService.ts
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const locationService = {
  // Request location permission
  requestPermission: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  },

  // Get current location
  getCurrentLocation: async () => {
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Location permission is required to use this feature');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        return {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          address: `${address.street || ''} ${address.name || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
          city: address.city || 'Unknown',
        };
      }

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        address: 'Current Location',
        city: 'Unknown',
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  },

  // Calculate distance between two points (in km)
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Calculate price based on distance, weight, and type
  calculatePrice: (
    distance: number, 
    weight: number, 
    type: 'small' | 'medium' | 'large'
  ): number => {
    const baseRate = 500;
    const distanceRate = distance * 100;
    const weightRate = weight * 50;
    
    let sizeMultiplier = 1;
    if (type === 'medium') sizeMultiplier = 1.5;
    if (type === 'large') sizeMultiplier = 2;
    
    return Math.round((baseRate + distanceRate + weightRate) * sizeMultiplier);
  },
};