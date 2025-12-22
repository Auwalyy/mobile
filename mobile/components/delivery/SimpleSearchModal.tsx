import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../../types';
import { User } from '../../context/AuthContext';

interface SimpleSearchModalProps {
  visible: boolean;
  type: 'pickup' | 'dropoff';
  query: string;
  results: SearchResult[];
  loading: boolean;
  currentLocation: any;
  user: User | null;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  onUseCurrentLocation: () => void;
}

const SimpleSearchModal: React.FC<SimpleSearchModalProps> = ({
  visible,
  type,
  query,
  results,
  loading,
  currentLocation,
  user,
  onClose,
  onSearch,
  onSelect,
  onUseCurrentLocation,
}) => {
  const [inputValue, setInputValue] = useState(query);

  const handleSearch = (text: string) => {
    setInputValue(text);
    onSearch(text);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setInputValue('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {type === 'pickup' ? 'Pickup Location' : 'Dropoff Location'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${type === 'pickup' ? 'pickup' : 'delivery'} address...`}
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={handleSearch}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inputValue.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Location Option */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={onUseCurrentLocation}
        >
          <View style={styles.locationIcon}>
            <Ionicons name="locate" size={20} color="#337bff" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Use Current Location</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {currentLocation?.address || 'Your current location'}
            </Text>
          </View>
          {type === 'pickup' && user && (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>You</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="location-outline" size={22} color="#666" />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultAddress} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            inputValue.length >= 2 && !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.resultsContainer}
        />

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#337bff" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    marginRight: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  userBadge: {
    backgroundColor: '#337bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  resultsContainer: {
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default SimpleSearchModal;