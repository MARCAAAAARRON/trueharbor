import client from './client';
import type { AuthResponse, User } from '../types/api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const register = (input: RegisterInput) => client.post<AuthResponse>('/auth/register', input).then((r) => r.data);

export const login = (input: LoginInput) => client.post<AuthResponse>('/auth/login', input).then((r) => r.data);

export const logout = () => client.post('/auth/logout');

export const me = () => client.get<User>('/auth/me').then((r) => r.data);