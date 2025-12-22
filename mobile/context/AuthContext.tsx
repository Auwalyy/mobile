// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  

 // context/AuthContext.tsx - Update login function
const login = async (emailOrPhone: string, password: string) => {
  try {
    const response = await axios.post('http://10.151.213.235:5000/api/auth/login', {
      emailOrPhone,
      password,
    });

    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      await Promise.all([
        AsyncStorage.setItem('accessToken', accessToken),
        AsyncStorage.setItem('refreshToken', refreshToken),
        AsyncStorage.setItem('userData', JSON.stringify(user)),
      ]);

      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // IMPORTANT: Don't redirect here
      // The index.tsx will detect the state change and redirect
    }
  } catch (error) {
    throw error;
  }
};

// Also update the loadUser function to properly set axios headers
const loadUser = async () => {
  try {
    const [userData, accessToken] = await Promise.all([
      AsyncStorage.getItem('userData'),
      AsyncStorage.getItem('accessToken'),
    ]);
    
    if (userData && accessToken) {
      const user = JSON.parse(userData);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
  } catch (error) {
    console.error('Error loading user:', error);
  } finally {
    setIsLoading(false);
  }
};

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};