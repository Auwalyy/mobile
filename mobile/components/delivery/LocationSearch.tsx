import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesService } from '../../services/GooglePlacesService';
import { LocationService } from '../../services/LocationServices';
import { LocationPoint, SearchResult } from '../../types';

interface LocationSearchProps {
  type: 'pickup' | 'dropoff';
  currentLocation: LocationPoint | null;
  defaultContactName?: string;
  defaultContactPhone?: string;
  onLocationSelect: (location: LocationPoint) => void;
  onBack: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  type,
  currentLocation,
  defaultContactName = '',
  defaultContactPhone = '',
  onLocationSelect,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [contactName, setContactName] = useState(defaultContactName);
  const [contactPhone, setContactPhone] = useState(defaultContactPhone);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(
    currentLocation
  );

  // Handle search with debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setSearching(true);
    try {
      const results = await GooglePlacesService.searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search locations');
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      const locationPoint = await LocationService.createLocationPoint(
        location,
        contactName || 'Sender',
        contactPhone || ''
      );
      setSelectedLocation(locationPoint);
      onLocationSelect(locationPoint);
    }
  };

  const handlePlaceSelect = async (result: SearchResult) => {
    const placeDetails = await GooglePlacesService.getPlaceDetails(result.placeId);
    if (!placeDetails) {
      Alert.alert('Error', 'Failed to get location details');
      return;
    }

    const locationPoint: LocationPoint = {
      address: placeDetails.address,
      city: placeDetails.city,
      lat: placeDetails.lat,
      lng: placeDetails.lng,
      contactName: contactName || (type === 'pickup' ? 'Sender' : 'Receiver'),
      contactPhone: contactPhone || '',
    };

    setSelectedLocation(locationPoint);
    onLocationSelect(locationPoint);
  };

  const handleContinue = () => {
    if (selectedLocation && contactName && contactPhone) {
      const updatedLocation = {
        ...selectedLocation,
        contactName,
        contactPhone,
      };
      onLocationSelect(updatedLocation);
    } else {
      Alert.alert('Error', 'Please enter contact information');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {type === 'pickup' ? '📍 Pickup Location' : '🎯 Dropoff Location'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search for ${type} address...`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
          >
            <Ionicons name="locate" size={18} color="#337bff" />
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#337bff" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.resultItem}
                onPress={() => handlePlaceSelect(result)}
              >
                <View style={styles.resultIcon}>
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color="#337bff"
                  />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  <Text style={styles.resultAddress} numberOfLines={2}>
                    {result.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : searchQuery.length >= 2 && !searching ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="location-off" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>No locations found</Text>
            <Text style={styles.noResultsSubtext}>
              Try a different search term
            </Text>
          </View>
        ) : null}

        {/* Contact Information */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {type === 'pickup' ? 'Sender Name' : 'Receiver Name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#999"
              value={contactName}
              onChangeText={setContactName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Selected Location Preview */}
        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationTitle}>Selected Location</Text>
            <View style={styles.selectedLocationCard}>
              <View style={styles.selectedLocationIcon}>
                <Ionicons
                  name={type === 'pickup' ? 'cube' : 'home'}
                  size={24}
                  color="#337bff"
                />
              </View>
              <View style={styles.selectedLocationDetails}>
                <Text style={styles.selectedLocationAddress} numberOfLines={2}>
                  {selectedLocation.address}
                </Text>
                <Text style={styles.selectedLocationCity}>
                  {selectedLocation.city}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedLocation || !contactName || !contactPhone) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLocation || !contactName || !contactPhone}
        >
          <Text style={styles.continueButtonText}>
            Continue to {type === 'pickup' ? 'Dropoff' : 'Details'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1eeff',
  },
  currentLocationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  contactContainer: {
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  selectedLocationContainer: {
    marginBottom: 24,
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1eeff',
  },
  selectedLocationIcon: {
    marginRight: 16,
  },
  selectedLocationDetails: {
    flex: 1,
  },
  selectedLocationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedLocationCity: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#337bff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  continueButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default LocationSearch;