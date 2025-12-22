export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  timestamp: number;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
  city: string;
  placeId?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  secondaryText: string;
  placeId: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error?: string;
}