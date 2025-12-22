// components/delivery/DeliveryModal.tsx
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
import { useAuth } from '@/context/AuthContext';
import { locationService } from '@/services/LocationServices';
import { deliveryService } from '@/services/DeliveryService';
import { CreateDeliveryDto } from '@/types';

interface DeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LocationForm {
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [pickup, setPickup] = useState<LocationForm>({
    address: '',
    city: '',
    lat: 0,
    lng: 0,
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
  });

  const [dropoff, setDropoff] = useState<LocationForm>({
    address: '',
    city: '',
    lat: 0,
    lng: 0,
    contactName: '',
    contactPhone: '',
  });

  const [type, setType] = useState<'small' | 'medium' | 'large'>('small');
  const [weight, setWeight] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [price, setPrice] = useState(0);
  const [distance, setDistance] = useState(0);

  // Initialize with user location
  useEffect(() => {
    if (visible) {
      getUserLocation();
    } else {
      resetForm();
    }
  }, [visible]);

  const getUserLocation = async () => {
    setLoading(true);
    const location = await locationService.getCurrentLocation();
    if (location) {
      setPickup(prev => ({
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
    setPickup({
      address: '',
      city: '',
      lat: 0,
      lng: 0,
      contactName: user?.name || '',
      contactPhone: user?.phone || '',
    });
    setDropoff({
      address: '',
      city: '',
      lat: 0,
      lng: 0,
      contactName: '',
      contactPhone: '',
    });
    setType('small');
    setWeight('');
    setPaymentMethod('cash');
    setPrice(0);
    setDistance(0);
  };

  const calculatePrice = () => {
    if (pickup.lat && pickup.lng && dropoff.lat && dropoff.lng) {
      const dist = locationService.calculateDistance(
        pickup.lat,
        pickup.lng,
        dropoff.lat,
        dropoff.lng
      );
      setDistance(dist);
      
      const weightNum = parseFloat(weight) || 1;
      const calculatedPrice = locationService.calculatePrice(dist, weightNum, type);
      setPrice(calculatedPrice);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [pickup, dropoff, type, weight]);

  const validateStep1 = () => {
    if (!pickup.address || !pickup.contactName || !pickup.contactPhone) {
      Alert.alert('Error', 'Please fill in all pickup details');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!dropoff.address || !dropoff.contactName || !dropoff.contactPhone) {
      Alert.alert('Error', 'Please fill in all dropoff details');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const deliveryData: CreateDeliveryDto = {
        pickup: {
          address: pickup.address,
          city: pickup.city,
          lat: pickup.lat,
          lng: pickup.lng,
          contactName: pickup.contactName,
          contactPhone: pickup.contactPhone,
        },
        dropoff: {
          address: dropoff.address,
          city: dropoff.city,
          lat: dropoff.lat,
          lng: dropoff.lng,
          contactName: dropoff.contactName,
          contactPhone: dropoff.contactPhone,
        },
        type,
        weightKg: parseFloat(weight),
        price,
        paymentMethod,
      };

      await deliveryService.createDelivery(deliveryData);
      Alert.alert('Success', 'Delivery created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Pickup Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <TouchableOpacity style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchText}>Search for pickup location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Name</Text>
        <TextInput
          style={styles.input}
          value={pickup.contactName}
          onChangeText={(text) => setPickup(prev => ({ ...prev, contactName: text }))}
          placeholder="Enter name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={pickup.contactPhone}
          onChangeText={(text) => setPickup(prev => ({ ...prev, contactPhone: text }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Dropoff Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <TouchableOpacity style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchText}>Search for dropoff location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Name</Text>
        <TextInput
          style={styles.input}
          value={dropoff.contactName}
          onChangeText={(text) => setDropoff(prev => ({ ...prev, contactName: text }))}
          placeholder="Enter recipient name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Phone</Text>
        <TextInput
          style={styles.input}
          value={dropoff.contactPhone}
          onChangeText={(text) => setDropoff(prev => ({ ...prev, contactPhone: text }))}
          placeholder="Enter recipient phone"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Package Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Package Type</Text>
        <View style={styles.typeButtons}>
          {(['small', 'medium', 'large'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.typeButton, type === item && styles.typeButtonActive]}
              onPress={() => setType(item)}
            >
              <Text style={[styles.typeButtonText, type === item && styles.typeButtonTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter weight"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentButtons}>
          {(['cash', 'card', 'wallet'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentButton, paymentMethod === method && styles.paymentButtonActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[styles.paymentButtonText, paymentMethod === method && styles.paymentButtonTextActive]}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {price > 0 && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Estimated Price:</Text>
          <Text style={styles.priceValue}>₦{price.toLocaleString()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Delivery</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Steps */}
            <View style={styles.steps}>
              {[1, 2, 3].map((stepNum) => (
                <View key={stepNum} style={styles.stepContainer}>
                  <View style={[styles.stepCircle, step >= stepNum && styles.stepCircleActive]}>
                    <Text style={[styles.stepNumber, step >= stepNum && styles.stepNumberActive]}>
                      {stepNum}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, step >= stepNum && styles.stepLabelActive]}>
                    {stepNum === 1 ? 'Pickup' : stepNum === 2 ? 'Dropoff' : 'Details'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.loading}>
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

            {/* Navigation */}
            <View style={styles.navigation}>
              {step > 1 && (
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setStep(step - 1)}
                >
                  <Ionicons name="arrow-back" size={20} color="#337bff" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              {step < 3 ? (
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={() => {
                    if (step === 1 && validateStep1()) setStep(2);
                    if (step === 2 && validateStep2()) setStep(3);
                  }}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Delivery</Text>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepContainer: {
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
  content: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  searchText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
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
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  paymentButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentButtonTextActive: {
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loading: {
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
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
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
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#81C784',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
});

export default DeliveryModal;