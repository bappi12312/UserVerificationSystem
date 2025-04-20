import { RegisterUser, LoginCredentials } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export async function registerUser(userData: RegisterUser): Promise<{ message: string }> {
  const res = await apiRequest('POST', '/api/auth/register', userData);
  return await res.json();
}

export async function loginUser(credentials: LoginCredentials): Promise<{ message: string; user: UserProfile }> {
  const res = await apiRequest('POST', '/api/auth/login', credentials);
  return await res.json();
}

export async function logoutUser(): Promise<{ message: string }> {
  const res = await apiRequest('POST', '/api/auth/logout');
  return await res.json();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await fetch(`/api/auth/verify-email?token=${token}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to verify email');
  }
  
  return await res.json();
}
