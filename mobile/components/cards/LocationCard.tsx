import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationPoint } from '../../types/delivery.types';

interface LocationCardProps {
  type: 'pickup' | 'dropoff';
  location?: LocationPoint;
  onPress: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  type,
  location,
  onPress,
}) => {
  const isPickup = type === 'pickup';
  const icon = isPickup ? 'arrow-up-circle' : 'flag';
  const iconColor = location ? (isPickup ? 'green' : 'red') : '#999';
  const title = isPickup ? 'Pickup' : 'Dropoff';
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text 
            style={[styles.address, !location && styles.placeholder]}
            numberOfLines={1}
          >
            {location?.address || `Tap to select ${title.toLowerCase()}`}
          </Text>
          {location?.city && (
            <Text style={styles.city}>{location.city}</Text>
          )}
        </View>
        
        <Ionicons 
          name={location ? "create-outline" : "search"} 
          size={18} 
          color={location ? "#666" : "#337bff"} 
          style={styles.actionIcon}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    lineHeight: 22,
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  city: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  actionIcon: {
    marginLeft: 8,
  },
});

export default LocationCard;