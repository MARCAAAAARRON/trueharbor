import client from './client';
import type { Cart } from '../types/api';

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await client.get<{ data: Cart }>('/cart');
    return res.data.data;
  },

  addToCart: async (productId: number, quantity: number = 1): Promise<Cart> => {
    const res = await client.post<{ data: Cart }>('/cart', {
      product_id: productId,
      quantity,
    });
    return res.data.data;
  },

  updateCartItem: async (cartItemId: number, quantity: number): Promise<Cart> => {
    const res = await client.patch<{ data: Cart }>(`/cart/items/${cartItemId}`, {
      quantity,
    });
    return res.data.data;
  },

  removeCartItem: async (cartItemId: number): Promise<Cart> => {
    const res = await client.delete<{ data: Cart }>(`/cart/items/${cartItemId}`);
    return res.data.data;
  },

  clearCart: async (): Promise<Cart> => {
    const res = await client.delete<{ data: Cart }>('/cart');
    return res.data.data;
  },
};
