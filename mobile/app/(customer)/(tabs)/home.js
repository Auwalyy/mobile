// app/(customer)/(tabs)/home.js
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

export default function CustomerHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
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
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(null);
  const [availableDeliveryPersons, setAvailableDeliveryPersons] = useState([]);
  const [fetchingDeliveryPersons, setFetchingDeliveryPersons] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    getCurrentLocation();
  }, []);

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
      Alert.alert('Error', 'Failed to load deliveries. Please try again.');
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
      
      // Try to get a readable address
      try {
        const address = await locationService.reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        if (address?.formattedAddress) {
          setCurrentLocation(address.formattedAddress);
          setPickupLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            address: address.formattedAddress,
          });
        } else if (address?.street && address?.city) {
          const readableAddress = `${address.street}, ${address.city}, ${address.region || ''}`.trim();
          setCurrentLocation(readableAddress);
          setPickupLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            address: readableAddress,
          });
        } else {
          setCurrentLocation(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
          setPickupLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          });
        }
      } catch (geocodeError) {
        console.error('Geocode error:', geocodeError);
        setCurrentLocation(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        setPickupLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        });
      }
    } catch (error) {
      console.error('Get location error:', error);
      setCurrentLocation('Location unavailable');
      Alert.alert('Location Error', 'Please enable location services to create deliveries.');
    }
  };

  const fetchNearbyDeliveryPersons = async (lat, lng) => {
    if (!lat || !lng) return;
    
    setFetchingDeliveryPersons(true);
    try {
      const response = await deliveryService.getNearbyRiders(lat, lng);
      if (response.success) {
        setAvailableDeliveryPersons(response.data || []);
        if (response.data.length > 0) {
          setSelectedDeliveryPersonId(response.data[0]._id);
        }
      } else {
        console.log('No delivery persons available or error:', response.message);
      }
    } catch (error) {
      console.error('Fetch nearby delivery persons error:', error);
    } finally {
      setFetchingDeliveryPersons(false);
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
      // Use Google Places Autocomplete API
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
        Alert.alert('No Results', 'No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    try {
      // Get place details to get coordinates and full address
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
          // Fetch nearby delivery persons when dropoff is selected
          await fetchNearbyDeliveryPersons(location.latitude, location.longitude);
        }

        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        throw new Error('Could not get location details');
      }
    } catch (error) {
      console.error('Select location error:', error);
      Alert.alert('Error', 'Failed to get location details. Please try again.');
    }
  };

  const handleCreateDelivery = async () => {
    // Validation
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }

    if (!recipientName || !recipientPhone) {
      Alert.alert('Error', 'Please enter recipient name and phone number');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanedPhone = recipientPhone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number (10-15 digits)');
      return;
    }

    setCreating(true);
    try {
      const deliveryData = {
        pickup: {
          address: pickupLocation.address,
          lat: pickupLocation.latitude.toString(),
          lng: pickupLocation.longitude.toString(),
        },
        dropoff: {
          address: dropoffLocation.address,
          lat: dropoffLocation.latitude.toString(),
          lng: dropoffLocation.longitude.toString(),
        },
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
        ...(selectedDeliveryPersonId && { deliveryPersonId: selectedDeliveryPersonId }),
      };

      console.log('Creating delivery with data:', deliveryData);
      const response = await deliveryService.createDelivery(deliveryData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Delivery created successfully!',
          [
            {
              text: 'View Order',
              onPress: () => {
                setShowCreateModal(false);
                resetForm();
                fetchDeliveries();
                router.push(`/order-details?id=${response.data._id}`);
              }
            },
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                setShowCreateModal(false);
                resetForm();
                fetchDeliveries();
              }
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create delivery');
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      Alert.alert('Error', error.message || 'Failed to create delivery. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    if (currentCoordinates) {
      setPickupLocation({
        latitude: currentCoordinates.latitude,
        longitude: currentCoordinates.longitude,
        address: currentLocation,
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
    setSelectedDeliveryPersonId(null);
    setAvailableDeliveryPersons([]);
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

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
      }}
    >
      <View style={styles.searchModalContainer}>
        <View style={styles.searchModalContent}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.searchBackButton}
            >
              <Text style={styles.searchBackText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.searchTitle}>
              Search {searchType === 'pickup' ? 'Pickup' : 'Dropoff'} Location
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Enter ${searchType} location...`}
              placeholderTextColor={COLORS.gray}
              autoFocus
              onSubmitEditing={handleSearchLocation}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchLocation}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          <ScrollView style={styles.searchResultsContainer}>
            {searching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Searching locations...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(result)}
                >
                  <Text style={styles.searchResultName}>{result.name}</Text>
                  <Text style={styles.searchResultAddress}>{result.address}</Text>
                </TouchableOpacity>
              ))
            ) : searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching for places like "Airport", "Mall", or "City Center"
                </Text>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Search for a location</Text>
                <Text style={styles.instructionsText}>
                  Enter an address, landmark, or place name to search
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      onRequestClose={() => {
        setShowCreateModal(false);
        resetForm();
      }}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            style={styles.modalBackButton}
          >
            <Text style={styles.modalBackText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Delivery</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Location Section */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Delivery Locations</Text>
            
            {/* Pickup Location */}
            <TouchableOpacity 
              style={styles.locationCard}
              onPress={() => {
                setSearchType('pickup');
                setShowSearchModal(true);
              }}
            >
              <View style={[styles.locationDot, styles.pickupDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP FROM</Text>
                <Text style={styles.locationText} numberOfLines={3}>
                  {pickupLocation?.address || 'Tap to select pickup location'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => {
                  setSearchType('pickup');
                  setShowSearchModal(true);
                }}
              >
                <Text style={styles.changeButtonText}>
                  {pickupLocation ? 'Change' : 'Select'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Dropoff Location */}
            <TouchableOpacity 
              style={[styles.locationCard, !dropoffLocation && styles.locationCardEmpty]}
              onPress={() => {
                setSearchType('dropoff');
                setShowSearchModal(true);
              }}
            >
              <View style={[styles.locationDot, styles.dropoffDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>DELIVER TO</Text>
                {dropoffLocation ? (
                  <Text style={styles.locationText} numberOfLines={3}>
                    {dropoffLocation.address}
                  </Text>
                ) : (
                  <Text style={styles.locationPlaceholder}>
                    Tap to select dropoff location
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => {
                  setSearchType('dropoff');
                  setShowSearchModal(true);
                }}
              >
                <Text style={styles.changeButtonText}>
                  {dropoffLocation ? 'Change' : 'Select'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Available Delivery Persons Section */}
          {fetchingDeliveryPersons ? (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Finding Available Delivery Persons</Text>
              <View style={styles.loadingDeliveryPersonsContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingDeliveryPersonsText}>Searching for nearby delivery persons...</Text>
              </View>
            </View>
          ) : availableDeliveryPersons.length > 0 ? (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Available Delivery Persons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableDeliveryPersons.map((person) => (
                  <TouchableOpacity
                    key={person._id}
                    style={[
                      styles.deliveryPersonCard,
                      selectedDeliveryPersonId === person._id && styles.deliveryPersonCardSelected
                    ]}
                    onPress={() => setSelectedDeliveryPersonId(person._id)}
                  >
                    {person.userId?.avatarUrl ? (
                      <Image source={{ uri: person.userId.avatarUrl }} style={styles.deliveryPersonAvatar} />
                    ) : (
                      <View style={styles.deliveryPersonAvatar}>
                        <Text style={styles.deliveryPersonAvatarText}>
                          {person.userId?.name?.charAt(0).toUpperCase() || 'D'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.deliveryPersonName} numberOfLines={1}>
                      {person.userId?.name?.split(' ')[0] || 'Delivery Person'}
                    </Text>
                    <Text style={styles.deliveryPersonDistance}>
                      {person.distance?.toFixed(1) || 'N/A'} km
                    </Text>
                    <Text style={styles.deliveryPersonVehicle}>
                      {person.vehicleType || 'Bike'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.deliveryPersonNote}>
                {selectedDeliveryPersonId 
                  ? 'Selected delivery person will be assigned to this delivery' 
                  : 'Tap to select a delivery person (optional)'}
              </Text>
            </View>
          ) : dropoffLocation && !fetchingDeliveryPersons ? (
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Available Delivery Persons</Text>
              <View style={styles.noDeliveryPersonsContainer}>
                <Text style={styles.noDeliveryPersonsText}>No delivery persons available in this area</Text>
                <Text style={styles.noDeliveryPersonsSubtext}>
                  Delivery will be created and assigned when a delivery person becomes available
                </Text>
              </View>
            </View>
          ) : null}

          {/* Customer Details */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Your Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{user?.fullName || user?.name || 'Not set'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{user?.phone || 'Not set'}</Text>
            </View>
            
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Note: Your details will be shared with the delivery person for contact purposes.
              </Text>
            </View>
          </View>

          {/* Recipient Details */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Recipient Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Name *</Text>
              <TextInput
                style={styles.textInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Enter recipient full name"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Phone *</Text>
              <TextInput
                style={styles.textInput}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="Enter recipient phone number (e.g., 08012345678)"
                placeholderTextColor={COLORS.gray}
                keyboardType="phone-pad"
                maxLength={15}
              />
              <Text style={styles.inputHint}>
                Enter a valid Nigerian phone number (10-15 digits)
              </Text>
            </View>
          </View>

          {/* Package Details */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Package Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Type</Text>
              <View style={styles.typeButtons}>
                {['Package', 'Document', 'Food', 'Electronics', 'Other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      itemType === type.toLowerCase() && styles.typeButtonActive,
                    ]}
                    onPress={() => setItemType(type.toLowerCase())}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        itemType === type.toLowerCase() && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholder="E.g., Small box, fragile items, etc."
                placeholderTextColor={COLORS.gray}
                multiline
              />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Any special instructions for the delivery person..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Summary */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Delivery Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pickup:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {pickupLocation?.address || 'Not selected'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dropoff:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {dropoffLocation?.address || 'Not selected'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recipient:</Text>
                <Text style={styles.summaryValue}>
                  {recipientName || 'Not entered'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Package:</Text>
                <Text style={styles.summaryValue}>
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </Text>
              </View>
              {selectedDeliveryPersonId && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Person:</Text>
                  <Text style={styles.summaryValue}>
                    {availableDeliveryPersons.find(p => p._id === selectedDeliveryPersonId)?.userId?.name || 'Selected'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.modalFooter}>
          <Button
            title={creating ? "Creating..." : "Create Delivery"}
            onPress={handleCreateDelivery}
            disabled={creating || !pickupLocation || !dropoffLocation || !recipientName || !recipientPhone}
            style={styles.createButton}
          />
          <Text style={styles.disclaimerText}>
            By creating this delivery, you agree to our terms and conditions.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Profile and Location */}
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

      {/* Create Delivery Button */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.searchIcon}>🚚</Text>
        <View style={styles.searchTextContainer}>
          <Text style={styles.searchMainText}>Create new delivery</Text>
          <Text style={styles.searchSubText}>Tap to select pickup & dropoff locations</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      {/* Recent Deliveries Section */}
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
              Tap the "Create new delivery" button above to get started
            </Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create First Delivery</Text>
            </TouchableOpacity>
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
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationCardEmpty: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.light,
    borderStyle: 'dashed',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pickupDot: {
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    backgroundColor: COLORS.danger,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  locationPlaceholder: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  changeButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  changeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Delivery Person styles
  loadingDeliveryPersonsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingDeliveryPersonsText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  noDeliveryPersonsContainer: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDeliveryPersonsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  noDeliveryPersonsSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  deliveryPersonCard: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  deliveryPersonCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  deliveryPersonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryPersonAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  deliveryPersonName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  deliveryPersonDistance: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
  },
  deliveryPersonVehicle: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deliveryPersonNote: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    fontSize: 14,
    color: COLORS.dark,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
    width: 100,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  createButton: {
    width: '100%',
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Search Modal Styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  searchModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.dark,
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsContainer: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    padding: 16,
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
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
});