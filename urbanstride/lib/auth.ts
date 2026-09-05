// Shared authentication utilities for UrbanStride

export const ROOT_ADMINS = ['shreyash3087@gmail.com', 'owner@catalogx.ai'];

export const STORAGE_KEY = 'urbanstride_admin_user';

export type AuthUser = {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
};

export function parseGoogleJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const u = JSON.parse(stored) as AuthUser;
    return u.isLoggedIn ? u : null;
  } catch {
    return null;
  }
}

export function storeUser(u: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Also cancel Google's auto-select
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try { window.google.accounts.id.disableAutoSelect(); } catch { /* noop */ }
  }
}

export function isAdmin(email: string): boolean {
  return ROOT_ADMINS.includes(email.toLowerCase());
}
