import { apiFetch, apiFetchPaginated, PaginatedResponse } from './fetch';

export interface Memory {
  id: string;
  userId: string;
  content: string;
  category: 'observation' | 'strategy' | 'preference' | 'milestone';
  importance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getMemories(
  page = 1,
  pageSize = 20,
  filters?: { search?: string; category?: string },
): Promise<PaginatedResponse<Memory>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.category) params.set('category', filters.category);
  return apiFetchPaginated<Memory>(`/api/memories?${params}`);
}

export function createMemory(data: { content: string; category: string; importance?: number }) {
  return apiFetch<Memory>('/api/memories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMemory(id: string, data: { content?: string; category?: string; importance?: number }) {
  return apiFetch<Memory>(`/api/memories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteMemory(id: string) {
  return apiFetch<{ message: string }>(`/api/memories/${id}`, { method: 'DELETE' });
}
