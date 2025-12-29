// utils/constants.js

/**
 * Color Palette
 */
export const COLORS = {
  // Primary Colors
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#E3F2FD',
  
  // Secondary Colors
  secondary: '#5856D6',
  secondaryDark: '#3634A3',
  secondaryLight: '#EDE7F6',
  
  // Status Colors
  success: '#34C759',
  successDark: '#248A3D',
  successLight: '#E8F5E9',
  
  danger: '#FF3B30',
  dangerDark: '#C9302C',
  dangerLight: '#FFEBEE',
  
  warning: '#FF9500',
  warningDark: '#E68900',
  warningLight: '#FFF3E0',
  
  info: '#00C7BE',
  infoDark: '#00A598',
  infoLight: '#E0F7FA',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  dark: '#1C1C1E',
  darkGray: '#2C2C2E',
  
  gray: '#8E8E93',
  grayLight: '#C6C6C8',
  
  light: '#F2F2F7',
  lightGray: '#E5E5EA',
  
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  
  // Background Colors
  background: '#F2F2F7',
  backgroundDark: '#000000',
  surface: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textDisabled: '#C6C6C8',
  textWhite: '#FFFFFF',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Map Colors
  mapPrimary: '#4285F4',
  mapSuccess: '#0F9D58',
  mapWarning: '#F4B400',
  mapDanger: '#DB4437',
};

/**
 * Delivery Status Types
 */
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

/**
 * Delivery Status Display Names
 */
export const DELIVERY_STATUS_LABELS = {
  [DELIVERY_STATUS.PENDING]: 'Pending',
  [DELIVERY_STATUS.ASSIGNED]: 'Assigned',
  [DELIVERY_STATUS.PICKED_UP]: 'Picked Up',
  [DELIVERY_STATUS.IN_TRANSIT]: 'In Transit',
  [DELIVERY_STATUS.DELIVERED]: 'Delivered',
  [DELIVERY_STATUS.CANCELLED]: 'Cancelled',
  [DELIVERY_STATUS.FAILED]: 'Failed',
};

/**
 * Delivery Status Colors
 */
export const DELIVERY_STATUS_COLORS = {
  [DELIVERY_STATUS.PENDING]: COLORS.warning,
  [DELIVERY_STATUS.ASSIGNED]: COLORS.info,
  [DELIVERY_STATUS.PICKED_UP]: COLORS.primary,
  [DELIVERY_STATUS.IN_TRANSIT]: COLORS.primary,
  [DELIVERY_STATUS.DELIVERED]: COLORS.success,
  [DELIVERY_STATUS.CANCELLED]: COLORS.danger,
  [DELIVERY_STATUS.FAILED]: COLORS.danger,
};

/**
 * User Roles
 */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RIDER: 'rider',
  COMPANY_ADMIN: 'company_admin',
  ADMIN: 'admin',
};

/**
 * User Role Display Names
 */
export const USER_ROLE_LABELS = {
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.RIDER]: 'Rider',
  [USER_ROLES.COMPANY_ADMIN]: 'Company Admin',
  [USER_ROLES.ADMIN]: 'Admin',
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 4.8156, // Port Harcourt, Nigeria
  DEFAULT_LONGITUDE: 7.0498,
  DEFAULT_LATITUDE_DELTA: 0.0922,
  DEFAULT_LONGITUDE_DELTA: 0.0421,
  
  // Zoom levels
  ZOOM_CITY: 0.1,
  ZOOM_STREET: 0.01,
  ZOOM_BUILDING: 0.001,
  
  // Animation duration
  ANIMATION_DURATION: 1000,
  
  // Marker sizes
  MARKER_SIZE: 40,
  RIDER_MARKER_SIZE: 45,
  
  // Search radius (in meters)
  SEARCH_RADIUS: 5000,
  NEARBY_RIDERS_RADIUS: 10000,
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_LOCATION: 'lastLocation',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  LOCATION_PERMISSION: 'locationPermission',
};

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[\d\s-()]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  ADDRESS_MAX_LENGTH: 200,
  PACKAGE_DETAILS_MAX_LENGTH: 500,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  REQUIRED_FIELD: 'This field is required',
  
  // Location errors
  LOCATION_PERMISSION_DENIED: 'Location permission denied',
  LOCATION_UNAVAILABLE: 'Unable to get location',
  INVALID_LOCATION: 'Invalid location selected',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timeout. Please try again',
  
  // Delivery errors
  NO_RIDERS_AVAILABLE: 'No riders available in your area',
  DELIVERY_CREATE_FAILED: 'Failed to create delivery',
  DELIVERY_UPDATE_FAILED: 'Failed to update delivery',
  
  // Generic
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  DELIVERY_CREATED: 'Delivery order created successfully!',
  DELIVERY_UPDATED: 'Delivery status updated',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};

/**
 * Font Sizes
 */
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
};

/**
 * Spacing
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

/**
 * Border Radius
 */
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

/**
 * Shadow Styles
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Screen Breakpoints
 */
export const BREAKPOINTS = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Animation Durations
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

/**
 * Delivery Priority Levels
 */
export const DELIVERY_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

/**
 * Delivery Priority Colors
 */
