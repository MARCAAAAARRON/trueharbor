import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { cartApi } from '../api/cart';
import type { Cart } from '../types/api';
import { formatPrice } from '../utils/format';
import { CartContext, type CartContextValue } from './CartContext';
import { useAuth } from '../hooks/useAuth';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // ignore unauthenticated or network errors silently
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (user) {
      cartApi
        .getCart()
        .then((data) => {
          if (active) setCart(data);
        })
        .catch(() => {
          // ignore
        });
    } else {
      Promise.resolve().then(() => {
        if (active) setCart(null);
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addToCart = useCallback(
    async (productId: number, quantity: number = 1) => {
      if (!user) {
        throw new Error('Please sign in to add items to your cart.');
      }
      try {
        setLoading(true);
        const updated = await cartApi.addToCart(productId, quantity);
        setCart(updated);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      try {
        setLoading(true);
        const updated = await cartApi.updateCartItem(cartItemId, quantity);
        setCart(updated);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      try {
        setLoading(true);
        const updated = await cartApi.removeCartItem(cartItemId);
        setCart(updated);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      const updated = await cartApi.clearCart();
      setCart(updated);
    } finally {
      setLoading(false);
    }
  }, []);

  const itemCount = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotalCents = cart?.subtotal_cents ?? 0;
  const formattedSubtotal = cart?.formatted_subtotal ?? formatPrice(subtotalCents);

  const value: CartContextValue = {
    cart,
    loading,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    itemCount,
    subtotalCents,
    formattedSubtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
