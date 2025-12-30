// context/AuthContext.js - Updated to provide token for Socket
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ADD THIS for Socket
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user and token on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setLoading(true);
      
      // Load both user and token
      const [storedUser, storedToken] = await Promise.all([
        authService.getStoredUser(),
        AsyncStorage.getItem('accessToken')
      ]);

      if (storedUser && storedToken) {
        console.log('✅ Loaded stored auth:', storedUser.email);
        setUser(storedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        console.log('❌ No stored auth found');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Load auth error:', error);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 Logging in...');
      const response = await authService.login(credentials);

      if (response.success) {
        const { accessToken, user: userData } = response.data;
        
        console.log('✅ Login successful:', userData.email);
        setUser(userData);
        setToken(accessToken);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      console.log('✅ Logged out successfully');
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const refreshAuth = async () => {
    await loadStoredAuth();
  };

  const value = {
    user,
    token, // IMPORTANT: Provide token for Socket
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};