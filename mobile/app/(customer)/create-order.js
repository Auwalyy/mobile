// app/(customer)/create-order.js - ALL IN ONE FILE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LocationSearch } from '../../components/Map/LocationSearch';
import { Loading } from '../../components/common/Loading';
import { locationService } from '../../services/location';
import { COLORS } from '../../utils/constants';

export default function CreateOrderScreen() {
  const router = useRouter();

  // Form state
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupContact, setPickupContact] = useState({
    name: '',
    phoneNumber: '',
  });
  const [dropoffContact, setDropoffContact] = useState({
    name: '',
    phoneNumber: '',
  });
  const [packageDetails, setPackageDetails] = useState('');
  const [errors, setErrors] = useState({});

  // Map modal state
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [currentLocationType, setCurrentLocationType] = useState(null); // 'pickup' or 'dropoff'
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);

  const openLocationSelector = async (type) => {
    setCurrentLocationType(type);
    setLoadingMap(true);
    setMapModalVisible(true);

    try {
      const location = await locationService.getCurrentLocation();
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarkerCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const address = await locationService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address?.formattedAddress || 'Current location',
      });
    } catch (error) {
      console.error('Location error:', error);
      const defaultLocation = {
        latitude: 4.8156,
        longitude: 7.0498,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(defaultLocation);
      setMarkerCoordinate({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
      });
    } finally {
      setLoadingMap(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoordinate({ latitude, longitude });

    try {
      const address = await locationService.reverseGeocode(latitude, longitude);
      setSelectedLocation({
        latitude,
        longitude,
        address:
          address?.formattedAddress ||
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }
  };

  const handleLocationSearchSelect = async (location) => {
    setMarkerCoordinate({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });

    setRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setSearchVisible(false);
  };

  const confirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    if (currentLocationType === 'pickup') {
      setPickupLocation(selectedLocation);
      if (errors.pickup) {
        setErrors((prev) => ({ ...prev, pickup: '' }));
      }
    } else {
      setDropoffLocation(selectedLocation);
      if (errors.dropoff) {
        setErrors((prev) => ({ ...prev, dropoff: '' }));
      }
    }

    // Reset modal state
    setMapModalVisible(false);
    setSelectedLocation(null);
    setSearchVisible(false);
  };

  const closeLocationModal = () => {
    setMapModalVisible(false);
    setSelectedLocation(null);
    setSearchVisible(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!pickupLocation) {
      newErrors.pickup = 'Please select pickup location';
    }

    if (!dropoffLocation) {
      newErrors.dropoff = 'Please select dropoff location';
    }

    if (!pickupContact.name.trim()) {
      newErrors.pickupName = 'Pickup contact name is required';
    }

    if (!pickupContact.phoneNumber.trim()) {
      newErrors.pickupPhone = 'Pickup contact phone is required';
    }

    if (!dropoffContact.name.trim()) {
      newErrors.dropoffName = 'Dropoff contact name is required';
    }

    if (!dropoffContact.phoneNumber.trim()) {
      newErrors.dropoffPhone = 'Dropoff contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    router.push({
      pathname: 'select-rider',
      params: {
        pickupLocation: JSON.stringify(pickupLocation),
        dropoffLocation: JSON.stringify(dropoffLocation),
        pickupContact: JSON.stringify(pickupContact),
        dropoffContact: JSON.stringify(dropoffContact),
        packageDetails,
      },
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Delivery Order</Text>

        {/* Pickup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Details</Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              errors.pickup && styles.locationButtonError,
            ]}
            onPress={() => openLocationSelector('pickup')}
          >
            <View style={styles.locationButtonContent}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text
                  style={[
                    styles.locationText,
                    !pickupLocation && styles.locationPlaceholder,
                  ]}
                  numberOfLines={2}
                >
                  {pickupLocation?.address || 'Tap to select pickup location'}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Input
            label="Pickup Contact Name *"
            value={pickupContact.name}
            onChangeText={(value) => {
              setPickupContact((prev) => ({ ...prev, name: value }));
              if (errors.pickupName) {
                setErrors((prev) => ({ ...prev, pickupName: '' }));
              }
            }}
            placeholder="Enter contact name"
            error={errors.pickupName}
          />

          <Input
            label="Pickup Contact Phone *"
            value={pickupContact.phoneNumber}
            onChangeText={(value) => {
              setPickupContact((prev) => ({ ...prev, phoneNumber: value }));
              if (errors.pickupPhone) {
                setErrors((prev) => ({ ...prev, pickupPhone: '' }));
              }
            }}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            error={errors.pickupPhone}
          />
        </View>

        {/* Dropoff Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Dropoff Details</Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              errors.dropoff && styles.locationButtonError,
            ]}
            onPress={() => openLocationSelector('dropoff')}
          >
            <View style={styles.locationButtonContent}>
              <Text style={styles.locationIcon}>🎯</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Dropoff Location</Text>
                <Text
                  style={[
                    styles.locationText,
                    !dropoffLocation && styles.locationPlaceholder,
                  ]}
                  numberOfLines={2}
                >
                  {dropoffLocation?.address || 'Tap to select dropoff location'}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Input
            label="Dropoff Contact Name *"
            value={dropoffContact.name}
            onChangeText={(value) => {
              setDropoffContact((prev) => ({ ...prev, name: value }));
              if (errors.dropoffName) {
                setErrors((prev) => ({ ...prev, dropoffName: '' }));
              }
            }}
            placeholder="Enter contact name"
            error={errors.dropoffName}
          />

          <Input
            label="Dropoff Contact Phone *"
            value={dropoffContact.phoneNumber}
            onChangeText={(value) => {
              setDropoffContact((prev) => ({ ...prev, phoneNumber: value }));
              if (errors.dropoffPhone) {
                setErrors((prev) => ({ ...prev, dropoffPhone: '' }));
              }
            }}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            error={errors.dropoffPhone}
          />
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Package Information</Text>
          <Input
            label="Package Details (Optional)"
            value={packageDetails}
            onChangeText={setPackageDetails}
            placeholder="Describe package contents"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </View>

        <Button
          title="Continue to Select Rider"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={closeLocationModal}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {currentLocationType === 'pickup' ? 'Pickup' : 'Dropoff'}{' '}
              Location
            </Text>
            <TouchableOpacity onPress={closeLocationModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingMap ? (
            <Loading />
          ) : (
            <>
              {/* Search Bar */}
              {!searchVisible && (
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => setSearchVisible(true)}
                >
                  <Text style={styles.searchIcon}>🔍</Text>
                  <Text style={styles.searchButtonText}>Search location...</Text>
                </TouchableOpacity>
              )}

              {searchVisible && (
                <View style={styles.searchContainer}>
                  <LocationSearch
                    onLocationSelect={handleLocationSearchSelect}
                    placeholder={`Search ${currentLocationType} location...`}
                  />
                  <TouchableOpacity
                    style={styles.closeSearch}
                    onPress={() => setSearchVisible(false)}
                  >
                    <Text style={styles.closeSearchText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Map */}
              {region && (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={region}
                  onRegionChangeComplete={setRegion}
                  onPress={handleMapPress}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {markerCoordinate && (
                    <Marker
                      coordinate={markerCoordinate}
                      title={
                        currentLocationType === 'pickup'
                          ? 'Pickup Location'
                          : 'Dropoff Location'
                      }
                      draggable
                      onDragEnd={(e) =>
                        handleMapPress({ nativeEvent: e.nativeEvent })
                      }
                    >
                      <View style={styles.markerContainer}>
                        <View
                          style={[
                            styles.marker,
                            {
                              backgroundColor:
                                currentLocationType === 'pickup'
                                  ? COLORS.success
                                  : COLORS.danger,
                            },
                          ]}
                        >
                          <Text style={styles.markerText}>
                            {currentLocationType === 'pickup' ? '📍' : '🎯'}
                          </Text>
                        </View>
                      </View>
                    </Marker>
                  )}
                </MapView>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>
                    {currentLocationType === 'pickup'
                      ? '📍 Pickup Location'
                      : '🎯 Dropoff Location'}
                  </Text>
                  {selectedLocation && (
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {selectedLocation.address}
                    </Text>
                  )}
                  <Text style={styles.hint}>
                    Tap on the map or search to select a location
                  </Text>
                </View>

                <Button
                  title={`Confirm ${
                    currentLocationType === 'pickup' ? 'Pickup' : 'Dropoff'
                  }`}
                  onPress={confirmLocation}
                  disabled={!selectedLocation}
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 16,
  },
  locationButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationButtonError: {
    borderColor: COLORS.danger,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  locationPlaceholder: {
    color: COLORS.gray,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.gray,
    marginLeft: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  continueButton: {
    marginTop: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.dark,
  },
  searchButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchButtonText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  closeSearch: {
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeSearchText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  markerText: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
});