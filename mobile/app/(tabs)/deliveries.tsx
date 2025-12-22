import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import deliveryService, { getMyDeliveries, getRiderDeliveries } from '@/services/DeliveryService';
import DeliveryCard from '@/components/DeliveryCard';
import { Delivery, PaginatedResponse } from '@/types';
import { router, useFocusEffect } from 'expo-router';

export default function DeliveriesScreen() {
  const { user } = useAuth();
  
  // State
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch deliveries on focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDeliveries(1, true);
    }, [selectedStatus])
  );

  // Fetch deliveries
  const fetchDeliveries = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response: PaginatedResponse<Delivery>;
      
      if (user?.role === 'rider') {
        response = await getRiderDeliveries(
          pageNum, 
          10, 
          selectedStatus !== 'all' ? selectedStatus : undefined
        );
      } else {
        response = await getMyDeliveries(
          pageNum, 
          10, 
          selectedStatus !== 'all' ? selectedStatus : undefined
        );
      }

      if (isRefresh || pageNum === 1) {
        setDeliveries(response.data?.deliveries || []);
      } else {
        setDeliveries(prev => [...prev, ...(response.data?.deliveries || [])]);
      }

      // Check if there are more deliveries
      const deliveriesArray = response.data?.deliveries || [];
      setHasMore(deliveriesArray.length === 10);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Fetch deliveries error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to fetch deliveries'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries(1, true);
  };

  // Handle load more
  const onEndReached = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchDeliveries(page + 1);
    }
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Optional: Implement debounced search
  };

  // Filter deliveries based on search and tab
  const filteredDeliveries = deliveries.filter(delivery => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      delivery.pickup?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.dropoff?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery._id?.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    if (activeTab === 'active') {
      return matchesSearch && !['delivered', 'cancelled'].includes(delivery.status);
    } else if (activeTab === 'completed') {
      return matchesSearch && ['delivered'].includes(delivery.status);
    }
    
    return matchesSearch;
  });

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setShowFilterModal(false);
    setPage(1); // Reset page when filter changes
  };

  // Render delivery item
  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <DeliveryCard 
      delivery={item} 
      onPress={() => router.push(`/delivery/${item._id}`)}
    />
  );

  // Render footer for loading more
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#337bff" />
        <Text style={styles.footerText}>Loading more deliveries...</Text>
      </View>
    );
  };

  // Get counts for tabs
  const getDeliveryCounts = () => {
    const total = deliveries.length;
    const active = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).length;
    const completed = deliveries.filter(d => d.status === 'delivered').length;
    
    return { total, active, completed };
  };

  const counts = getDeliveryCounts();

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'created', label: 'Created' },
    { value: 'matched', label: 'Matched' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'picked', label: 'Picked' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Deliveries</Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === 'rider' ? 'Assigned deliveries' : 'All your deliveries'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#333" />
          {selectedStatus !== 'all' && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address, tracking ID..."
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['all', 'active', 'completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} 
              {tab === 'all' && ` (${counts.total})`}
              {tab === 'active' && ` (${counts.active})`}
              {tab === 'completed' && ` (${counts.completed})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Deliveries List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337bff" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.listContent,
            filteredDeliveries.length === 0 && { flex: 1 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#337bff']}
              tintColor="#337bff"
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery ? 'search-outline' : 'cube-outline'} 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No deliveries found' : 'No deliveries yet'}
              </Text>
              <Text style={styles.emptyStateMessage}>
                {searchQuery 
                  ? 'Try searching with different keywords'
                  : user?.role === 'customer'
                    ? 'Create your first delivery'
                    : 'No deliveries assigned to you yet'
                }
              </Text>
              
              {!searchQuery && user?.role === 'customer' && (
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Create Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Create New Delivery Button (Customer only) */}
      {user?.role === 'customer' && filteredDeliveries.length > 0 && (
        <TouchableOpacity 
          style={styles.newDeliveryButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.newDeliveryText}>New Delivery</Text>
        </TouchableOpacity>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={statusOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    selectedStatus === item.value && styles.selectedStatusOption
                  ]}
                  onPress={() => handleStatusFilter(item.value)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === item.value && styles.selectedStatusOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {selectedStatus === item.value && (
                    <Ionicons name="checkmark" size={20} color="#337bff" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value}
              contentContainerStyle={styles.statusList}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => handleStatusFilter('all')}
              >
                <Text style={styles.clearButtonText}>Clear Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

 const styles = StyleSheet.create({
   
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
 
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#337bff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 100,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#337bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  newDeliveryButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#337bff',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newDeliveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
 
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusList: {
    padding: 20,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedStatusOption: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedStatusOptionText: {
    color: '#337bff',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#337bff',
    borderRadius: 10,
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});