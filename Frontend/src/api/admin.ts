import client from './client';
import type { Order, Product, OrderStatus, PaginatedResponse } from '../types/api';

export interface CreateProductInput {
  name: string;
  slug?: string;
  category_id: number;
  description: string;
  price_cents: number;
  stock: number;
  image_path?: string;
  is_active?: boolean;
}

export const adminApi = {
  // Orders
  getOrders: async (
    status?: string,
    search?: string,
    page: number = 1
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);

    const res = await client.get<PaginatedResponse<Order>>(`/admin/orders?${params.toString()}`);
    return res.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const res = await client.get<{ data: Order }>(`/admin/orders/${id}`);
    return res.data.data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const res = await client.patch<{ data: Order }>(`/admin/orders/${id}/status`, {
      status,
    });
    return res.data.data;
  },

  // Products
  getProducts: async (
    page: number = 1,
    categoryId?: number,
    search?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (categoryId) params.set('category_id', String(categoryId));
    if (search) params.set('search', search);

    const res = await client.get<PaginatedResponse<Product>>(`/admin/products?${params.toString()}`);
    return res.data;
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const res = await client.get<{ data: Product[] }>('/admin/products/low-stock');
    return res.data.data;
  },

  createProduct: async (input: CreateProductInput): Promise<Product> => {
    const res = await client.post<{ data: Product }>('/admin/products', input);
    return res.data.data;
  },

  updateProduct: async (id: number, input: Partial<CreateProductInput>): Promise<Product> => {
    const res = await client.put<{ data: Product }>(`/admin/products/${id}`, input);
    return res.data.data;
  },

  updateProductStock: async (id: number, stock: number): Promise<Product> => {
    const res = await client.patch<{ data: Product }>(`/admin/products/${id}/stock`, {
      stock,
    });
    return res.data.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await client.delete(`/admin/products/${id}`);
  },

  // Customer order cancellation
  cancelOrder: async (id: number): Promise<Order> => {
    const res = await client.post<{ data: Order }>(`/orders/${id}/cancel`);
    return res.data.data;
  },
};
