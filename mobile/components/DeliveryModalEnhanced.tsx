// components/DeliveryModalEnhanced.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation, calculateDistance, calculatePrice } from '@/services/LocationServices';
import { createDelivery } from '@/services/DeliveryService';
import { useAuth } from '@/context/AuthContext';
import MapSearch from '@/components/maps/MapSearch';

interface DeliveryModalEnhancedProps {
  visible: boolean;
  onClose: () => void;
  onDeliveryCreated: (delivery: any) => void;
}

export default function DeliveryModalEnhanced({ visible, onClose, onDeliveryCreated }: DeliveryModalEnhancedProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [useMyDetails, setUseMyDetails] = useState(true);
  
  // Current user location for search bias
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Pickup location
  const [pickupLocation, setPickupLocation] = useState({
    address: '',
    city: '',
    lat: 0,
    lng: 0,
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
  });

  // Dropoff location
  const [dropoffLocation, setDropoffLocation] = useState({
    address: '',
    city: '',
    lat: 0,
    lng: 0,
    contactName: '',
    contactPhone: '',
  });

  // Delivery details
  const [deliveryType, setDeliveryType] = useState<'small' | 'medium' | 'large'>('small');
  const [weightKg, setWeightKg] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      fetchUserLocation();
    } else {
      resetForm();
    }
  }, [visible]);

  const fetchUserLocation = async () => {
    setLoading(true);
    const location = await getCurrentLocation();
    if (location) {
      setCurrentLocation({ lat: location.lat, lng: location.lng });
      
      // Auto-fill pickup location with user's current location
      setPickupLocation(prev => ({
        ...prev,
        address: location.address,
        city: location.city,
        lat: location.lat,
        lng: location.lng,
      }));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStep(1);
    setPickupLocation({
      address: '',
      city: '',
      lat: 0,
      lng: 0,
      contactName: user?.name || '',
      contactPhone: user?.phone || '',
    });
    setDropoffLocation({
      address: '',
      city: '',
      lat: 0,
      lng: 0,
      contactName: '',
      contactPhone: '',
    });
    setCurrentLocation(null);
    setDeliveryType('small');
    setWeightKg('1');
    setPaymentMethod('cash');
    setEstimatedPrice(0);
    setDistance(0);
  };

  const calculateDistanceAndPrice = () => {
    if (pickupLocation.lat && pickupLocation.lng && dropoffLocation.lat && dropoffLocation.lng) {
      const calculatedDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      );
      setDistance(calculatedDistance);
      
      const weight = parseFloat(weightKg) || 1;
      const price = calculatePrice(calculatedDistance, weight, deliveryType);
      setEstimatedPrice(price);
    }
  };

  useEffect(() => {
    calculateDistanceAndPrice();
  }, [pickupLocation, dropoffLocation, deliveryType, weightKg]);

  const handlePickupLocationSelect = (location: any) => {
    setPickupLocation(prev => ({
      ...prev,
      ...location,
    }));
  };

  const handleDropoffLocationSelect = (location: any) => {
    setDropoffLocation(prev => ({
      ...prev,
      ...location,
    }));
  };

  const validateForm = () => {
    if (!pickupLocation.address || !pickupLocation.contactName || !pickupLocation.contactPhone) {
      Alert.alert('Error', 'Please fill in all pickup details');
      return false;
    }
    if (!dropoffLocation.address || !dropoffLocation.contactName || !dropoffLocation.contactPhone) {
      Alert.alert('Error', 'Please fill in all dropoff details');
      return false;
    }
    if (!weightKg || parseFloat(weightKg) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    return true;
  };

  const handleCreateDelivery = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const deliveryData = {
        pickup: {
          address: pickupLocation.address,
          city: pickupLocation.city,
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          contactName: pickupLocation.contactName,
          contactPhone: pickupLocation.contactPhone,
        },
        dropoff: {
          address: dropoffLocation.address,
          city: dropoffLocation.city,
          lat: dropoffLocation.lat,
          lng: dropoffLocation.lng,
          contactName: dropoffLocation.contactName,
          contactPhone: dropoffLocation.contactPhone,
        },
        type: deliveryType,
        weightKg: parseFloat(weightKg),
        price: estimatedPrice,
        paymentMethod: paymentMethod,
      };

      const delivery = await createDelivery(deliveryData);
      Alert.alert('Success', 'Delivery created successfully!');
      onDeliveryCreated(delivery);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: Pickup Details</Text>
      
      <Text style={styles.sectionSubtitle}>Search for pickup location</Text>
      <MapSearch
        placeholder="Where should we pick up from?"
        onLocationSelect={handlePickupLocationSelect}
        initialValue={pickupLocation.address}
        currentLocation={currentLocation}
      />

      <View style={styles.contactSection}>
        {useMyDetails ? (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <Ionicons name="person-circle" size={20} color="#337bff" />
              <Text style={styles.detailsTitle}>Using Your Details</Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.detailsText}>{pickupLocation.contactName}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.detailsText}>{pickupLocation.contactPhone}</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Contact Name</Text>
              <TextInput
                style={styles.input}
                value={pickupLocation.contactName}
                onChangeText={(text) => setPickupLocation(prev => ({ ...prev, contactName: text }))}
                placeholder="Enter contact name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={pickupLocation.contactPhone}
                onChangeText={(text) => setPickupLocation(prev => ({ ...prev, contactPhone: text }))}
                placeholder="Enter contact phone"
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setUseMyDetails(!useMyDetails)}
        >
          <Ionicons 
            name={useMyDetails ? "toggle" : "toggle-outline"} 
            size={24} 
            color="#337bff" 
          />
          <Text style={styles.toggleText}>
            {useMyDetails ? 'Using your details' : 'Use different contact'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepNavigation}>
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={() => setStep(2)}
          disabled={!pickupLocation.address}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 2: Delivery Details</Text>
      
      <Text style={styles.sectionSubtitle}>Search for dropoff location</Text>
      <MapSearch
        placeholder="Where should we deliver to?"
        onLocationSelect={handleDropoffLocationSelect}
        initialValue={dropoffLocation.address}
        currentLocation={currentLocation}
      />

      <View style={styles.contactSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recipient Name</Text>
          <TextInput
            style={styles.input}
            value={dropoffLocation.contactName}
            onChangeText={(text) => setDropoffLocation(prev => ({ ...prev, contactName: text }))}
            placeholder="Enter recipient name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recipient Phone</Text>
          <TextInput
            style={styles.input}
            value={dropoffLocation.contactPhone}
            onChangeText={(text) => setDropoffLocation(prev => ({ ...prev, contactPhone: text }))}
            placeholder="Enter recipient phone"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {distance > 0 && (
        <View style={styles.distanceInfo}>
          <Ionicons name="navigate" size={20} color="#337bff" />
          <Text style={styles.distanceText}>
            Distance: {distance.toFixed(1)} km
          </Text>
        </View>
      )}

      <View style={styles.stepNavigation}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={20} color="#337bff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, (!dropoffLocation.address) && styles.nextButtonDisabled]} 
          onPress={() => setStep(3)}
          disabled={!dropoffLocation.address}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 3: Package Details</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Package Type</Text>
        <View style={styles.typeContainer}>
          {(['small', 'medium', 'large'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                deliveryType === type && styles.typeButtonActive,
              ]}
              onPress={() => setDeliveryType(type)}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons
                  name={type === 'small' ? 'cube' : type === 'medium' ? 'cube-outline' : 'cube-sharp'}
                  size={24}
                  color={deliveryType === type ? '#fff' : '#337bff'}
                />
              </View>
              <Text style={[
                styles.typeButtonText,
                deliveryType === type && styles.typeButtonTextActive,
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Package Weight</Text>
        <View style={styles.weightContainer}>
          <TextInput
            style={styles.weightInput}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="0.0"
            keyboardType="numeric"
            textAlign="center"
          />
          <Text style={styles.weightUnit}>kg</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Payment Method</Text>
        <View style={styles.paymentContainer}>
          {(['cash', 'card', 'wallet'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentButton,
                paymentMethod === method && styles.paymentButtonActive,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Ionicons
                name={method === 'cash' ? 'cash' : method === 'card' ? 'card' : 'wallet'}
                size={20}
                color={paymentMethod === method ? '#fff' : '#337bff'}
              />
              <Text style={[
                styles.paymentButtonText,
                paymentMethod === method && styles.paymentButtonTextActive,
              ]}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {estimatedPrice > 0 && (
        <View style={styles.priceContainer}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceTitle}>Price Summary</Text>
          </View>
          <View style={styles.priceDetails}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base fare:</Text>
              <Text style={styles.priceValue}>₦500</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distance ({distance.toFixed(1)} km):</Text>
              <Text style={styles.priceValue}>₦{(distance * 100).toFixed(0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Weight ({weightKg} kg):</Text>
              <Text style={styles.priceValue}>₦{(parseFloat(weightKg) * 50).toFixed(0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Package type ({deliveryType}):</Text>
              <Text style={styles.priceValue}>
                {deliveryType === 'medium' ? '×1.5' : deliveryType === 'large' ? '×2' : '×1'}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalValue}>₦{estimatedPrice.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.stepNavigation}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={20} color="#337bff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateDelivery}
          disabled={loading || estimatedPrice === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.createButtonText}>Create Delivery</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNum) => (
        <View key={stepNum} style={styles.stepIndicatorContainer}>
          <View style={[
            styles.stepCircle,
            step >= stepNum && styles.stepCircleActive,
          ]}>
            <Text style={[
              styles.stepNumber,
              step >= stepNum && styles.stepNumberActive,
            ]}>
              {stepNum}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            step >= stepNum && styles.stepLabelActive,
          ]}>
            {stepNum === 1 ? 'Pickup' : stepNum === 2 ? 'Delivery' : 'Package'}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Delivery</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {renderStepIndicator()}

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loading && step === 1 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#337bff" />
                  <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
              ) : (
                <>
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                </>
              )}

              <View style={styles.spacer} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
  },
  stepLabelActive: {
    color: '#337bff',
    fontWeight: '500',
  },
  modalContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactSection: {
    marginTop: 20,
  },
  detailsCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d0e7ff',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#337bff',
    marginLeft: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
    marginLeft: 8,
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#337bff',
    fontWeight: '500',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#337bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: '#a0c1ff',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#81C784',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  typeIconContainer: {
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  weightInput: {
    flex: 1,
    height: 50,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 0,
  },
  weightUnit: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  paymentButtonActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  paymentButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  paymentButtonTextActive: {
    color: '#fff',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
    marginLeft: 8,
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    marginTop: 16,
  },
  priceHeader: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceDetails: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  spacer: {
    height: 40,
  },
});