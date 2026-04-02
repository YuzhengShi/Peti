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

export function getMemories(page = 1, pageSize = 20): Promise<PaginatedResponse<Memory>> {
  return apiFetchPaginated<Memory>(`/api/memories?page=${page}&pageSize=${pageSize}`);
}

export function createMemory(data: { content: string; category: string; importance?: number }) {
  return apiFetch<Memory>('/api/memories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteMemory(id: string) {
  return apiFetch<{ message: string }>(`/api/memories/${id}`, { method: 'DELETE' });
}
