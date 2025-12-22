import axios from 'axios'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://10.151.213.235:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Platform': Platform.OS,
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken')
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Request new access token
        const refreshResponse = await axios.post(
          'http://10.151.213.235:5000/api/auth/refresh-token',
          { refreshToken }
        )

        if (refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.data.accessToken
          
          // Store new token
          await AsyncStorage.setItem('accessToken', newAccessToken)
          
          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          
          // Retry original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        await Promise.all([
          AsyncStorage.removeItem('accessToken'),
          AsyncStorage.removeItem('refreshToken'),
          AsyncStorage.removeItem('userData'),
        ])
        
        // Redirect to login (you might want to use navigation here)
        // For now, we'll reject the promise
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api