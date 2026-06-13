import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminPermissionsPage from '../app/(app)/admin/permissions/page';

const push = jest.fn();
const toast = jest.fn();
const get = jest.fn();
const patch = jest.fn();
const post = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: () => ({ user: { role: 'SUPER_ADMIN' } }),
}));

jest.mock('../components/ui/Toast', () => ({
  useToast: () => ({ toast }),
}));

jest.mock('../lib/api', () => ({
  api: {
    get: (...args: any[]) => get(...args),
    patch: (...args: any[]) => patch(...args),
    post: (...args: any[]) => post(...args),
  },
  getListData: (value: any) => Array.isArray(value) ? value : value?.data || [],
}));

const permissions = [
  { id: 'p1', name: 'View tickets', slug: 'tickets.view', group: 'Tickets', description: 'Read all ticket records.' },
  { id: 'p2', name: 'Manage users', slug: 'users.manage', group: 'Administration', description: 'Change user access.' },
];

const roles = [
  {
    id: 'r1',
    name: 'Technician',
    slug: 'technician',
    isSystem: true,
    permissions: [{ permission: permissions[0] }],
    _count: { userRoles: 3 },
  },
];

describe('AdminPermissionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    get.mockImplementation((path: string) => Promise.resolve(path === '/admin/permissions/workspace'
      ? { scope: 'PLATFORM', permissions, roles, presets: [], history: [] }
      : roles));
    patch.mockResolvedValue(roles[0]);
    post.mockResolvedValue({
      requiresAcknowledgement: false,
      risks: [],
      criticalRemoved: [],
      affectedUsers: [],
    });
  });

  it('filters permissions and saves a changed role', async () => {
    render(<AdminPermissionsPage />);

    expect(await screen.findByRole('heading', { name: 'System permissions' })).toBeInTheDocument();
    expect(screen.getByText('View tickets')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search by permission, slug, description, or group'), {
      target: { value: 'users' },
    });

    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.queryByText('View tickets')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'Manage users for Technician' }));
    const save = screen.getByRole('button', { name: 'Save (1)' });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(() => expect(patch).toHaveBeenCalledWith('/admin/roles/r1', {
      acknowledgeCriticalRemoval: false,
      permissionSlugs: ['tickets.view', 'users.manage'],
    }));
    expect(toast).toHaveBeenCalledWith('success', '1 role updated');
  });
});
