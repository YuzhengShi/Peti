import { apiFetch, apiFetchPaginated, PaginatedResponse } from './fetch';

export interface Message {
  id: string;
  userId: string;
  role: 'user' | 'pet';
  content: string;
  agentType?: string;
  createdAt: string;
}

export function getMessages(page = 1, pageSize = 50): Promise<PaginatedResponse<Message>> {
  return apiFetchPaginated<Message>(`/api/messages?page=${page}&pageSize=${pageSize}`);
}

export function deleteMessage(id: string) {
  return apiFetch<{ message: string }>(`/api/messages/${id}`, { method: 'DELETE' });
}
