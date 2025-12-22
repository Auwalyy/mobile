import { LocationPoint } from '../types/delivery.types';
import { PRICING } from './constant';

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const estimateDeliveryPrice = (
  pickup: LocationPoint,
  dropoff: LocationPoint,
  type: 'small' | 'medium' | 'large',
  weightKg: number
): number => {
  const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const typeMultiplier = DELIVERY_TYPES[type].multiplier;
  const weightMultiplier = Math.max(1, weightKg / 2);
  
  return Math.round(
    (PRICING.BASE_FARE + (distance * PRICING.DISTANCE_RATE)) * 
    typeMultiplier * 
    weightMultiplier
  );
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+234|0)[789]\d{9}$/.test(cleaned);
};

export const validateWeight = (weight: string): boolean => {
  const numWeight = parseFloat(weight);
  return !isNaN(numWeight) && 
         numWeight >= PRICING.MIN_WEIGHT && 
         numWeight <= PRICING.MAX_WEIGHT;
};