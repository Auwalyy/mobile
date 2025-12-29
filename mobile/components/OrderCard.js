// components/OrderCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DELIVERY_STATUS } from '../utils/constants';

export const OrderCard = ({ order, onPress }) => {
  // Safely extract data from the order object
  const pickupAddress = order?.pickup?.address || 'No pickup address';
  const dropoffAddress = order?.dropoff?.address || 'No dropoff address';
  const status = order?.status || 'unknown';
  const itemType = order?.itemType || 'package';
  const createdAt = order?.createdAt;
  
  // Format the address to show only the main part
  const formatAddress = (address) => {
    if (!address) return '';
    // Take first part of address before comma
    const parts = address.split(',');
    return parts[0] || address;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case DELIVERY_STATUS.DELIVERED:
      case 'delivered':
        return COLORS.success;
      case DELIVERY_STATUS.CANCELLED:
      case 'cancelled':
        return COLORS.danger;
      case DELIVERY_STATUS.PENDING:
      case 'pending':
      case 'created':
        return COLORS.warning;
      case DELIVERY_STATUS.ASSIGNED:
      case 'assigned':
      case DELIVERY_STATUS.PICKED_UP:
      case 'picked_up':
      case DELIVERY_STATUS.IN_TRANSIT:
      case 'in_transit':
        return COLORS.primary;
      default:
        return COLORS.gray;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'created':
        return 'Created';
      case 'assigned':
        return 'Assigned';
      case 'picked_up':
        return 'Picked Up';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // Get item type display text
  const getItemTypeText = (type) => {
    if (!type) return 'Package';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Order ID and Status */}
      <View style={styles.header}>
        <Text style={styles.orderId}>
          Order #{order?._id?.slice(-6) || 'N/A'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(status)}
          </Text>
        </View>
      </View>

      {/* Delivery Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeLine}>
          <View style={[styles.routeDot, styles.pickupDot]} />
          <View style={styles.routeLineMiddle} />
          <View style={[styles.routeDot, styles.dropoffDot]} />
        </View>
        
        <View style={styles.routeInfo}>
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeText} numberOfLines={2}>
              {formatAddress(pickupAddress)}
            </Text>
          </View>
          
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>DELIVERY</Text>
            <Text style={styles.routeText} numberOfLines={2}>
              {formatAddress(dropoffAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Item</Text>
            <Text style={styles.detailValue}>{getItemTypeText(itemType)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(createdAt)}</Text>
          </View>
        </View>
        
        {/* Payment Status */}
        {order?.payment?.status && (
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentLabel}>Payment:</Text>
            <Text style={[
              styles.paymentStatus,
              order.payment.status === 'paid' ? styles.paymentPaid : styles.paymentPending
            ]}>
              {order.payment.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Tap to view details */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to view details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeLine: {
    alignItems: 'center',
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupDot: {
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    backgroundColor: COLORS.primary,
  },
  routeLineMiddle: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.light,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeItem: {
    marginBottom: 12,
  },
  routeLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 18,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 8,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paymentPaid: {
    color: COLORS.success,
  },
  paymentPending: {
    color: COLORS.warning,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});