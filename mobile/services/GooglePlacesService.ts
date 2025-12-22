import { Alert } from 'react-native';
import { SearchResult, PlaceDetails } from '../types/location.types';
import { GOOGLE_API_KEY } from '../utils/constant';

export class GooglePlacesService {
  static async searchPlaces(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(query)}&` +
        `key=${GOOGLE_API_KEY}&` +
        `components=country:ng&` +
        `language=en&` +
        `location=6.5244,3.3792&` +
        `radius=50000`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map((prediction: any) => ({
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          secondaryText: prediction.structured_formatting.secondary_text,
          placeId: prediction.place_id,
        }));
      }
      
      if (data.status === 'ZERO_RESULTS') {
        return [];
      }
      
      throw new Error(data.error_message || 'Search failed');
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search locations. Check your internet connection.');
      return [];
    }
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&` +
        `key=${GOOGLE_API_KEY}&` +
        `fields=geometry,formatted_address,name,address_components,vicinity`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address || 
                       data.result.name || 
                       data.result.vicinity || 
                       'Unknown location';
        
        // Extract city
        let city = 'Lagos';
        if (data.result.address_components) {
          const cityComponent = data.result.address_components.find((component: any) => 
            component.types.includes('locality')
          );
          if (cityComponent) {
            city = cityComponent.long_name;
          }
        }
        
        return { lat, lng, address, city, placeId };
      }
      
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }
}