export const DELIVERY_PRIORITY_COLORS = {
  [DELIVERY_PRIORITY.LOW]: COLORS.gray,
  [DELIVERY_PRIORITY.NORMAL]: COLORS.info,
  [DELIVERY_PRIORITY.HIGH]: COLORS.warning,
  [DELIVERY_PRIORITY.URGENT]: COLORS.danger,
};

/**
 * Vehicle Types
 */
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  VAN: 'van',
  TRUCK: 'truck',
};

/**
 * Vehicle Type Icons (Emoji)
 */
export const VEHICLE_TYPE_ICONS = {
  [VEHICLE_TYPES.BIKE]: '🚲',
  [VEHICLE_TYPES.MOTORCYCLE]: '🏍️',
  [VEHICLE_TYPES.CAR]: '🚗',
  [VEHICLE_TYPES.VAN]: '🚐',
  [VEHICLE_TYPES.TRUCK]: '🚚',
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  WALLET: 'wallet',
};

/**
 * Payment Status
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  DELIVERY_CREATED: 'delivery_created',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DELIVERY_PICKED_UP: 'delivery_picked_up',
  DELIVERY_IN_TRANSIT: 'delivery_in_transit',
  DELIVERY_DELIVERED: 'delivery_delivered',
  DELIVERY_CANCELLED: 'delivery_cancelled',
  RIDER_NEARBY: 'rider_nearby',
  RATING_REQUEST: 'rating_request',
};

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  FULL: 'MMMM DD, YYYY',
  SHORT: 'MM/DD/YYYY',
  TIME: 'HH:mm A',
  DATETIME: 'MM/DD/YYYY HH:mm A',
  ISO: 'YYYY-MM-DD',
};

/**
 * App Configuration
 */
export const APP_CONFIG = {
  APP_NAME: 'Delivery App',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@deliveryapp.com',
  SUPPORT_PHONE: '+234 XXX XXX XXXX',
  TERMS_URL: 'https://deliveryapp.com/terms',
  PRIVACY_URL: 'https://deliveryapp.com/privacy',
  
  // Feature flags
  FEATURES: {
    REAL_TIME_TRACKING: true,
    PUSH_NOTIFICATIONS: true,
    IN_APP_CHAT: false,
    RATINGS: true,
    MULTIPLE_STOPS: false,
    SCHEDULED_DELIVERY: false,
  },
};

/**
 * Distance Units
 */
export const DISTANCE_UNITS = {
  KILOMETERS: 'km',
  METERS: 'm',
  MILES: 'mi',
};

/**
 * Time Units
 */
export const TIME_UNITS = {
  SECONDS: 's',
  MINUTES: 'min',
  HOURS: 'h',
  DAYS: 'd',
};

/**
 * Rating Values
 */
export const RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 0,
};

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Location Update Intervals
 */
export const LOCATION_UPDATE = {
  FOREGROUND_INTERVAL: 5000, // 5 seconds
  BACKGROUND_INTERVAL: 10000, // 10 seconds
  DISTANCE_INTERVAL: 10, // 10 meters
  ACCURACY: 'high',
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Image Configuration
 */
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  QUALITY: 0.8,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
};

/**
 * Map Marker Types
 */
export const MARKER_TYPES = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  RIDER: 'rider',
  CUSTOMER: 'customer',
  CURRENT_LOCATION: 'current_location',
};

/**
 * Delivery Package Sizes
 */
export const PACKAGE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extra_large',
};

/**
 * Package Size Descriptions
 */
export const PACKAGE_SIZE_DESCRIPTIONS = {
  [PACKAGE_SIZES.SMALL]: 'Up to 2kg - Documents, small parcels',
  [PACKAGE_SIZES.MEDIUM]: 'Up to 10kg - Boxes, packages',
  [PACKAGE_SIZES.LARGE]: 'Up to 30kg - Large boxes, multiple items',
  [PACKAGE_SIZES.EXTRA_LARGE]: 'Over 30kg - Furniture, appliances',
};

/**
 * Default Values
 */
export const DEFAULTS = {
  CURRENCY: '₦', // Nigerian Naira
  CURRENCY_CODE: 'NGN',
  LANGUAGE: 'en',
  COUNTRY_CODE: 'NG',
  PHONE_PREFIX: '+234',
};

/**
 * Regular Expressions for Validation
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s-()]+$/,
  NIGERIAN_PHONE: /^(\+?234|0)[789]\d{9}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  LETTERS_ONLY: /^[a-zA-Z\s]+$/,
  NUMBERS_ONLY: /^\d+$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

export default {
  COLORS,
  DELIVERY_STATUS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  USER_ROLES,
  USER_ROLE_LABELS,
  MAP_CONFIG,
  API_CONFIG,
  STORAGE_KEYS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  BREAKPOINTS,
  ANIMATION_DURATION,
  DELIVERY_PRIORITY,
  DELIVERY_PRIORITY_COLORS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_ICONS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  DATE_FORMATS,
  APP_CONFIG,
  DISTANCE_UNITS,
  TIME_UNITS,
  RATING,
  PAGINATION,
  LOCATION_UPDATE,
  HTTP_STATUS,
  IMAGE_CONFIG,
  MARKER_TYPES,
  PACKAGE_SIZES,
  PACKAGE_SIZE_DESCRIPTIONS,
  DEFAULTS,
  REGEX,
};