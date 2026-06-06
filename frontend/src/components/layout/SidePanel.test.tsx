import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { SidePanel } from './SidePanel';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
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
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: businessUser,
      authChecked: true,
      isAuthenticated: true,
    });
    (api.get as jest.Mock).mockResolvedValue({ features: {} });
  });

  it('groups navigation and persists collapsed sections', async () => {
    render(<SidePanel />);

    const serviceDeskButton = screen.getByRole('button', { name: 'Service Desk' });
    expect(serviceDeskButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();

    fireEvent.click(serviceDeskButton);

    expect(serviceDeskButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('side-panel-service-desk')).toHaveClass('hidden');
    expect(JSON.parse(localStorage.getItem('fsit.sidePanelGroups') || '{}')).toEqual({
      'service-desk': true,
    });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users/me/features'));
  });

  it('collapses to an icon rail and keeps accessible group-aware link names', () => {
    render(<SidePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse side menu' }));

    expect(screen.getByRole('button', { name: 'Expand side menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview: Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Service Desk: Tickets' })).toBeInTheDocument();
    expect(localStorage.getItem('fsit.sidePanelCollapsed')).toBe('true');
  });

  it('marks the group containing the active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/network');
    localStorage.setItem('fsit.sidePanelGroups', JSON.stringify({ infrastructure: true }));

    render(<SidePanel />);

    const infrastructureButton = screen.getByRole('button', { name: 'Infrastructure' });
    expect(infrastructureButton).toHaveClass('text-primary');
    expect(infrastructureButton).toHaveAttribute('aria-expanded', 'false');
  });
});
