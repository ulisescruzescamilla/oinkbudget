import apiClient from '@/api/client';
import { saveToken, clearToken } from '@/utils/tokenStorage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    await saveToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    await clearToken();
  },
};
