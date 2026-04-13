import { apiFetch } from './fetch';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  appearance: Record<string, unknown>;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export function createPet(data: { name: string; appearance?: Record<string, unknown> }) {
  return apiFetch<Pet>('/api/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMyPet() {
  return apiFetch<Pet>('/api/pets/mine');
}

export function updatePet(id: string, data: { name?: string; appearance?: Record<string, unknown> }) {
  return apiFetch<Pet>(`/api/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
