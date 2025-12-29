// services/location.js
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const locationService = {
  /**
   * Request location permissions from the user
   * @returns {Promise<boolean>} - Returns true if permission granted
   */
  requestPermissions: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  },

  /**
   * Request background location permissions (for rider app)
   * @returns {Promise<boolean>}
   */
  requestBackgroundPermissions: async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Background Permission Required',
          'Please enable background location permissions for delivery tracking.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Background permission request error:', error);
      return false;
    }
  },

  /**
   * Get current location with high accuracy
   * @returns {Promise<Object>} - Location object with coordinates
   */
  getCurrentLocation: async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Get current location error:', error);
      throw error;
    }
  },

  /**
   * Watch location changes (for real-time tracking)
   * @param {Function} callback - Called when location changes
   * @returns {Promise<Object>} - Location subscription object
   */
  watchLocation: async (callback) => {
    try {
      const hasPermission = await locationService.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Watch location error:', error);
      throw error;
    }
  },

  /**
   * Reverse geocode - Convert coordinates to address
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<Object>} - Address object
   */
  reverseGeocode: async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        return {
          formattedAddress: [
            address.street,
            address.district,
            address.city,
            address.region,
            address.postalCode,
            address.country,
          ]
            .filter(Boolean)
            .join(', '),
          street: address.street || '',
          district: address.district || '',
          city: address.city || '',
          region: address.region || '',
          postalCode: address.postalCode || '',
          country: address.country || '',
          name: address.name || '',
          isoCountryCode: address.isoCountryCode || '',
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      // Fallback to Google Geocoding API if expo-location fails
      return await locationService.reverseGeocodeWithGoogle(latitude, longitude);
    }
  },

  /**
   * Reverse geocode using Google Geocoding API
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<Object>}
   */
  reverseGeocodeWithGoogle: async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          addressComponents: result.address_components,
        };
      }

      return null;
    } catch (error) {
      console.error('Google reverse geocode error:', error);
      return null;
    }
  },

  /**
   * Forward geocode - Convert address to coordinates
   * @param {string} address
   * @returns {Promise<Object>}
   */
  geocode: async (address) => {
    try {
      const result = await Location.geocodeAsync(address);

      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  },

  /**
   * Search places using Google Places API Autocomplete
   * @param {string} query - Search query
   * @param {Object} location - Current location for biasing results
   * @returns {Promise<Array>}
   */
  searchPlaces: async (query, location = null) => {
    try {
      if (query.length < 3) {
        return [];
      }

      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${GOOGLE_MAPS_API_KEY}`;

      // Add location bias if provided
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=5000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map((prediction) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
          types: prediction.types,
        }));
      }

      return [];
    } catch (error) {
      console.error('Search places error:', error);
      return [];
    }
  },

  /**
   * Get place details from place ID
   * @param {string} placeId
   * @returns {Promise<Object>}
   */
  getPlaceDetails: async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,place_id,types&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        return {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          types: place.types,
        };
      }

      return null;
    } catch (error) {
      console.error('Get place details error:', error);
      return null;
    }
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} - Distance in kilometers
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  },

  /**
   * Format distance for display
   * @param {number} distanceInKm
   * @returns {string}
   */
  formatDistance: (distanceInKm) => {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
  },

  /**
   * Get directions between two points using Google Directions API
   * @param {Object} origin - {latitude, longitude}
   * @param {Object} destination - {latitude, longitude}
   * @returns {Promise<Object>}
   */
  getDirections: async (origin, destination) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          distanceValue: leg.distance.value, // in meters
          duration: leg.duration.text,
          durationValue: leg.duration.value, // in seconds
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          steps: leg.steps,
          polyline: route.overview_polyline.points,
        };
      }

      return null;
    } catch (error) {
      console.error('Get directions error:', error);
      return null;
    }
  },

  /**
   * Check if location services are enabled
   * @returns {Promise<boolean>}
   */
  isLocationEnabled: async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Check location enabled error:', error);
      return false;
    }
  },

  /**
   * Get last known location (faster but may be outdated)
   * @returns {Promise<Object>}
   */
  getLastKnownLocation: async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getLastKnownPositionAsync();

      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
          timestamp: location.timestamp,
        };
      }

      // If no last known location, get current
      return await locationService.getCurrentLocation();
    } catch (error) {
      console.error('Get last known location error:', error);
      throw error;
    }
  },

  /**
   * Calculate estimated arrival time
   * @param {number} distanceInKm
   * @param {number} averageSpeedKmh - Default 40 km/h for urban delivery
   * @returns {string}
   */
  calculateETA: (distanceInKm, averageSpeedKmh = 40) => {
    const timeInHours = distanceInKm / averageSpeedKmh;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    }

    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours}h ${minutes}min`;
  },

  /**
   * Check if coordinates are valid
   * @param {number} latitude
   * @param {number} longitude
   * @returns {boolean}
   */
  isValidCoordinate: (latitude, longitude) => {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  },

  /**
   * Get region that fits all markers
   * @param {Array} markers - Array of {latitude, longitude} objects
   * @returns {Object} - Region object for map
   */
  getRegionForMarkers: (markers) => {
    if (!markers || markers.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = markers[0].latitude;
    let maxLat = markers[0].latitude;
    let minLng = markers[0].longitude;
    let maxLng = markers[0].longitude;

    markers.forEach((marker) => {
      minLat = Math.min(minLat, marker.latitude);
      maxLat = Math.max(maxLat, marker.latitude);
      minLng = Math.min(minLng, marker.longitude);
      maxLng = Math.max(maxLng, marker.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  },

  /**
   * Start background location tracking (for rider app)
   * @param {string} taskName
   * @returns {Promise<void>}
   */
  startBackgroundLocationTracking: async (taskName = 'BACKGROUND_LOCATION_TASK') => {
    try {
      const hasPermission = await locationService.requestBackgroundPermissions();
      
      if (!hasPermission) {
        throw new Error('Background location permission not granted');
      }

      await Location.startLocationUpdatesAsync(taskName, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: 'Delivery in Progress',
          notificationBody: 'Tracking your location for delivery',
        },
      });
    } catch (error) {
      console.error('Start background location tracking error:', error);
      throw error;
    }
  },

  /**
   * Stop background location tracking
   * @param {string} taskName
   * @returns {Promise<void>}
   */
  stopBackgroundLocationTracking: async (taskName = 'BACKGROUND_LOCATION_TASK') => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(taskName);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(taskName);
      }
    } catch (error) {
      console.error('Stop background location tracking error:', error);
      throw error;
    }
  },
};

export default locationService;