export type UserRole = 'user' | 'admin';

export type ProductCategory =
  | 'Chiki & Puffs'
  | 'Chips & Savory'
  | 'Sweet Snacks'
  | 'Drinks & Milk';

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'QRIS' | 'COD';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  price: number;
  weight: string;
  stock: number;
  image_url: string;
  flavor_notes: string;
  is_featured: boolean;
  created_at: string;
}

export interface ProductInput {
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  weight: string;
  stock: number;
  image_url: string;
  flavor_notes: string;
  is_featured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  postal_code: string;
  payment_method: PaymentMethod;
  notes: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  postal_code: string;
  payment_method: PaymentMethod;
  notes: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
}

export type AppView =
  | 'home'
  | 'product'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'auth'
  | 'admin';
