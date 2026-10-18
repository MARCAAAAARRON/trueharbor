import client from './client';
import type { Order, ShippingAddress, PaginatedResponse } from '../types/api';

export const checkoutApi = {
  createOrder: async (shippingAddress: ShippingAddress): Promise<Order> => {
    const res = await client.post<{ data: Order }>('/checkout', {
      shipping_address: shippingAddress,
    });
    return res.data.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const res = await client.get<{ data: Order }>(`/orders/${id}`);
    return res.data.data;
  },

  getUserOrders: async (page: number = 1): Promise<PaginatedResponse<Order>> => {
    const res = await client.get<PaginatedResponse<Order>>(`/orders?page=${page}`);
    return res.data;
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const res = await client.post<{ data: Order }>(`/orders/${id}/cancel`);
    return res.data.data;
  },

  confirmTestPayment: async (paymentIntentId: string): Promise<void> => {
    await client.post('/webhooks/stripe', {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
        },
      },
    });
  },
};
