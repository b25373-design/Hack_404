
export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER'
}

export enum ShopCategory {
  STATIONARY = 'STATIONARY',
  ELECTRONICS = 'ELECTRONICS',
  SALON = 'SALON',
  LAUNDRY = 'LAUNDRY'
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  stock?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration?: string;
}

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  location: string;
  timing: string;
  contact: string;
  items?: InventoryItem[];
  services?: ServiceItem[];
  imageUrl: string;
}

export interface Appointment {
  id: string;
  shopId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  serviceId: string;
  serviceName: string;
  timeSlot: string;
  date: string;
  status: 'requested' | 'confirmed' | 'ongoing' | 'completed' | 'declined';
  paymentSettled?: boolean;
  reminderSent?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored for diagnostic simulation
  role: UserRole;
  shopId?: string; // For sellers
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  metadata: string;
}

export type AppView = 'shops' | 'appointments' | 'map';
