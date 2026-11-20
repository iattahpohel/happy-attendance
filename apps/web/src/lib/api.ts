const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'ha_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined && { 'content-type': 'application/json' }),
      ...(token && { authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    setToken(null);
    if (typeof window !== 'undefined' && !location.pathname.startsWith('/login')) location.href = '/login';
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new ApiError(res.status, msg || 'Đã có lỗi xảy ra, thử lại sau nhé');
  }
  return data as T;
}
