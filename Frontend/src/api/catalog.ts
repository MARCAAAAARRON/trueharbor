import client from './client';
import type { Category, PaginatedResponse, Product } from '../types/api';

export interface ProductQueryParams {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  per_page?: number;
}

export async function getCategories(): Promise<Category[]> {
  const response = await client.get<{ data: Category[] } | Category[]>('/categories');
  // Handle both { data: [...] } resource wrapping and direct array
  if ('data' in response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return response.data as Category[];
}

export async function getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
  const response = await client.get<PaginatedResponse<Product>>('/products', {
    params,
  });
  return response.data;
}

export async function getProduct(slug: string): Promise<Product> {
  const response = await client.get<{ data: Product }>('/products/' + encodeURIComponent(slug));
  return response.data.data;
}
