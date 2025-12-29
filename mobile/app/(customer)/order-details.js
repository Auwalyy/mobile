// app/(customer)/order-details.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/delivery';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Loading } from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { COLORS, DELIVERY_STATUS } from '../../utils/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [trackingRider, setTrackingRider] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  useEffect(() => {
    if (order && order.pickup?.location && order.dropoff?.location) {
      // Calculate map region to show both pickup and dropoff
      const coordinates = [
        {
          latitude: order.pickup.location.coordinates[1],
          longitude: order.pickup.location.coordinates[0],
        },
        {
          latitude: order.dropoff.location.coordinates[1],
          longitude: order.dropoff.location.coordinates[0],
        },
      ];

      const minLat = Math.min(...coordinates.map(c => c.latitude));
      const maxLat = Math.max(...coordinates.map(c => c.latitude));
      const minLng = Math.min(...coordinates.map(c => c.longitude));
      const maxLng = Math.max(...coordinates.map(c => c.longitude));

      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
        longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
      });
    }

    // If order is in progress and has rider, start tracking rider location
    if (order?.riderId && ['assigned', 'picked_up', 'in_transit'].includes(order.status)) {
      startTrackingRider();
    }

    return () => {
      if (trackingRider) {
        clearInterval(trackingRider);
      }
    };
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getDeliveryById(params.id);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch order details');
        router.back();
      }
    } catch (error) {
      console.error('Fetch order details error:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startTrackingRider = () => {
    // Simulate rider location updates
    const interval = setInterval(() => {
      // In a real app, this would come from a WebSocket or API
      // For now, we'll simulate movement
      if (order?.riderId && order.currentLocation) {
        setRiderLocation({
          latitude: order.currentLocation.coordinates[1],
          longitude: order.currentLocation.coordinates[0],
        });
      }
    }, 5000);

    setTrackingRider(interval);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'assigned': return COLORS.info;
      case 'picked_up': return COLORS.primary;
      case 'in_transit': return COLORS.primary;
      case 'delivered': return COLORS.success;
      case 'failed': return COLORS.danger;
      case 'cancelled': return COLORS.gray;
      case 'returned': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'hourglass-empty';
      case 'assigned': return 'assignment-ind';
      case 'picked_up': return 'local-shipping';
      case 'in_transit': return 'directions-bike';
      case 'delivered': return 'check-circle';
      case 'failed': return 'error';
      case 'cancelled': return 'cancel';
      case 'returned': return 'undo';
      default: return 'help';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleCallRider = () => {
    if (order?.riderId?.userId?.phone) {
      Linking.openURL(`tel:${order.riderId.userId.phone}`);
    } else {
      Alert.alert('Info', 'Rider phone number not available');
    }
  };

  const handleCallCustomerService = () => {
    // Use company contact or default number
    const phoneNumber = order?.companyId?.contactPhone || '+1234567890';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleTrackDelivery = () => {
    // In a real app, this would open real-time tracking
    Alert.alert('Tracking', 'Live tracking would show here');
  };

  const handleCancelOrder = async () => {
    if (!['pending', 'assigned'].includes(order.status)) {
      Alert.alert('Cannot Cancel', 'This order can no longer be cancelled');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this delivery?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deliveryService.cancelDelivery(order._id);
              if (response.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchOrderDetails(); // Refresh order details
              } else {
                throw new Error(response.message);
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="error-outline" size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.trackingNumber || order._id.slice(-6)}</Text>
        <TouchableOpacity onPress={() => fetchOrderDetails()} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={24} color={COLORS.white} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {DELIVERY_STATUS[order.status] || order.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.statusTime}>
              {formatTimeAgo(order.updatedAt)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Amount</Text>
            <Text style={styles.priceValue}>₦{order.deliveryFee?.toLocaleString() || '0.00'}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Created</Text>
                <Text style={styles.timelineTime}>{formatDate(order.createdAt)}</Text>
              </View>
            </View>

            {order.assignedAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Rider Assigned</Text>
                  <Text style={styles.timelineTime}>{formatDate(order.assignedAt)}</Text>
                </View>
              </View>
            )}

            {order.pickedUpAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Package Picked Up</Text>
                  <Text style={styles.timelineTime}>{formatDate(order.pickedUpAt)}</Text>
                </View>
              </View>
            )}

            {order.inTransitAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>In Transit</Text>
                  <Text style={styles.timelineTime}>{formatDate(order.inTransitAt)}</Text>
                </View>
              </View>
            )}

            {order.deliveredAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Delivered</Text>
                  <Text style={styles.timelineTime}>{formatDate(order.deliveredAt)}</Text>
                </View>
              </View>
            )}

            {/* Next expected step */}
            {!order.deliveredAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotPending]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitlePending}>
                    {order.status === 'in_transit' 
                      ? 'Expected Delivery' 
                      : order.status === 'picked_up' 
                      ? 'In Transit' 
                      : order.status === 'assigned' 
                      ? 'Pickup Expected' 
                      : 'Pending'}
                  </Text>
                  <Text style={styles.timelineTime}>Waiting...</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Map View */}
        {mapRegion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Route</Text>
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
                showsUserLocation={true}
              >
                {/* Pickup Marker */}
                <Marker
                  coordinate={{
                    latitude: order.pickup.location.coordinates[1],
                    longitude: order.pickup.location.coordinates[0],
                  }}
                  title="Pickup Location"
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.marker, styles.pickupMarker]}>
                      <Icon name="location-on" size={16} color={COLORS.white} />
                    </View>
                  </View>
                </Marker>

                {/* Dropoff Marker */}
                <Marker
                  coordinate={{
                    latitude: order.dropoff.location.coordinates[1],
                    longitude: order.dropoff.location.coordinates[0],
                  }}
                  title="Dropoff Location"
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.marker, styles.dropoffMarker]}>
                      <Icon name="flag" size={16} color={COLORS.white} />
                    </View>
                  </View>
                </Marker>

                {/* Rider Marker if tracking */}
                {riderLocation && (
                  <Marker coordinate={riderLocation} title="Rider">
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, styles.riderMarker]}>
                        <Icon name="directions-bike" size={16} color={COLORS.white} />
                      </View>
                    </View>
                  </Marker>
                )}

                {/* Route Line */}
                <Polyline
                  coordinates={[
                    {
                      latitude: order.pickup.location.coordinates[1],
                      longitude: order.pickup.location.coordinates[0],
                    },
                    {
                      latitude: order.dropoff.location.coordinates[1],
                      longitude: order.dropoff.location.coordinates[0],
                    },
                  ]}
                  strokeColor={COLORS.primary}
                  strokeWidth={3}
                  lineDashPattern={[10, 10]}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          {/* Pickup Location */}
          <View style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: COLORS.success }]}>
              <Icon name="location-on" size={20} color={COLORS.white} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationTitle}>Pickup Location</Text>
              <Text style={styles.locationAddress}>{order.pickup.address}</Text>
              {order.pickup.landmark && (
                <Text style={styles.locationLandmark}>Landmark: {order.pickup.landmark}</Text>
              )}
              {order.pickup.instructions && (
                <Text style={styles.locationInstructions}>Instructions: {order.pickup.instructions}</Text>
              )}
            </View>
          </View>

          {/* Dropoff Location */}
          <View style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: COLORS.danger }]}>
              <Icon name="flag" size={20} color={COLORS.white} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationTitle}>Delivery Location</Text>
              <Text style={styles.locationAddress}>{order.dropoff.address}</Text>
              {order.dropoff.landmark && (
                <Text style={styles.locationLandmark}>Landmark: {order.dropoff.landmark}</Text>
              )}
              {order.dropoff.instructions && (
                <Text style={styles.locationInstructions}>Instructions: {order.dropoff.instructions}</Text>
              )}
              <Text style={styles.recipientInfo}>
                Recipient: {order.recipientName} • {order.recipientPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Item Type</Text>
              <Text style={styles.detailValue}>{order.itemType || 'Package'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{order.itemWeight || 1} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Value</Text>
              <Text style={styles.detailValue}>₦{(order.itemValue || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>
                {(order.estimatedDistance / 1000).toFixed(1)} km
              </Text>
            </View>
          </View>
          {order.itemDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{order.itemDescription}</Text>
            </View>
          )}
          {order.deliveryInstructions && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Special Instructions</Text>
              <Text style={styles.descriptionText}>{order.deliveryInstructions}</Text>
            </View>
          )}
        </View>

        {/* Rider Information */}
        {order.riderId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rider Information</Text>
            <View style={styles.riderCard}>
              {order.riderId.userId?.avatarUrl ? (
                <Image
                  source={{ uri: order.riderId.userId.avatarUrl }}
                  style={styles.riderAvatar}
                />
              ) : (
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderAvatarText}>
                    {order.riderId.userId?.name?.charAt(0)?.toUpperCase() || 'R'}
                  </Text>
                </View>
              )}
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{order.riderId.userId?.name || 'Rider'}</Text>
                <Text style={styles.riderPhone}>
                  <Icon name="phone" size={14} color={COLORS.primary} />{' '}
                  {order.riderId.userId?.phone || 'Phone not available'}
                </Text>
                <Text style={styles.riderRating}>
                  <Icon name="star" size={14} color={COLORS.warning} />{' '}
                  {order.riderId.rating?.toFixed(1) || '5.0'} • {order.riderId.totalDeliveries || 0} deliveries
                </Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
                <Icon name="call" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Delivery Fee</Text>
              <Text style={styles.paymentValue}>₦{order.deliveryFee?.toLocaleString() || '0.00'}</Text>
            </View>
            {order.tax && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tax</Text>
                <Text style={styles.paymentValue}>₦{order.tax.toLocaleString()}</Text>
              </View>
            )}
            {order.insuranceFee && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Insurance</Text>
                <Text style={styles.paymentValue}>₦{order.insuranceFee.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <Text style={styles.paymentTotalLabel}>Total Amount</Text>
              <Text style={styles.paymentTotalValue}>
                ₦{order.totalAmount?.toLocaleString() || order.deliveryFee?.toLocaleString() || '0.00'}
              </Text>
            </View>
            <View style={styles.paymentStatus}>
              <Icon 
                name={order.paymentStatus === 'paid' ? 'check-circle' : 'pending'} 
                size={16} 
                color={order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning} 
              />
              <Text style={[
                styles.paymentStatusText,
                { color: order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning }
              ]}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!['delivered', 'cancelled', 'failed', 'returned'].includes(order.status) && (
        <View style={styles.actionButtons}>
          {order.riderId && (
            <>
              <Button
                title="Track Delivery"
                onPress={handleTrackDelivery}
                style={styles.trackButton}
                icon="my-location"
              />
              <TouchableOpacity style={styles.callButtonLarge} onPress={handleCallRider}>
                <Icon name="call" size={24} color={COLORS.white} />
                <Text style={styles.callButtonText}>Call Rider</Text>
              </TouchableOpacity>
            </>
          )}
          
          {['pending', 'assigned'].includes(order.status) && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancelOrder}
            >
              <Icon name="cancel" size={20} color={COLORS.danger} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.supportButton} 
            onPress={handleCallCustomerService}
          >
            <Icon name="support-agent" size={20} color={COLORS.primary} />
            <Text style={styles.supportButtonText}>Customer Support</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 16,
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 4,
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
  },
  timelineDotPending: {
    backgroundColor: COLORS.light,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 4,
  },
  timelineTitlePending: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  pickupMarker: {
    backgroundColor: COLORS.success,
  },
  dropoffMarker: {
    backgroundColor: COLORS.danger,
  },
  riderMarker: {
    backgroundColor: COLORS.primary,
  },
  locationCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    marginBottom: 4,
  },
  locationLandmark: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  locationInstructions: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  recipientInfo: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  descriptionBox: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  riderPhone: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  riderRating: {
    fontSize: 12,
    color: COLORS.gray,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCard: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    paddingTop: 12,
    marginTop: 4,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    gap: 12,
  },
  trackButton: {
    flex: 1,
  },
  callButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  supportButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
});