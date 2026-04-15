import { apiFetch, apiFetchPaginated, PaginatedResponse } from './fetch';
import type { User } from './auth';

export interface ProfileResultSummary {
  dimensionType: string;
  scores: {
    subscales?: Record<string, { raw: number; band: string }>;
    aggregate?: { raw: number; band: string };
  };
  updatedAt: string;
}

export interface AdminUserDetail extends User {
  pet: { id: string; name: string; level: number } | null;
  _count: {
    memories: number;
    messages: number;
  };
  profileResults: ProfileResultSummary[];
  userProfile: { summary: string | null } | null;
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
