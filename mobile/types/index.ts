export interface Delivery {
  _id: string;
  userId: string;
  riderId?: string;
  companyId?: string;
  status: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
    name?: string;
    phone?: string;
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
    name?: string;
    phone?: string;
  };
  package: {
    type: string;
    size: string;
    weight: number;
    value?: number;
    description?: string;
  };
  estimatedDistance?: number;
  estimatedDuration?: number;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    deliveries: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DeliveryResponse {
  success: boolean;
  message?: string;
  data: {
    delivery: Delivery;
  };
}