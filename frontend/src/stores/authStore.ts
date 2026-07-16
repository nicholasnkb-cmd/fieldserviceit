import { create } from 'zustand';
import type { User } from '../types';
import { clearSessionTokens } from '../lib/api';

interface CompanyInfo {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

const COMPANY_CONTEXT_KEY = 'superAdminCompanyContext';
const COMPANY_BRANDING_KEY = 'tenantBranding';

function getUserFromToken(): User | null {
  return null;
}

function getCompanyContextFromStorage(): CompanyInfo | null {
  try {
    const value = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_CONTEXT_KEY) : null;
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function getCompanyBrandingFromStorage(): CompanyInfo | null {
  try {
    const value = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_BRANDING_KEY) : null;
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
  authChecked: boolean;
  setUser: (user: User) => void;
  setCompany: (company: CompanyInfo) => void;
  setActiveCompanyContext: (company: CompanyInfo | null) => void;
  setAuthChecked: (checked: boolean) => void;
  logout: () => void;
}

const LEGACY_ROLE_PERMISSIONS: Partial<Record<User['role'], string[]>> = {
  TENANT_ADMIN: ['assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'network.actions.run', 'network.config.manage', 'network.credentials.manage', 'operations.manage'],
  TECHNICIAN: ['assets.view', 'assets.create', 'assets.edit', 'network.actions.run', 'network.config.manage'],
  CLIENT: ['assets.view'],
  READ_ONLY: ['assets.view'],
};

/** Uses server-hydrated permissions, with a temporary role fallback for older API deployments. */
export function userCan(user: User | null | undefined, permission: string) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.permissions?.includes('*')) return true;
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  return (LEGACY_ROLE_PERMISSIONS[user.role] || []).includes(permission);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromToken(),
  company: getCompanyBrandingFromStorage(),
  activeCompanyContext: getCompanyContextFromStorage(),
  isAuthenticated: !!getUserFromToken(),
  authChecked: false,
  setUser: (user) => set({ user, isAuthenticated: true, authChecked: true }),
  setCompany: (company) => {
    if (typeof window !== 'undefined') localStorage.setItem(COMPANY_BRANDING_KEY, JSON.stringify(company));
    set({ company });
  },
  setAuthChecked: (checked) => set({ authChecked: checked }),
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${apiUrl}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch((error) => console.warn('Logout request failed; local session was still cleared.', error));
      clearSessionTokens();
      localStorage.removeItem(COMPANY_CONTEXT_KEY);
      localStorage.removeItem(COMPANY_BRANDING_KEY);
    }
    set({ user: null, company: null, activeCompanyContext: null, isAuthenticated: false, authChecked: true });
  },
}));
