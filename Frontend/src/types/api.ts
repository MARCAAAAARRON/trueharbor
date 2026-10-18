export type Role = 'customer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
  error?: Record<string, string[]>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  category_id?: number;
  category?: Category;
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  formatted_price?: string;
  stock?: number;
  image_url?: string | null;
  image_path?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  line_total_cents: number;
  formatted_line_total: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal_cents: number;
  formatted_subtotal: string;
  total_items: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'expired';

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price_cents: number;
  formatted_unit_price: string;
  quantity: number;
  line_total_cents: number;
  formatted_line_total: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  status_label: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  formatted_subtotal: string;
  formatted_shipping: string;
  formatted_total: string;
  shipping_address: ShippingAddress;
  payment_intent_id: string | null;
  client_secret?: string | null;
  payment_intent_client_secret?: string | null;
  items: OrderItem[];
  created_at: string;
  expires_at: string;
  paid_at: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}