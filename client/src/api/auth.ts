import { apiFetch } from './fetch';

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt?: string;
}

export function register(data: { email: string; username: string; password: string }) {
  return apiFetch<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return apiFetch<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

export function getMe() {
  return apiFetch<User>('/api/auth/me');
}
