const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const AUTH_TOKEN_KEY = 'ffl.auth.token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const url = path.startsWith('http') ? path : `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;
  try { response = await fetch(url, { ...options, headers }); }
  catch { throw new ApiError('Cannot reach the FFL server. Check the backend URL and that the API is running.', 0); }
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.message || `Request failed (${response.status}).`, response.status);
  return payload as T;
}

export const jsonBody = (value: unknown) => JSON.stringify(value);
