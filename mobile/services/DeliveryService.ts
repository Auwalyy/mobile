import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Delivery, DeliveryResponse, PaginatedResponse } from '@/types';

const API_URL = 'http://10.151.213.235:5000/api';

// Helper function to get token from AsyncStorage
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Authentication error:', error.response.data);
      // You could redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// Named exports for specific functions
export const getMyDeliveries = async (
  page = 1,
  limit = 10,
  status?: string
): Promise<PaginatedResponse<Delivery>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  const response = await api.get(`/deliveries/my?${params}`);
  return response.data;
};

export const getRiderDeliveries = async (
  page = 1,
  limit = 10,
  status?: string
): Promise<PaginatedResponse<Delivery>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  const response = await api.get(`/deliveries/rider?${params}`);
  return response.data;
};

export const getDeliveryById = async (id: string): Promise<DeliveryResponse> => {
  const response = await api.get(`/deliveries/${id}`);
  return response.data;
};

export const createDelivery = async (data: any): Promise<DeliveryResponse> => {
  const response = await api.post('/deliveries', data);
  return response.data;
};

export const updateDeliveryStatus = async (
  deliveryId: string,
  status: string
): Promise<DeliveryResponse> => {
  const response = await api.patch(`/deliveries/${deliveryId}/status`, { status });
  return response.data;
};

// Default export for the service object
const deliveryService = {
  getMyDeliveries,
  getRiderDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
};

export default deliveryService;