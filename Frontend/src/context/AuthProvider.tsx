import { useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { tokenStore } from '../api/client';
import type { User } from '../types/api';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // If a token exists we must ask the server who it belongs to, so start in "loading"
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login: async (input) => {
      const { user, token } = await authApi.login(input);
      tokenStore.set(token);
      setUser(user);
    },
    register: async (input) => {
      const { user, token } = await authApi.register(input);
      tokenStore.set(token);
      setUser(user);
    },
    logout: async () => {
      // Fire-and-forget server revocation in background while token is present
      authApi.logout().catch(() => {});

      // Instantly wipe local token and user state with zero delay
      tokenStore.clear();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}