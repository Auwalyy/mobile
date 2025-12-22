import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PackageDetailsFormProps {
  deliveryType: 'small' | 'medium' | 'large';
  weight: string;
  price: string;
  onDeliveryTypeChange: (type: 'small' | 'medium' | 'large') => void;
  onWeightChange: (weight: string) => void;
  onPriceChange: (price: string) => void;
  onEstimatePrice: () => void;
}

const PackageDetailsForm: React.FC<PackageDetailsFormProps> = ({
  deliveryType,
  weight,
  price,
  onDeliveryTypeChange,
  onWeightChange,
  onPriceChange,
  onEstimatePrice,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Package Details</Text>
      
      {/* Package Type */}
      <View style={styles.typeContainer}>
        <Text style={styles.label}>Package Size:</Text>
        <View style={styles.typeButtons}>
          {(['small', 'medium', 'large'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                deliveryType === type && styles.typeButtonActive,
              ]}
              onPress={() => onDeliveryTypeChange(type)}
            >
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

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="2.5"
          value={weight}
          onChangeText={onWeightChange}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Price Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="1500"
          value={price}
          onChangeText={onPriceChange}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Estimate Button */}
      <TouchableOpacity 
        style={styles.estimateButton}
        onPress={onEstimatePrice}
      >
        <Ionicons name="calculator" size={20} color="#337bff" />
        <Text style={styles.estimateButtonText}>Estimate Price</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 18,
  },
  typeContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginBottom: 10,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#337bff',
    borderColor: '#337bff',
  },
  typeButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: '#e8f0ff',
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1e7ff',
  },
  estimateButtonText: {
    fontSize: 15,
    color: '#337bff',
    fontWeight: '600',
  },
});

export default PackageDetailsForm;