// app/(customer)/(tabs)/home.js - Complete with Modal
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { deliveryService } from '../../../services/delivery';
import { locationService } from '../../../services/location';
import { OrderCard } from '../../../components/OrderCard';
import { Loading } from '../../../components/common/Loading';
import { Button } from '../../../components/common/Button';
import { COLORS } from '../../../utils/constants';
import { useDeliverySocket } from '../../../hooks/useDeliverySocket';

export default function CustomerHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Socket.IO with safe access
  let socketHook = null;
  try {
    socketHook = useDeliverySocket();
  } catch (error) {
    console.log('Socket hook not available:', error);
  }
  
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState('dropoff');
  
  // Delivery form states
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState('package');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [instructions, setInstructions] = useState('');

  // Socket states
  const socketConnected = socketHook?.connected || false;
  const searchingForRiders = socketHook?.searching || false;
  const assignedDelivery = socketHook?.assignedDelivery || null;
  const nearbyCount = socketHook?.nearbyCount || 0;

  useEffect(() => {
    fetchDeliveries();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (assignedDelivery) {
      setShowCreateModal(false);
      resetForm();
      fetchDeliveries();
      router.push(`/order-details?id=${assignedDelivery._id}`);
    }
  }, [assignedDelivery]);

  const fetchDeliveries = async () => {
    try {
      const response = await deliveryService.getMyDeliveries();
      if (response.success) {
        setDeliveries(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load deliveries');
        if (response.message?.includes('token') || response.message?.includes('auth')) {
          logout();
          router.replace('/auth/login');
        }
      }
    } catch (error) {
      console.error('Fetch deliveries error:', error);
      Alert.alert('Error', 'Failed to load deliveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setCurrentLocation('Getting location...');
      const location = await locationService.getCurrentLocation();
      setCurrentCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      
      try {
        const address = await locationService.reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        const formattedAddress = address?.formattedAddress || 
          `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        
        setCurrentLocation(formattedAddress);
        setPickupLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: formattedAddress,
          name: 'My Location'
        });
      } catch (geocodeError) {
        console.error('Geocode error:', geocodeError);
        const coords = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        setCurrentLocation(coords);
        setPickupLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: coords,
          name: 'My Location'
        });
      }
    } catch (error) {
      console.error('Get location error:', error);
      setCurrentLocation('Location unavailable');
      Alert.alert('Location Error', 'Please enable location services.');
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    setSearching(true);
    setSearchResults([]);
    
    try {
      const GOOGLE_API_KEY = 'AIzaSyDJBcxx-l7Rooy5_ti3CbtI3ANs4I0_WZs';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}&components=country:ng`
      );
      
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        const results = data.predictions.map(prediction => ({
          id: prediction.place_id,
          name: prediction.structured_formatting?.main_text || prediction.description,
          address: prediction.description,
        }));
        setSearchResults(results);
      } else {
        Alert.alert('No Results', 'No locations found.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search location.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    try {
      const GOOGLE_API_KEY = 'AIzaSyDJBcxx-l7Rooy5_ti3CbtI3ANs4I0_WZs';
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.id}&key=${GOOGLE_API_KEY}`
      );
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.result) {
        const location = {
          latitude: detailsData.result.geometry.location.lat,
          longitude: detailsData.result.geometry.location.lng,
          address: detailsData.result.formatted_address || result.address,
          name: detailsData.result.name || result.name,
        };

        if (searchType === 'pickup') {
          setPickupLocation(location);
        } else {
          setDropoffLocation(location);
        }

        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Select location error:', error);
      Alert.alert('Error', 'Failed to get location details.');
    }
  };

  const handleCreateDelivery = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }

    if (!recipientName || !recipientPhone) {
      Alert.alert('Error', 'Please enter recipient details');
      return;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanedPhone = recipientPhone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setCreating(true);
    try {
      const deliveryData = {
        pickupAddress: pickupLocation.address,
        pickupLat: pickupLocation.latitude.toString(),
        pickupLng: pickupLocation.longitude.toString(),
        pickupName: pickupLocation.name,
        dropoffAddress: dropoffLocation.address,
        dropoffLat: dropoffLocation.latitude.toString(),
        dropoffLng: dropoffLocation.longitude.toString(),
        dropoffName: dropoffLocation.name,
        itemType: itemType,
        itemDescription: itemDescription || 'Package delivery',
        itemWeight: 1,
        itemValue: 0,
        customerName: user?.fullName || user?.name || 'Customer',
        customerPhone: user?.phone || '',
        recipientName: recipientName.trim(),
        recipientPhone: cleanedPhone,
        estimatedDistance: 5000,
        estimatedDuration: 600,
        deliveryInstructions: instructions,
      };

      console.log('Creating delivery...');
      const response = await deliveryService.createDelivery(deliveryData);
      
      if (response.success) {
        const delivery = response.data;
        
        // Try Socket.IO if available
        if (socketHook?.createDeliveryAndSearch && socketConnected) {
          console.log('Using Socket.IO');
          const socketSuccess = socketHook.createDeliveryAndSearch(delivery, {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude
          });

          if (socketSuccess) {
            Alert.alert(
              'Searching',
              'Looking for delivery person...',
              [{ text: 'OK' }]
            );
          } else {
            // Socket failed, show regular success
            showRegularSuccess(delivery);
          }
        } else {
          // No socket, show regular success
          showRegularSuccess(delivery);
        }
      } else {
        throw new Error(response.message || 'Failed to create delivery');
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      Alert.alert('Error', error.message || 'Failed to create delivery.');
      setCreating(false);
    }
  };

  const showRegularSuccess = (delivery) => {
    Alert.alert(
      'Success',
      'Delivery created! We will assign a delivery person shortly.',
      [
        {
          text: 'View Order',
          onPress: () => {
            setShowCreateModal(false);
            resetForm();
            fetchDeliveries();
            router.push(`/order-details?id=${delivery._id}`);
          }
        },
        {
          text: 'OK',
          onPress: () => {
            setShowCreateModal(false);
            resetForm();
            fetchDeliveries();
          }
        }
      ]
    );
    setCreating(false);
  };

  const resetForm = () => {
    if (currentCoordinates) {
      setPickupLocation({
        latitude: currentCoordinates.latitude,
        longitude: currentCoordinates.longitude,
        address: currentLocation,
        name: 'My Location'
      });
    }
    
    setDropoffLocation(null);
    setItemDescription('');
    setItemType('package');
    setRecipientName('');
    setRecipientPhone('');
    setInstructions('');
    setSearchQuery('');
    setSearchResults([]);
    setCreating(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
    getCurrentLocation();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Render Connection Status
  const renderConnectionStatus = () => {
    if (!socketHook) return null;
    
    if (!socketConnected && socketHook.connectionAttempted) {
      return null; // Hide after first attempt
    }
    
    if (!socketConnected) {
      return (
        <View style={styles.connectionStatus}>
          <View style={styles.connectionDot} />
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      );
    }
    return null;
  };

  // Render Searching Overlay
  const renderSearchingOverlay = () => {
    if (!searchingForRiders) return null;
    
    return (
      <Modal visible={true} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.searchingTitle}>Searching</Text>
            <Text style={styles.searchingText}>
              {nearbyCount > 0 
                ? `Found ${nearbyCount} nearby...`
                : 'Looking for delivery persons...'}
            </Text>
            <TouchableOpacity
              style={styles.cancelSearchButton}
              onPress={() => {
                socketHook?.cancelDeliverySearch();
                setCreating(false);
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelSearchText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Create Delivery Modal
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.modalBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Delivery</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Locations */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Locations</Text>
            
            {/* Pickup */}
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => {
                setSearchType('pickup');
                setShowSearchModal(true);
              }}
            >
              <View style={[styles.locationDot, styles.pickupDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationText} numberOfLines={2}>
                  {pickupLocation?.address || 'Select pickup location'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Dropoff */}
            <TouchableOpacity
              style={[
                styles.locationCard,
                !dropoffLocation && styles.locationCardEmpty
              ]}
              onPress={() => {
                setSearchType('dropoff');
                setShowSearchModal(true);
              }}
            >
              <View style={[styles.locationDot, styles.dropoffDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>DROPOFF</Text>
                <Text
                  style={
                    dropoffLocation
                      ? styles.locationText
                      : styles.locationPlaceholder
                  }
                  numberOfLines={2}
                >
                  {dropoffLocation?.address || 'Select dropoff location'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Item Details */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Type</Text>
              <View style={styles.typeButtons}>
                {['package', 'document', 'food', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      itemType === type && styles.typeButtonActive
                    ]}
                    onPress={() => setItemType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        itemType === type && styles.typeButtonTextActive
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What are you sending?"
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          {/* Recipient Details */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Recipient</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Recipient's name"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Recipient's phone number"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructions (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Any special instructions?"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                textAlignVertical="top"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <Button
            title={creating ? 'Creating...' : 'Create Delivery'}
            onPress={handleCreateDelivery}
            disabled={creating}
            loading={creating}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render Search Modal
  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.searchBackButton}
            onPress={() => setShowSearchModal(false)}
          >
            <Text style={styles.searchBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.searchTitle}>
            Search {searchType === 'pickup' ? 'Pickup' : 'Dropoff'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchLocation}
            placeholderTextColor={COLORS.gray}
            autoFocus
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchLocation}
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>
              {searching ? '...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.searchResultsContainer}>
          {searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.searchResultItem}
                onPress={() => handleSelectSearchResult(result)}
              >
                <Text style={styles.searchResultName}>{result.name}</Text>
                <Text style={styles.searchResultAddress} numberOfLines={2}>
                  {result.address}
                </Text>
              </TouchableOpacity>
            ))
          ) : searchQuery ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {renderConnectionStatus()}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => router.push('/profile')}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.locationSection}
          onPress={getCurrentLocation}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={2}>
              {currentLocation}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.searchIcon}>🚚</Text>
        <View style={styles.searchTextContainer}>
          <Text style={styles.searchMainText}>Create new delivery</Text>
          <Text style={styles.searchSubText}>
            {socketConnected ? 'Real-time enabled' : 'Tap to get started'}
          </Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      {/* Recent Deliveries */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Deliveries</Text>
          {deliveries.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/orders')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptyText}>
              Create your first delivery above
            </Text>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={() => router.push(`/order-details?id=${item._id}`)}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {renderSearchingOverlay()}
      {renderCreateModal()}
      {renderSearchModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  connectionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '45%',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  searchSubText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  arrowIcon: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  recentSection: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 20,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackText: {
    fontSize: 20,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  locationCardEmpty: {
    borderStyle: 'dashed',
    borderColor: COLORS.gray,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pickupDot: {
    backgroundColor: COLORS.primary,
  },
  dropoffDot: {
    backgroundColor: COLORS.success,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  locationPlaceholder: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    backgroundColor: COLORS.white,
  },
  
  // Search Modal styles
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  searchBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBackText: {
    fontSize: 20,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  searchInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  
  // Searching Overlay styles
  searchingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  searchingText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelSearchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelSearchText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});