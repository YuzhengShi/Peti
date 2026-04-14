import { apiFetch, apiFetchPaginated, PaginatedResponse } from './fetch';

export interface Message {
  id: string;
  userId: string;
  role: 'user' | 'pet';
  content: string;
  agentType?: string;
  createdAt: string;
}

export function getMessages(page = 1, pageSize = 50, latest = false): Promise<PaginatedResponse<Message>> {
  const params = `page=${page}&pageSize=${pageSize}${latest ? '&latest=true' : ''}`;
  return apiFetchPaginated<Message>(`/api/messages?${params}`);
}

export function deleteMessage(id: string) {
  return apiFetch<{ message: string }>(`/api/messages/${id}`, { method: 'DELETE' });
}
