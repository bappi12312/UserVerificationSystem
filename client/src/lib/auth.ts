import { RegisterUser, LoginCredentials } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export async function registerUser(userData: RegisterUser): Promise<{ message: string }> {
  try {
    const res = await apiRequest('POST', '/api/auth/register', userData);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Registration failed. Please try again.');
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<{ message: string; user: UserProfile }> {
  try {
    const res = await apiRequest('POST', '/api/auth/login', credentials);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Login failed. Please try again.');
  }
}

export async function logoutUser(): Promise<{ message: string }> {
  try {
    const res = await apiRequest('POST', '/api/auth/logout');
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Logout failed');
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Logout failed. Please try again.');
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
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
  try {
    const res = await fetch(`/api/auth/verify-email?token=${token}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to verify email');
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Email verification failed. Please try again.');
  }
}
