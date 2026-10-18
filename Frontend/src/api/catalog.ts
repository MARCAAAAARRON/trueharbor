import client from './client';
import type { Category, PaginatedResponse, Product, ProductReview, ProductReviewsResponse } from '../types/api';

export interface ProductQueryParams {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  per_page?: number;
}

export interface SubmitReviewInput {
  rating: number;
  title?: string;
  comment: string;
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

export async function getProductReviews(productId: number | string): Promise<ProductReviewsResponse> {
  const response = await client.get<ProductReviewsResponse>(`/products/${encodeURIComponent(productId)}/reviews`);
  return response.data;
}

export async function submitProductReview(
  productId: number | string,
  input: SubmitReviewInput
): Promise<{ message: string; review: ProductReview }> {
  const response = await client.post<{ message: string; review: ProductReview }>(
    `/products/${encodeURIComponent(productId)}/reviews`,
    input
  );
  return response.data;
}

export async function deleteProductReview(reviewId: number): Promise<{ message: string }> {
  const response = await client.delete<{ message: string }>(`/reviews/${reviewId}`);
  return response.data;
}
