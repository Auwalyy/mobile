import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryFormData, LocationPoint } from '../../types';

interface DeliveryDetailsFormProps {
  formData: DeliveryFormData;
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  onFormChange: (field: keyof DeliveryFormData, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const DeliveryDetailsForm: React.FC<DeliveryDetailsFormProps> = ({
  formData,
  pickupLocation,
  dropoffLocation,
  onFormChange,
  onBack,
  onSubmit,
}) => {
  const [priceEstimation, setPriceEstimation] = useState<number>(
    parseFloat(formData.price) || 1500
  );

  const deliveryTypes = [
    { id: 'small', label: 'Small', icon: '📦', description: 'Documents, small packages' },
    { id: 'medium', label: 'Medium', icon: '📦📦', description: 'Medium boxes, bags' },
    { id: 'large', label: 'Large', icon: '📦📦📦', description: 'Furniture, appliances' },
  ];

  const weightOptions = [
    { label: '0.5 kg', value: '0.5' },
    { label: '1 kg', value: '1' },
    { label: '2.5 kg', value: '2.5' },
    { label: '5 kg', value: '5' },
    { label: '10 kg', value: '10' },
    { label: '20+ kg', value: '20' },
  ];

  const calculatePrice = () => {
    const basePrice = 1500;
    const weightMultiplier = parseFloat(formData.weight) || 2.5;
    const typeMultiplier = 
      formData.deliveryType === 'small' ? 1 : 
      formData.deliveryType === 'medium' ? 1.5 : 2;
    
    const distanceMultiplier = 1.0; // In real app, calculate actual distance
    
    const price = Math.round(basePrice * weightMultiplier * typeMultiplier * distanceMultiplier);
    setPriceEstimation(price);
    onFormChange('price', price.toString());
  };

  const handleWeightSelect = (weight: string) => {
    onFormChange('weight', weight);
    calculatePrice();
  };

  const handleTypeSelect = (type: string) => {
    onFormChange('deliveryType', type);
    calculatePrice();
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
        <Text style={styles.title}>Delivery Details</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Package Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Information</Text>
          
          {/* Delivery Type */}
          <View style={styles.typeContainer}>
            <Text style={styles.sectionSubtitle}>Package Type</Text>
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
                  <Text
                    style={[
                      styles.typeLabel,
                      formData.deliveryType === type.id && styles.typeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weight Selection */}
          <View style={styles.weightContainer}>
            <Text style={styles.sectionSubtitle}>Package Weight</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.weightScrollView}
            >
              <View style={styles.weightOptions}>
                {weightOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.weightOption,
                      formData.weight === option.value && styles.weightOptionSelected,
                    ]}
                    onPress={() => handleWeightSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.weightText,
                        formData.weight === option.value && styles.weightTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Item Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Description (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Documents, Electronics, Clothes"
              placeholderTextColor="#999"
              value={formData.itemDescription}
              onChangeText={(value) => onFormChange('itemDescription', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special instructions for the driver"
              placeholderTextColor="#999"
              value={formData.notes}
              onChangeText={(value) => onFormChange('notes', value)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Price Estimation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Estimate</Text>
          <View style={styles.priceContainer}>
            <View style={styles.priceDisplay}>
              <Text style={styles.priceLabel}>Estimated Cost</Text>
              <Text style={styles.priceValue}>₦{priceEstimation.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.estimateButton}
              onPress={calculatePrice}
            >
              <Ionicons name="refresh" size={20} color="#337bff" />
              <Text style={styles.estimateButtonText}>Recalculate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Locations Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Summary</Text>
          
          <View style={styles.locationSummary}>
            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, styles.pickupIcon]}>
                <Ionicons name="cube-outline" size={20} color="white" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationType}>Pickup</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {pickupLocation.address}
                </Text>
                <Text style={styles.locationContact}>
                  {pickupLocation.contactName} • {pickupLocation.contactPhone}
                </Text>
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Ionicons name="arrow-down" size={20} color="#337bff" />
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, styles.dropoffIcon]}>
                <Ionicons name="home-outline" size={20} color="white" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationType}>Dropoff</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {dropoffLocation.address}
                </Text>
                <Text style={styles.locationContact}>
                  {dropoffLocation.contactName || 'Receiver'} • {dropoffLocation.contactPhone || 'Phone'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.priceFooter}>
          <View>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPrice}>₦{priceEstimation.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitButtonText}>Find Driver</Text>
            <Ionicons name="search" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
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
  section: {
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeContainer: {
    marginBottom: 24,
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
    padding: 16,
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
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: '#337bff',
  },
  typeDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  weightContainer: {
    marginBottom: 24,
  },
  weightScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  weightOptions: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  weightOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weightOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#337bff',
  },
  weightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  weightTextSelected: {
    color: '#337bff',
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
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  priceContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceDisplay: {},
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#337bff',
  },
  estimateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#337bff',
    fontWeight: '500',
  },
  locationSummary: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupIcon: {
    backgroundColor: '#FF6B6B',
  },
  dropoffIcon: {
    backgroundColor: '#4CAF50',
  },
  locationDetails: {
    flex: 1,
  },
  locationType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  locationContact: {
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#337bff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DeliveryDetailsForm;