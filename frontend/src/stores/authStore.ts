import { create } from 'zustand';
import type { User } from '../types';

interface CompanyInfo {
  id: string;
  name: string;
  logo?: string;
  branding?: string;
}

function getUserFromToken(): User | null {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      role: payload.role,
      userType: payload.userType || 'BUSINESS',
      companyId: payload.companyId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  company: CompanyInfo | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setCompany: (company: CompanyInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromToken(),
  company: null,
  isAuthenticated: !!getUserFromToken(),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setCompany: (company) => set({ company }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null, company: null, isAuthenticated: false });
  },
}));
