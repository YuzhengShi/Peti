export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, string>
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (json.error) {
    throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
  }
  return json.data;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function apiFetchPaginated<T>(url: string, options?: RequestInit): Promise<PaginatedResponse<T>> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (json.error) {
    throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
  }
  return { data: json.data, pagination: json.pagination };
}
