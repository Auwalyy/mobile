// components/delivery/DeliveryCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Delivery } from '@/types';

interface DeliveryCardProps {
  delivery: Delivery;
  onPress?: () => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onPress }) => {
  const getStatusColor = (status: Delivery['status']) => {
    const colors = {
      created: '#FF9800',
      matched: '#2196F3',
      assigned: '#9C27B0',
      accepted: '#00BCD4',
      picked: '#FF5722',
      in_transit: '#3F51B5',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status: Delivery['status']) => {
    const icons = {
      created: 'time-outline',
      matched: 'business-outline',
      assigned: 'person-outline',
      accepted: 'checkmark-outline',
      picked: 'cube-outline',
      in_transit: 'car-outline',
      delivered: 'checkmark-done-outline',
      cancelled: 'close-outline',
    };
    return icons[status] || 'help-outline';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.trackingLabel}>TRACKING #</Text>
          <Text style={styles.trackingNumber}>
            {delivery._id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(delivery.status)}20` }]}>
          <Ionicons 
            name={getStatusIcon(delivery.status)} 
            size={14} 
            color={getStatusColor(delivery.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
            {delivery.status.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Locations */}
      <View style={styles.locations}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>FROM</Text>
            <Text style={styles.address} numberOfLines={1}>
              {delivery.pickup.address}
            </Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#FF9800' }]} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>TO</Text>
            <Text style={styles.address} numberOfLines={1}>
              {delivery.dropoff.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.footerText}>{formatDate(delivery.createdAt)}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="pricetag-outline" size={14} color="#666" />
          <Text style={styles.priceText}>₦{delivery.price.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  locations: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  address: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default DeliveryCard;