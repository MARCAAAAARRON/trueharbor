import { createContext } from 'react';
import type { User } from '../types/api';
import type { LoginInput, RegisterInput } from '../api/auth';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);