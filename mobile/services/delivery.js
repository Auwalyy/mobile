// services/delivery.js
import api from './api';

export const deliveryService = {
  // Create delivery order
  createDelivery: async (deliveryData) => {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  // Get customer's deliveries
  getMyDeliveries: async () => {
    const response = await api.get('/deliveries/my');
    return response.data;
  },

  // Get rider's deliveries
  getRiderDeliveries: async () => {
    const response = await api.get('/deliveries/rider');
    return response.data;
  },

  // Get delivery by ID
  getDeliveryById: async (deliveryId) => {
    const response = await api.get(`/deliveries/${deliveryId}`);
    return response.data;
  },

  // Update delivery status (rider)
  updateDeliveryStatus: async (deliveryId, status, location = null) => {
    const response = await api.patch(`/deliveries/${deliveryId}/status`, {
      status,
      location
    });
    return response.data;
  },

  // ========== NEW ENDPOINTS ==========

  // Get nearby riders for deliveries
  getNearbyRiders: async (lat, lng, radius = 10000, vehicleType = null) => {
    const params = { lat, lng, radius };
    if (vehicleType) {
      params.vehicleType = vehicleType;
    }
    
    const response = await api.get('/rider/nearby', { params });
    return response.data;
  },

  // Get nearby drivers for rides (if you have ride functionality)
  getNearbyDrivers: async (lat, lng, radius = 10000, vehicleType = null) => {
    const params = { lat, lng, radius };
    if (vehicleType) {
      params.vehicleType = vehicleType;
    }
    
    const response = await api.get('/rider/drivers/nearby', { params });
    return response.data;
  },

  // Assign rider to delivery
  assignDelivery: async (deliveryId, riderId) => {
    const response = await api.patch(`/deliveries/${deliveryId}/assign`, {
      riderId
    });
    return response.data;
  },

  // Get rider profile
  getRiderProfile: async () => {
    const response = await api.get('/rider/profile');
    return response.data;
  },

  // Update rider location
  updateRiderLocation: async (lat, lng, address = null) => {
    const data = { lat, lng };
    if (address) {
      data.address = address;
    }
    
    const response = await api.patch('/rider/location', data);
    return response.data;
  },

  // Update rider online status
  updateRiderOnlineStatus: async (isOnline) => {
    const response = await api.patch('/rider/online-status', { isOnline });
    return response.data;
  }
};