import { apiFetch, apiFetchPaginated, PaginatedResponse } from './fetch';
import type { User } from './auth';

export interface AdminUserDetail extends User {
  pet: { id: string; name: string; level: number } | null;
  _count: {
    memories: number;
    messages: number;
    profiles: number;
  };
}

export function getUsers(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  return apiFetchPaginated<User>(`/api/admin/users?${params}`);
}

export function getUser(id: string) {
  return apiFetch<AdminUserDetail>(`/api/admin/users/${id}`);
}

export function updateUserRole(id: string, role: string) {
  return apiFetch<User>(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export function deleteUser(id: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${id}`, { method: 'DELETE' });
}
