import React, { useState, useEffect } from 'react';
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

interface LocationResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => void;
  initialLocation?: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  placeholder?: string;
}

export default function LocationPicker({
  label,
  value,
  onChange,
  initialLocation,
  placeholder = 'Search location...',
}: LocationPickerProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; // Add your API key here

  useEffect(() => {
    if (initialLocation) {
      setQuery(initialLocation.address);
    }
  }, [initialLocation]);

  const searchLocations = async (searchText: string) => {
    if (searchText.length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: searchText,
            key: GOOGLE_API_KEY,
            components: 'country:ng', // Nigeria only
            location: '9.0765,7.3986', // Abuja center
            radius: 50000, // 50km radius
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

  const handleSelectLocation = async (placeId: string, description: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_API_KEY,
            fields: 'formatted_address,geometry,name',
          },
        }
      );

      if (response.data.result) {
        const place = response.data.result;
        const location = {
          address: place.formatted_address || description,
          city: extractCity(place.formatted_address || description),
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        };
        
        setQuery(location.address);
        onChange(location);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Get place details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCity = (address: string): string => {
    // Simple city extraction - you can improve this
    const cities = ['Abuja', 'Lagos', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin', 'Maiduguri', 'Zaria'];
    for (const city of cities) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    return 'Unknown';
  };

  const useCurrentLocation = async () => {
    // You can integrate with expo-location here
    // For now, we'll use a mock or implement it based on your needs
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            searchLocations(text);
          }}
          onFocus={() => setShowResults(true)}
        />
        {loading && <ActivityIndicator size="small" color="#666" />}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectLocation(item.place_id, item.description)}
              >
                <Ionicons name="location-outline" size={18} color="#666" />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultMainText}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.resultSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
        </View>
      )}

      <TouchableOpacity style={styles.currentLocationButton} onPress={useCurrentLocation}>
        <Ionicons name="locate" size={18} color="#337bff" />
        <Text style={styles.currentLocationText}>Use Current Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  resultTextContainer: {
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
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
    marginLeft: 6,
  },
});