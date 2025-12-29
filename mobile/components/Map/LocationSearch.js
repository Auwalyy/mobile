
// components/Map/LocationSearch.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../utils/constants';

export const LocationSearch = ({ onLocationSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchLocation = async (text) => {
    setQuery(text);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Using Google Places API
      const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_API_KEY}`
      );

      const data = await response.json();

      if (data.predictions) {
        setResults(data.predictions);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (place) => {
    try {
      // Get place details to get coordinates
      const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`
      );

      const data = await response.json();

      if (data.result) {
        const location = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          address: data.result.formatted_address,
          name: data.result.name,
        };

        onLocationSelect(location);
        setQuery(data.result.formatted_address);
        setResults([]);
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={searchLocation}
          placeholder={placeholder || 'Search location...'}
          placeholderTextColor={COLORS.gray}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        )}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => selectLocation(item)}
              >
                <Text style={styles.resultText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    color: COLORS.dark,
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  resultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  resultText: {
    fontSize: 14,
    color: COLORS.dark,
  },
});
