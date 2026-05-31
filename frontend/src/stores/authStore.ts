import { create } from 'zustand';
import type { User } from '../types';

interface CompanyInfo {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  branding?: string;
}

const COMPANY_CONTEXT_KEY = 'superAdminCompanyContext';

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

function getCompanyContextFromStorage(): CompanyInfo | null {
  try {
    const value = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_CONTEXT_KEY) : null;
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  company: CompanyInfo | null;
  activeCompanyContext: CompanyInfo | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setCompany: (company: CompanyInfo) => void;
  setActiveCompanyContext: (company: CompanyInfo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromToken(),
  company: null,
  activeCompanyContext: getCompanyContextFromStorage(),
  isAuthenticated: !!getUserFromToken(),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setCompany: (company) => set({ company }),
  setActiveCompanyContext: (company) => {
    if (typeof window !== 'undefined') {
      if (company) {
        localStorage.setItem(COMPANY_CONTEXT_KEY, JSON.stringify(company));
      } else {
        localStorage.removeItem(COMPANY_CONTEXT_KEY);
      }
    }
    set({ activeCompanyContext: company });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem(COMPANY_CONTEXT_KEY);
    }
    set({ user: null, company: null, activeCompanyContext: null, isAuthenticated: false });
  },
}));
