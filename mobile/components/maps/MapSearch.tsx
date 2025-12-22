// components/maps/MapSearch.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface MapSearchProps {
  placeholder?: string;
  onLocationSelect: (location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => void;
  initialValue?: string;
}

const GOOGLE_API_KEY = 'AIzaSyDJBcxx-l7Rooy5_ti3CbtI3ANs4I0_WZs'

export default function MapSearch({ 
  placeholder = 'Search location...', 
  onLocationSelect,
  initialValue = '' 
}: MapSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const searchLocations = async (searchText: string) => {
    if (searchText.length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: searchText,
            key: GOOGLE_API_KEY,
            components: 'country:ng',
            location: '9.0765,7.3986', // Abuja center
            radius: 50000,
            types: 'geocode',
          },
        }
      );

      if (response.data.predictions) {
        setResults(response.data.predictions);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
     searchTimeout.current = setTimeout(() => {
      searchLocations(text);
    }, 500);
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: GOOGLE_API_KEY,
            fields: 'formatted_address,geometry,name,address_components',
          },
        }
      );

      if (response.data.result) {
        const place = response.data.result;
        
        // Extract city from address components
        let city = 'Unknown';
        if (place.address_components) {
          for (const component of place.address_components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
              break;
            }
            if (component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
              break;
            }
          }
        }

        const location = {
          address: place.formatted_address || description,
          city: city,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        };

        setQuery(location.address);
        setShowResults(false);
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Place details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const renderResultItem = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectPlace(item.place_id, item.description)}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <View style={styles.resultText}>
        <Text style={styles.resultMainText}>{item.structured_formatting.main_text}</Text>
        <Text style={styles.resultSecondaryText}>{item.structured_formatting.secondary_text}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {query ? (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : loading ? (
          <ActivityIndicator size="small" color="#666" />
        ) : null}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.place_id}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  resultMainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  resultSecondaryText: {
    fontSize: 12,
    color: '#666',
  },
});