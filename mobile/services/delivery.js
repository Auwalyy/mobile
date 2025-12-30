// services/delivery.js
import api from './api';

export const deliveryService = {
  // Get nearby delivery persons for delivery
  getNearbyRiders: async (params) => {
    try {
      const response = await api.get('/deliveries/nearby-riders', {
        params: {
          lat: params.lat.toString(),
          lng: params.lng.toString(),
          radius: params.radius || 10000,
          vehicleType: params.vehicleType || ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get nearby delivery persons error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch nearby delivery persons',
        data: []
      };
    }
  },

  // Create a new delivery
  createDelivery: async (deliveryData) => {
    try {
      const formattedData = {
        pickupAddress: deliveryData.pickupAddress,
        pickupLat: deliveryData.pickupLat,
        pickupLng: deliveryData.pickupLng,
        pickupName: deliveryData.pickupName || deliveryData.pickupAddress,
        dropoffAddress: deliveryData.dropoffAddress,
        dropoffLat: deliveryData.dropoffLat,
        dropoffLng: deliveryData.dropoffLng,
        dropoffName: deliveryData.dropoffName || deliveryData.dropoffAddress,
        itemType: deliveryData.itemType || 'package',
        itemDescription: deliveryData.itemDescription || 'Package delivery',
        itemWeight: deliveryData.itemWeight || 1,
        itemValue: deliveryData.itemValue || 0,
        customerName: deliveryData.customerName,
        customerPhone: deliveryData.customerPhone,
        recipientName: deliveryData.recipientName,
        recipientPhone: deliveryData.recipientPhone,
        estimatedDistance: deliveryData.estimatedDistance || 5000,
        estimatedDuration: deliveryData.estimatedDuration || 600,
        deliveryInstructions: deliveryData.deliveryInstructions || '',
        ...(deliveryData.deliveryPersonId && { deliveryPersonId: deliveryData.deliveryPersonId }),
      };

      console.log('Creating delivery with data:', formattedData);
      const response = await api.post('/deliveries', formattedData);
      return response.data;
    } catch (error) {
      console.error('Create delivery error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create delivery',
        data: null
      };
    }
  },

  // Get my deliveries (Customer)
  getMyDeliveries: async () => {
    try {
      const response = await api.get('/deliveries/my');
      return response.data;
    } catch (error) {
      console.error('Get my deliveries error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch deliveries',
        data: []
      };
    }
  },

  // Get delivery by ID
  getDeliveryById: async (deliveryId) => {
    try {
      const response = await api.get(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      console.error('Get delivery by ID error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch delivery details',
        data: null
      };
    }
  },

  // Update delivery status (Delivery Person)
  updateDeliveryStatus: async (deliveryId, status, location = null) => {
    try {
      const response = await api.patch(`/deliveries/${deliveryId}/status`, {
        status,
        location
      });
      return response.data;
    } catch (error) {
      console.error('Update delivery status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update status',
        data: null
      };
    }
  },

  // Assign delivery to delivery person
  assignDelivery: async (deliveryId, deliveryPersonId) => {
    try {
      const response = await api.patch(`/deliveries/${deliveryId}/assign`, { 
        deliveryPersonId 
      });
      return response.data;
    } catch (error) {
      console.error('Assign delivery error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to assign delivery person',
        data: null
      };
    }
  },

  // Get company deliveries (for company admins)
  getCompanyDeliveries: async (companyId, filters = {}) => {
    try {
      const response = await api.get(`/deliveries/company/${companyId}`, { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      console.error('Get company deliveries error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch company deliveries',
        data: []
      };
    }
  },

  // Cancel delivery
  cancelDelivery: async (deliveryId, reason) => {
    try {
      const response = await api.patch(`/deliveries/${deliveryId}/status`, {
        status: 'cancelled',
        cancellationReason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Cancel delivery error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel delivery',
        data: null
      };
    }
  },

  // Rate delivery
  rateDelivery: async (deliveryId, rating, review) => {
    try {
      const response = await api.post(`/deliveries/${deliveryId}/rate`, {
        rating,
        review
      });
      return response.data;
    } catch (error) {
      console.error('Rate delivery error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to rate delivery',
        data: null
      };
    }
  },

  // Get delivery statistics
  getDeliveryStatistics: async () => {
    try {
      const response = await api.get('/deliveries/statistics');
      return response.data;
    } catch (error) {
      console.error('Get delivery statistics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics',
        data: {}
      };
    }
  }
};