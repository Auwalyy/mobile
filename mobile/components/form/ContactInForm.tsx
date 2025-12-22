import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LocationPoint } from '../../types/delivery.types';

interface ContactInfoFormProps {
  title: string;
  contactName: string;
  contactPhone: string;
  location?: LocationPoint;
  onContactNameChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({
  title,
  contactName,
  contactPhone,
  location,
  onContactNameChange,
  onContactPhoneChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Contact Name"
        value={contactName}
        onChangeText={onContactNameChange}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contact Phone"
        value={contactPhone}
        onChangeText={onContactPhoneChange}
        keyboardType="phone-pad"
        maxLength={15}
      />
      
      {location && (
        <Text style={styles.locationPreview}>
          📍 {location.address}
        </Text>
      )}
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
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  locationPreview: {
    backgroundColor: '#f0f8ff',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1e7ff',
    lineHeight: 22,
  },
});

export default ContactInfoForm;