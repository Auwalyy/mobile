import React from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../../types/location.types';
import { POPULAR_LOCATIONS } from '../../utils/constant';

interface SearchModalProps {
  visible: boolean;
  type: 'pickup' | 'dropoff';
  query: string;
  results: SearchResult[];
  loading: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  onUseCurrentLocation: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  type,
  query,
  results,
  loading,
  onClose,
  onSearch,
  onSelect,
  onUseCurrentLocation,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {type === 'pickup' ? 'Change Pickup Location' : 'Enter Dropoff Location'}
          </Text>
          <View style={styles.spacer} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search for ${type} address...`}
            value={query}
            onChangeText={onSearch}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator size="small" color="#337bff" />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => onSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location Button */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={onUseCurrentLocation}
        >
          <Ionicons name="locate" size={20} color="#337bff" />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#337bff" />
              <Text style={styles.loadingText}>Searching locations...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => onSelect(item)}
                >
                  <Ionicons name="location-outline" size={22} color="#666" />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultMainText}>{item.name}</Text>
                    <Text style={styles.resultSecondaryText}>{item.secondaryText}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : query.length > 2 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>No locations found</Text>
            </View>
          ) : (
            <View style={styles.popularLocations}>
              <Text style={styles.popularTitle}>Popular Locations in Lagos</Text>
              {POPULAR_LOCATIONS.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularItem}
                  onPress={() => onSearch(location.address)}
                >
                  <Ionicons name="location" size={18} color="#337bff" />
                  <View style={styles.popularTextContainer}>
                    <Text style={styles.popularName}>{location.name}</Text>
                    <Text style={styles.popularAddress}>{location.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentLocationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultMainText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  resultSecondaryText: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  popularLocations: {
    padding: 20,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  popularTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  popularName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  popularAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default SearchModal;