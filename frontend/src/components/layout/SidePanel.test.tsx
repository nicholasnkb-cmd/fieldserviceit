import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { NAV_DRAWER_EVENT, navigationStorageKey } from '../../lib/navigation';
import { SidePanel } from './SidePanel';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
  getResponseMeta: (response: any) => response?.meta,
}));

const businessUser = {
  id: 'user-1',
  email: 'tech@example.com',
  firstName: 'Test',
  lastName: 'Technician',
  role: 'TECHNICIAN',
  userType: 'BUSINESS',
  companyId: 'company-1',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SidePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: businessUser,
      authChecked: true,
      isAuthenticated: true,
      activeCompanyContext: null,
      company: { id: 'company-1', name: 'Example Company' },
      logout: jest.fn(),
    });
    (api.get as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/users/me/features') return Promise.resolve({ features: {} });
      if (endpoint === '/users/me/favorites') return Promise.resolve([]);
      if (endpoint.startsWith('/tickets')) return Promise.resolve({ data: [], meta: { total: 4 } });
      if (endpoint === '/assets/network/monitoring/summary') return Promise.resolve({ activeAlerts: 2 });
      return Promise.resolve({});
    });
  });

  it('groups navigation and persists collapsed sections', async () => {
    render(<SidePanel />);

    const serviceButton = screen.getByRole('button', { name: 'Service' });
    expect(serviceButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(serviceButton);

    expect(serviceButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();
    expect(document.getElementById('side-panel-service')).not.toHaveClass('hidden');
    expect(JSON.parse(localStorage.getItem(navigationStorageKey('user-1', 'collapsedGroups')) || '{}')).toEqual({
      service: false,
    });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users/me/features'));
  });

  it('collapses to an icon rail and keeps accessible group-aware link names', () => {
    render(<SidePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse side menu' }));

    expect(screen.getByRole('button', { name: 'Expand side menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview: Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Service: Tickets' })).toBeInTheDocument();
    expect(localStorage.getItem(navigationStorageKey('user-1', 'collapsed'))).toBe('true');
  });

  it('marks the group containing the active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/network');
    localStorage.setItem(
      navigationStorageKey('user-1', 'collapsedGroups'),
      JSON.stringify({ technology: true }),
    );

    render(<SidePanel />);

    const technologyButton = screen.getByRole('button', { name: 'Technology' });
    expect(technologyButton).toHaveClass('text-primary');
    expect(technologyButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens as a mobile drawer from the shared header event', async () => {
    render(<SidePanel />);

    await act(async () => {
      window.dispatchEvent(new Event(NAV_DRAWER_EVENT));
    });

    expect(screen.getAllByRole('button', { name: 'Close navigation menu' })).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Application navigation' }).parentElement)
      .toHaveClass('translate-x-0');
  });

  it('filters links with navigation search', () => {
    render(<SidePanel />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search navigation' }), {
      target: { value: 'topology' },
    });

    expect(screen.getByRole('link', { name: 'Topology Map' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tickets' })).not.toBeInTheDocument();
  });

  it('loads favorites, badge counts, and account controls without adding recent-page clutter', async () => {
    (api.get as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/users/me/features') return Promise.resolve({ features: {} });
      if (endpoint === '/users/me/favorites') {
        return Promise.resolve([{ id: 'fav-1', label: 'Network tools', path: '/network' }]);
      }
      if (endpoint.startsWith('/tickets')) return Promise.resolve({ data: [], meta: { total: 4 } });
      if (endpoint === '/assets/network/monitoring/summary') return Promise.resolve({ activeAlerts: 2 });
      return Promise.resolve({});
    });

    render(<SidePanel />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Favorites' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Network tools' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recent' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('keeps a stable task-based group order', () => {
    render(<SidePanel />);

    const groupButtons = screen.getAllByRole('button', { expanded: true });
    expect(groupButtons[0]).toHaveAccessibleName('Overview');
    expect(screen.queryByLabelText(/Move .* group/)).not.toBeInTheDocument();
  });

  it('auto-collapses on smaller laptop widths until the user chooses a preference', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query) => ({
      matches: query.includes('max-width: 1279px'),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(<SidePanel />);

    expect(screen.getByRole('button', { name: 'Expand side menu' })).toBeInTheDocument();
    expect(localStorage.getItem(navigationStorageKey('user-1', 'collapsed'))).toBeNull();
  });

  it('shows the selected tenant context to super admins', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { ...businessUser, role: 'SUPER_ADMIN' },
      authChecked: true,
      isAuthenticated: true,
      activeCompanyContext: { id: 'company-2', name: 'Northwind Services' },
      company: { id: 'company-1', name: 'Platform Company' },
      logout: jest.fn(),
    });

    render(<SidePanel />);

    expect(screen.getByText('Managing tenant')).toBeInTheDocument();
    expect(screen.getByText('Northwind Services')).toBeInTheDocument();
  });
});
