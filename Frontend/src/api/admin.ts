import client from './client';
import type { Order, Product, ProductImage, OrderStatus, PaginatedResponse } from '../types/api';

export interface CreateProductInput {
  name: string;
  slug?: string;
  category_id: number;
  description: string;
  price_cents: number;
  stock: number;
  image_path?: string | null;
  is_active?: boolean;
}

export interface CloudinarySignatureData {
  configured: boolean;
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  upload_url?: string | null;
  mock?: boolean;
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

  updateOrderStatus: async (
    id: number,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string
  ): Promise<Order> => {
    const res = await client.patch<{ data: Order }>(`/admin/orders/${id}/status`, {
      status,
      carrier,
      tracking_number: trackingNumber,
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

  // Media & Cloudinary Storage
  getMediaSignature: async (folder: string = 'trueharbor/products'): Promise<CloudinarySignatureData> => {
    const res = await client.get<{ data: CloudinarySignatureData }>(
      `/admin/media/signature?folder=${encodeURIComponent(folder)}`
    );
    return res.data.data;
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const sig = await adminApi.getMediaSignature('trueharbor/products');

    if (sig.configured && sig.upload_url) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const response = await fetch(sig.upload_url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Cloudinary upload failed. Check file format and size.');
      }

      const data = await response.json();
      return data.secure_url;
    }

    // Local / development test mock: return data URL for immediate preview and testing
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  // Multi-Image Gallery Management
  addProductGalleryImage: async (
    productId: number,
    url: string,
    altText?: string,
    isPrimary?: boolean
  ): Promise<ProductImage> => {
    const res = await client.post<{ data: ProductImage }>(`/admin/products/${productId}/images`, {
      url,
      alt_text: altText,
      is_primary: isPrimary,
    });
    return res.data.data;
  },

  deleteProductGalleryImage: async (productId: number, imageId: number): Promise<void> => {
    await client.delete(`/admin/products/${productId}/images/${imageId}`);
  },

  setPrimaryGalleryImage: async (productId: number, imageId: number): Promise<ProductImage> => {
    const res = await client.patch<{ data: ProductImage }>(
      `/admin/products/${productId}/images/${imageId}/primary`
    );
    return res.data.data;
  },
};
