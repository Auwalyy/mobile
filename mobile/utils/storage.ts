// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
} as const;

export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

export const setItem = async (key: string, value: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
};

export const removeItem = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
};

export const clearStorage = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

export const getAuthData = async () => {
  const [accessToken, refreshToken, userData] = await Promise.all([
    getItem(StorageKeys.ACCESS_TOKEN),
    getItem(StorageKeys.REFRESH_TOKEN),
    getItem(StorageKeys.USER_DATA),
  ]);

  return {
    accessToken,
    refreshToken,
    user: userData ? JSON.parse(userData) : null,
  };
};