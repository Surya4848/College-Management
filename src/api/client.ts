const API_BASE = '/api/v1';

export type UserRole = 'platform_monitor' | 'principal' | 'hod' | 'staff' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  institution_id: string;
  department_name?: string;
  department_id?: string;
  college_id?: string;
  is_verified: boolean;
  is_active: boolean;
  is_approved_by_hod: boolean;
  profile_locked: boolean;
  photo_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  user: User;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('portal_access_token');
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('portal_refresh_token');
}

export function setStoredAuth(auth: AuthResponse): void {
  localStorage.setItem('portal_access_token', auth.access_token);
  localStorage.setItem('portal_refresh_token', auth.refresh_token);
  localStorage.setItem('portal_user', JSON.stringify(auth.user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem('portal_access_token');
  localStorage.removeItem('portal_refresh_token');
  localStorage.removeItem('portal_user');
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('portal_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && getStoredRefreshToken()) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: getStoredRefreshToken() }),
      });

      if (refreshRes.ok) {
        const newAuth: AuthResponse = await refreshRes.json();
        setStoredAuth(newAuth);
        headers['Authorization'] = `Bearer ${newAuth.access_token}`;
        response = await fetch(url, { ...options, headers });
      } else {
        clearStoredAuth();
      }
    } catch {
      clearStoredAuth();
    }
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

