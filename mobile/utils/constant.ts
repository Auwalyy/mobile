export const GOOGLE_API_KEY = 'AIzaSyDJBcxx-l7Rooy5_ti3CbtI3ANs4I0_WZs';

export const DELIVERY_TYPES = {
  small: { label: 'Small', multiplier: 1 },
  medium: { label: 'Medium', multiplier: 1.5 },
  large: { label: 'Large', multiplier: 2 }
} as const;

export const PRICING = {
  BASE_FARE: 1000,
  DISTANCE_RATE: 200,
  MIN_WEIGHT: 0.5,
  MAX_WEIGHT: 50
} as const;

export const POPULAR_LOCATIONS = [
  { name: 'Victoria Island', address: 'Victoria Island, Lagos' },
  { name: 'Lekki Phase 1', address: 'Lekki Phase 1, Lagos' },
  { name: 'Ikeja', address: 'Ikeja, Lagos' },
  { name: 'Surulere', address: 'Surulere, Lagos' },
  { name: 'Apapa', address: 'Apapa, Lagos' },
] as const;

// Interface for Map Region
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Location interface for coordinates
export interface SimpleLocation {
  lat: number;
  lng: number;
  city: string;
}

// Map settings with both formats
export const MAP_SETTINGS = {
  LATITUDE_DELTA: 0.0922,
  LONGITUDE_DELTA: 0.0421,
  
  // For MapView region
  DEFAULT_LOCATION: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } as MapRegion,
  
  // For simple coordinates
  DEFAULT_COORDINATES: {
    lat: 6.5244,
    lng: 3.3792,
    city: 'Lagos'
  } as SimpleLocation
} as const;