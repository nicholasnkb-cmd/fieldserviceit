import type { User } from '../types';
import { userCan } from './authStore';

const baseUser = { id: 'user-1', email: 'user@example.com', firstName: 'Test', lastName: 'User' } as User;

describe('userCan', () => {
  it('uses server-hydrated effective permissions when present', () => {
    const user = { ...baseUser, role: 'TECHNICIAN', permissions: ['assets.view'] } as User;
    expect(userCan(user, 'assets.view')).toBe(true);
    expect(userCan(user, 'assets.edit')).toBe(false);
  });

  it('supports super-admin wildcard access', () => {
    expect(userCan({ ...baseUser, role: 'SUPER_ADMIN', permissions: ['*'] } as User, 'anything.manage')).toBe(true);
  });

  it('temporarily falls back to legacy role permissions for older API responses', () => {
    expect(userCan({ ...baseUser, role: 'TENANT_ADMIN' } as User, 'assets.delete')).toBe(true);
  });
});
