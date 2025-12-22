import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationPoint } from '../../types';
import { User } from '../../context/AuthContext';

interface DeliveryFormModalProps {
  visible: boolean;
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  user: User | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const DeliveryFormModal: React.FC<DeliveryFormModalProps> = ({
  visible,
  pickupLocation,
  dropoffLocation,
  user,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    pickupContactName: user?.name || '',
    pickupContactPhone: user?.phone || '',
    dropoffContactName: '',
    dropoffContactPhone: '',
    deliveryType: 'small',
    weight: '2.5',
    price: '1500',
    notes: '',
    itemDescription: '',
  });

  const deliveryTypes = [
    { id: 'small', label: 'Small', icon: '📦', price: '1500' },
    { id: 'medium', label: 'Medium', icon: '📦📦', price: '2000' },
    { id: 'large', label: 'Large', icon: '📦📦📦', price: '3000' },
  ];

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = (type: string) => {
    const selectedType = deliveryTypes.find(t => t.id === type);
    setFormData(prev => ({
      ...prev,
      deliveryType: type,
      price: selectedType?.price || '1500'
    }));
  };

  const handleSubmit = () => {
    if (!formData.dropoffContactName.trim()) {
      Alert.alert('Error', 'Please enter receiver name');
      return;
    }

    if (!formData.dropoffContactPhone.trim()) {
      Alert.alert('Error', 'Please enter receiver phone number');
      return;
    }

    if (!formData.itemDescription.trim()) {
      Alert.alert('Error', 'Please describe what you\'re sending');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.dropoffContactPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    onSubmit(formData);
  };

  const calculatePrice = () => {
    const basePrice = parseInt(formData.price);
    const weightMultiplier = parseFloat(formData.weight) / 2.5;
    return Math.round(basePrice * weightMultiplier);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Delivery Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Locations Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Route</Text>
            <View style={styles.locationsCard}>
              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, { backgroundColor: '#FF6B6B' }]}>
                  <Ionicons name="cube-outline" size={18} color="white" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {pickupLocation.address}
                  </Text>
                  {user && (
                    <Text style={styles.contactText}>
                      {user.name} • {user.phone}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Ionicons name="arrow-down" size={16} color="#337bff" />
                <View style={styles.dividerLine} />
              </View>
              
              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="home-outline" size={18} color="white" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {dropoffLocation.address}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Receiver Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receiver Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter receiver name"
                placeholderTextColor="#999"
                value={formData.dropoffContactName}
                onChangeText={(value) => handleFormChange('dropoffContactName', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter receiver phone"
                placeholderTextColor="#999"
                value={formData.dropoffContactPhone}
                onChangeText={(value) => handleFormChange('dropoffContactPhone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Package Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What are you sending? *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Documents, Food, Electronics"
                placeholderTextColor="#999"
                value={formData.itemDescription}
                onChangeText={(value) => handleFormChange('itemDescription', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Package Type</Text>
              <View style={styles.typeOptions}>
                {deliveryTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      formData.deliveryType === type.id && styles.typeOptionSelected,
                    ]}
                    onPress={() => handleTypeSelect(type.id)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typePrice}>₦{type.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.weightContainer}>
                {['1', '2.5', '5', '10'].map((weight) => (
                  <TouchableOpacity
                    key={weight}
                    style={[
                      styles.weightButton,
                      formData.weight === weight && styles.weightButtonSelected,
                    ]}
                    onPress={() => handleFormChange('weight', weight)}
                  >
                    <Text style={[
                      styles.weightButtonText,
                      formData.weight === weight && styles.weightButtonTextSelected,
                    ]}>
                      {weight} kg
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.weightInput}
                  placeholder="Custom"
                  placeholderTextColor="#999"
                  value={formData.weight}
                  onChangeText={(value) => handleFormChange('weight', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Any special instructions for the driver"
                placeholderTextColor="#999"
                value={formData.notes}
                onChangeText={(value) => handleFormChange('notes', value)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Base Price</Text>
                <Text style={styles.priceValue}>₦{formData.price}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Weight ({formData.weight} kg)</Text>
                <Text style={styles.priceValue}>
                  +₦{calculatePrice() - parseInt(formData.price)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₦{calculatePrice().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Delivery</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  locationsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 20,
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
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#337bff',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  typePrice: {
    fontSize: 11,
    color: '#666',
  },
  weightContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weightButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  weightButtonSelected: {
    backgroundColor: '#337bff',
  },
  weightButtonText: {
    fontSize: 14,
    color: '#333',
  },
  weightButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    minWidth: 100,
  },
  priceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#337bff',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default DeliveryFormModal;