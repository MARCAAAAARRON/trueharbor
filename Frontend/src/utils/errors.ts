import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

export function getErrorMessage(error: unknown, fallback: string = 'Something went wrong'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const fieldErrors = error.response?.data?.errors ?? error.response?.data?.error;
    const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined;
    return firstFieldError ?? error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.errors ?? error.response?.data?.error ?? {};
  }
  return {};
}

export function extractValidationErrors(error: unknown): Record<string, string[]> | null {
  const fields = getFieldErrors(error);
  return Object.keys(fields).length > 0 ? fields : null;
}