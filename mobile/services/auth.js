// services/auth.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Login (both customer and rider)
  login: async (credentials) => {
    try {
      console.log('Login attempt with:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // Check if response has the expected structure
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      // Your backend returns: {data: {...}, message: "...", success: true}
      // So we need to access response.data.data
      const { accessToken, refreshToken, user } = response.data.data; // CHANGED HERE
      
      // Validate tokens before storing
      if (!accessToken || !refreshToken || !user) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid login response from server');
      }
      
      // Store tokens and user data
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Login successful, tokens stored');
      return response.data; // Return the full response
      
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear storage even if API fails
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token && token !== 'undefined';
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  // Get stored user
  getStoredUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr || userStr === 'undefined') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } catch (error) {
      console.error('Clear auth error:', error);
    }
  }
};