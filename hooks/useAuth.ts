import { useState } from 'react';
import { authService, LoginPayload, AuthResponse } from '@/services/authService';
import { AppError } from '@/utils/errorHandler';

interface AuthState {
  user: AuthResponse['user'] | null;
  loading: boolean;
  error: AppError | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  async function login(payload: LoginPayload) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await authService.login(payload);
      setState({ user: data.user, loading: false, error: null });
    } catch (err) {
      setState({ user: null, loading: false, error: err as AppError });
    }
  }

  async function logout() {
    await authService.logout();
    setState({ user: null, loading: false, error: null });
  }

  return { ...state, login, logout };
}
