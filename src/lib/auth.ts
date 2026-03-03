import { API_ENDPOINTS } from "./api";

export interface User {
  id: string;
  username: string;
  userType: 'admin';
  access_token: string;
}

export async function validateCredentials(username: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(API_ENDPOINTS.signIn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return {
        id: result.data.user.id,
        username: result.data.user.username,
        userType: result.data.user.userType,
        access_token: result.data.access_token,
      };
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function saveSession(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
}

export function getSession(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user');
  }
}
