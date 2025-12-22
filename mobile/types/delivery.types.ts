export interface LocationPoint {
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
}

export interface DeliveryData {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  type: 'small' | 'medium' | 'large';
  weightKg: number;
  price: number;
  estimatedDistance?: number;
}

export interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}


export interface DeliveryFormData {
  pickupContactName: string;
  pickupContactPhone: string;
  dropoffContactName: string;
  dropoffContactPhone: string;
  deliveryType: 'small' | 'medium' | 'large';
  weight: string;
  price: string;
  notes: string;
  itemDescription: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  distance: string;
  eta: string;
  photo: string | null;
}


export interface DeliveryFormData {
  pickupContactName: string;
  pickupContactPhone: string;
  dropoffContactName: string;
  dropoffContactPhone: string;
  deliveryType: 'small' | 'medium' | 'large';
  weight: string;
  price: string;
}