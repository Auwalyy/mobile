import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PackageDetailsForm from './PackageDetailsForm';
import ContactInfoForm from './ContactInForm';
import { DeliveryFormData } from '../../types/delivery.types';
import { LocationPoint } from '../../types/delivery.types';

interface DeliveryFormProps {
  formData: DeliveryFormData;
  pickupLocation?: LocationPoint;
  dropoffLocation?: LocationPoint;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (field: keyof DeliveryFormData, value: string) => void;
  onEstimatePrice: () => void;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({
  formData,
  pickupLocation,
  dropoffLocation,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  onEstimatePrice,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Pickup Contact */}
          <ContactInfoForm
            title="Pickup Contact"
            contactName={formData.pickupContactName}
            contactPhone={formData.pickupContactPhone}
            location={pickupLocation}
            onContactNameChange={(value) => onFormChange('pickupContactName', value)}
            onContactPhoneChange={(value) => onFormChange('pickupContactPhone', value)}
          />

          {/* Dropoff Contact */}
          <ContactInfoForm
            title="Dropoff Contact"
            contactName={formData.dropoffContactName}
            contactPhone={formData.dropoffContactPhone}
            location={dropoffLocation}
            onContactNameChange={(value) => onFormChange('dropoffContactName', value)}
            onContactPhoneChange={(value) => onFormChange('dropoffContactPhone', value)}
          />

          {/* Package Details */}
          <PackageDetailsForm
            deliveryType={formData.deliveryType}
            weight={formData.weight}
            price={formData.price}
            onDeliveryTypeChange={(value) => onFormChange('deliveryType', value)}
            onWeightChange={(value) => onFormChange('weight', value)}
            onPriceChange={(value) => onFormChange('price', value)}
            onEstimatePrice={onEstimatePrice}
          />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.submitButton]}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Ionicons name="hourglass" size={20} color="#fff" />
            ) : (
              <>
                <Ionicons name="cube" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Create Delivery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#337bff',
    shadowColor: '#337bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DeliveryForm;