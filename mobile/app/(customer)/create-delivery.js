// app/(customer)/create-delivery.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/delivery';
import { locationService } from '../../services/location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { COLORS } from '../../utils/constants';

export default function CreateDeliveryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState('package');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      const address = await locationService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      setMapRegion(initialRegion);
      setPickupLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address?.formattedAddress || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      });
    } catch (error) {
      console.error('Initialize map error:', error);
      setMapRegion({
        latitude: 4.8156,
        longitude: 7.0498,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      const address = await locationService.reverseGeocode(latitude, longitude);
      setDropoffLocation({
        latitude,
        longitude,
        address: address?.formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } catch (error) {
      setDropoffLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }
  };

  const handleCreateDelivery = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }

    if (!recipientName || !recipientPhone) {
      Alert.alert('Error', 'Please enter recipient name and phone number');
      return;
    }

    setCreating(true);
    try {
      const deliveryData = {
        pickupAddress: pickupLocation.address,
        pickupLat: pickupLocation.latitude.toString(),
        pickupLng: pickupLocation.longitude.toString(),
        dropoffAddress: dropoffLocation.address,
        dropoffLat: dropoffLocation.latitude.toString(),
        dropoffLng: dropoffLocation.longitude.toString(),
        itemType: itemType,
        itemDescription: itemDescription || 'Package delivery',
        itemWeight: 1,
        itemValue: 0,
        customerName: user?.fullName || 'Customer',
        customerPhone: user?.phone || '',
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        estimatedDistance: 5000,
        estimatedDuration: 600,
        deliveryInstructions: instructions,
      };

      const response = await deliveryService.createDelivery(deliveryData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Delivery created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push(`/(customer)/order-details?id=${response.data._id}`)
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create delivery');
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      Alert.alert('Error', `Failed to create delivery: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectLocation = (type) => {
    if (type === 'pickup') {
      router.push('/(customer)/select-location?type=pickup');
    } else {
      // If we want to navigate to a separate screen for dropoff
      // router.push('/(customer)/select-location?type=dropoff');
      // For now, we're using map tap
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          {/* Pickup Location */}
          <View style={styles.locationCard}>
            <View style={[styles.locationDot, styles.pickupDot]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>PICKUP FROM</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {pickupLocation?.address || 'Current location'}
              </Text>
            </View>
          </View>

          {/* Dropoff Location */}
          <TouchableOpacity
            style={[styles.locationCard, !dropoffLocation && styles.locationCardEmpty]}
            onPress={() => handleSelectLocation('dropoff')}
          >
            <View style={[styles.locationDot, styles.dropoffDot]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>DELIVER TO</Text>
              {dropoffLocation ? (
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {dropoffLocation.address}
                </Text>
              ) : (
                <Text style={styles.locationPlaceholder}>
                  Tap on map to select dropoff location
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.section}>
          <View style={styles.mapContainer}>
            {mapRegion && (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
                showsUserLocation={true}
              >
                {pickupLocation && (
                  <Marker
                    coordinate={{
                      latitude: pickupLocation.latitude,
                      longitude: pickupLocation.longitude,
                    }}
                    title="Pickup Location"
                  >
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, styles.pickupMarker]} />
                    </View>
                  </Marker>
                )}
                
                {dropoffLocation && (
                  <Marker
                    coordinate={{
                      latitude: dropoffLocation.latitude,
                      longitude: dropoffLocation.longitude,
                    }}
                    title="Dropoff Location"
                  >
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, styles.dropoffMarker]} />
                    </View>
                  </Marker>
                )}
              </MapView>
            )}
            <View style={styles.mapInstructions}>
              <Text style={styles.mapInstructionsText}>
                {!dropoffLocation 
                  ? 'Tap on the map to select dropoff location' 
                  : 'Dropoff location selected ✓'}
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Type</Text>
            <View style={styles.typeButtons}>
              {['package', 'document', 'food', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    itemType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setItemType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      itemType === type && styles.typeButtonTextActive,
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
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="E.g., Small box, fragile items, etc."
              placeholderTextColor={COLORS.gray}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Any special instructions for the rider..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Recipient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Name *</Text>
            <TextInput
              style={styles.textInput}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Enter recipient name"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Phone *</Text>
            <TextInput
              style={styles.textInput}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              placeholder="Enter recipient phone number"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer with Create Button */}
      <View style={styles.footer}>
        <Button
          title={creating ? "Creating..." : "Create Delivery"}
          onPress={handleCreateDelivery}
          disabled={creating || !pickupLocation || !dropoffLocation || !recipientName || !recipientPhone}
          style={styles.createButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.dark,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
  },
  section: {
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
  locationAddress: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  locationPlaceholder: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapInstructions: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapInstructionsText: {
    fontSize: 12,
    color: COLORS.dark,
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  pickupMarker: {
    backgroundColor: COLORS.success,
  },
  dropoffMarker: {
    backgroundColor: COLORS.danger,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  createButton: {
    width: '100%',
  },
});