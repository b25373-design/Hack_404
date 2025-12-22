
import { Shop, ShopCategory } from './types';

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'North Campus Stationary',
    category: ShopCategory.STATIONARY,
    location: 'North Campus, Block A',
    timing: '09:00 AM - 08:00 PM',
    contact: '9988776655',
    imageUrl: 'https://picsum.photos/seed/stationary/400/300',
    items: [
      { id: 'item-1', name: 'A4 Notebook (160 pgs)', price: 60, available: true, stock: 45 },
      { id: 'item-2', name: 'Blue Gel Pen', price: 10, available: true, stock: 120 },
      { id: 'item-3', name: 'Lab Coat (L)', price: 350, available: false, stock: 0 },
      { id: 'item-4', name: 'Scientific Calculator', price: 1200, available: true, stock: 5 },
    ]
  },
  {
    id: 'shop-2',
    name: 'A2Z Electronic Resources',
    category: ShopCategory.ELECTRONICS,
    location: 'South Campus, Main Arcade',
    timing: '10:00 AM - 07:00 PM',
    contact: '9944556677',
    imageUrl: 'https://picsum.photos/seed/electronics/400/300',
    items: [
      { id: 'elec-1', name: 'Arduino Uno R3', price: 650, available: true, stock: 12 },
      { id: 'elec-2', name: 'Jumper Wires (M-M) 40pcs', price: 120, available: true, stock: 30 },
      { id: 'elec-3', name: 'Raspberry Pi 4 (4GB)', price: 4500, available: false, stock: 0 },
      { id: 'elec-4', name: 'Soldering Kit', price: 850, available: true, stock: 8 },
    ]
  },
  {
    id: 'shop-3',
    name: 'Mandi Salon Elite',
    category: ShopCategory.SALON,
    location: 'North Campus, Amenities Center',
    timing: '08:00 AM - 09:00 PM',
    contact: '9911223344',
    imageUrl: 'https://picsum.photos/seed/salon/400/300',
    services: [
      { id: 'srv-1', name: 'Haircut (Classic)', price: 100, duration: '30 mins' },
      { id: 'srv-2', name: 'Beard Trim', price: 50, duration: '15 mins' },
      { id: 'srv-3', name: 'Head Massage', price: 80, duration: '20 mins' },
      { id: 'srv-4', name: 'Hair Coloring', price: 500, duration: '60 mins' },
    ]
  },
  {
    id: 'shop-4',
    name: 'Tumbler Laundry Services',
    category: ShopCategory.LAUNDRY,
    location: 'South Campus, Near Hostel D3',
    timing: '07:00 AM - 10:00 PM',
    contact: '9900998877',
    imageUrl: 'https://picsum.photos/seed/laundry/400/300',
    services: [
      { id: 'wash-1', name: 'Wash & Fold (per kg)', price: 40, duration: '24 hrs' },
      { id: 'wash-2', name: 'Wash & Iron (per kg)', price: 60, duration: '36 hrs' },
      { id: 'wash-3', name: 'Dry Cleaning (Suit)', price: 250, duration: '72 hrs' },
      { id: 'wash-4', name: 'Blanket Wash', price: 150, duration: '48 hrs' },
    ]
  }
];
