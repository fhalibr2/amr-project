export type PrescriptionType = 'none' | 'red' | 'red_retention' | 'black';

export interface Product {
  id: number;
  name: string;
  brand?: string;
  category: string; // Category ID
  subcategory?: string;
  price: number;
  originalPrice?: number;
  pmcPrice?: number; // Preço Máximo ao Consumidor
  cost?: number;
  stock: number;
  minStock?: number;
  prescriptionType: PrescriptionType;
  isGeneric?: boolean;
  isOffer?: boolean;
  offerTag?: string; // e.g., "Leve 3 Pague 2", "50% OFF no 2º"
  offerDurationType?: 'stock_or_time' | 'time_only' | 'stock_only';
  offerDurationText?: string;
  description: string;
  ean?: string;
  additionalEans?: string[];
  ms?: string; // Registro no Ministério da Saúde ou "ISENTO"
  manufacturer?: string;
  laboratory?: string;
  dosage?: string;
  quantity?: string;
  activeIngredient?: string;
  image?: string; // Custom URL or Base64 data if provided
  tags?: string[];
  salesCount?: number;
  isActive: boolean;
  searchKeywords?: string[]; // Extra keywords for misspellings like ["diprina", "dirona"]
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  isExclusiveOfferSection?: boolean;
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  password?: string;
  pin?: string; // 8-digit recovery PIN
  phone?: string;
  birthDate?: string;
  address?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
  };
  isAdmin: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PrescriptionFile {
  dataUrl: string;
  fileName: string;
  fileType: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  address?: User['address'];
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'card' | 'pix' | 'cash';
  changeAmount?: string;
  cashBanknote?: number;
  calculatedChange?: number;
  prescriptionFile?: PrescriptionFile;
  status: 'pending' | 'confirmed' | 'separating' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  verifiedEanItems?: Record<number, boolean>; // Verified item IDs during EAN checking
  deliveryConfirmedBy?: 'customer' | 'driver' | 'staff';
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  appName: string;
  appSubtitle: string;
  appLogo: string;
  logoSize: number; // in pixels (e.g. 36)
  heroTitle: string;
  heroSubtitle: string;
  offerAnnouncements?: string[]; // Array of custom announcement notifications
  storePhone: string;
  deliveryFee: number;
  pickupFee: number;
  showStockToCustomer?: boolean; // Default false
  soundEnabled: boolean;
  autoRefreshInterval: number; // in seconds
}

