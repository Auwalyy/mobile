import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { deliveryService } from '../../../services/delivery';
import { OrderCard } from '../../../components/OrderCard';
import { Loading } from '../../../components/common/Loading';
import { COLORS, DELIVERY_STATUS } from '../../../utils/constants';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', status: null },
  { id: 'ongoing', label: 'Ongoing', statuses: [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.PICKED_UP, DELIVERY_STATUS.IN_TRANSIT] },
  { id: 'completed', label: 'Completed', status: DELIVERY_STATUS.DELIVERED },
  { id: 'cancelled', label: 'Cancelled', status: DELIVERY_STATUS.CANCELLED },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries();
  }, [selectedFilter, deliveries]);

  const fetchDeliveries = async () => {
    try {
      const response = await deliveryService.getMyDeliveries();
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('Fetch deliveries error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDeliveries = () => {
    const filter = FILTER_OPTIONS.find(f => f.id === selectedFilter);
    
    if (!filter || filter.id === 'all') {
      setFilteredDeliveries(deliveries);
      return;
    }

    if (filter.statuses) {
      // Multiple statuses (for ongoing)
      setFilteredDeliveries(
        deliveries.filter(d => filter.statuses.includes(d.status))
      );
    } else if (filter.status) {
      // Single status
      setFilteredDeliveries(
        deliveries.filter(d => d.status === filter.status)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const getFilterCount = (filterId) => {
    const filter = FILTER_OPTIONS.find(f => f.id === filterId);
    
    if (filter.id === 'all') return deliveries.length;
    
    if (filter.statuses) {
      return deliveries.filter(d => filter.statuses.includes(d.status)).length;
    }
    
    return deliveries.filter(d => d.status === filter.status).length;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>
          {deliveries.length} {deliveries.length === 1 ? 'order' : 'orders'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              selectedFilter === filter.id && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                selectedFilter === filter.id && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  selectedFilter === filter.id && styles.filterBadgeTextActive,
                ]}
              >
                {getFilterCount(filter.id)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'all'
              ? 'Create your first delivery order'
              : `No ${selectedFilter} orders`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/order-details?id=${item._id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
    backgroundColor: COLORS.white,
    padding: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 5,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 25,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.primaryDark,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  filterBadgeTextActive: {
    color: COLORS.white,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
