'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  isActive: boolean;
  company?: { id: string; name: string };
  lastLoginAt?: string;
  createdAt: string;
}

interface Company { id: string; name: string }

const GLOBAL_USER_ROLES = ['SUPER_ADMIN', 'GLOBAL_TECH'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [newCompanyId, setNewCompanyId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT', companyId: '' });
  const [message, setMessage] = useState('');
  const { user, authChecked } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    const userType = searchParams.get('userType');
    const companyId = searchParams.get('companyId');
    if (userType) params.set('userType', userType);
    if (companyId) params.set('companyId', companyId);
    const query = params.toString() ? `?${params.toString()}` : '';
    setMessage('');
    api.get(`/admin/users${query}`)
      .then((data) => {
        setUsers(getListData<AdminUser>(data));
        setMessage('');
      })
      .catch((err: any) => {
        setUsers([]);
        setMessage(err.message || 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, searchParams]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) { router.push('/login'); return; }
    if (user && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    const params = new URLSearchParams();
    const userType = searchParams.get('userType');
    const companyId = searchParams.get('companyId');
    if (userType) params.set('userType', userType);
    if (companyId) params.set('companyId', companyId);
    const query = params.toString() ? `?${params.toString()}` : '';
    setMessage('');
    Promise.allSettled([api.get(`/admin/users${query}`), api.get('/admin/companies')]).then(([usersResult, companiesResult]) => {
      if (usersResult.status === 'fulfilled') {
        setUsers(getListData<AdminUser>(usersResult.value));
      } else {
        setUsers([]);
        setMessage(usersResult.reason?.message || 'Failed to load users');
      }

      if (companiesResult.status === 'fulfilled') {
        setCompanies(getListData<Company>(companiesResult.value));
      } else {
        setCompanies([]);
      }
    }).finally(() => setLoading(false));
  }, [authChecked, router, searchParams, user]);

  useEffect(() => {
    if (!authChecked || !user || user.role !== 'SUPER_ADMIN') return;
    fetchUsers();
  }, [authChecked, debouncedSearch, fetchUsers, user]);

  const handleRoleChange = async (userId: string) => {
    try { await api.patch(`/admin/users/${userId}/role`, { role: newRole }); setMessage('Role updated'); setEditing(null); fetchUsers(); }
    catch (err: any) { setMessage(err.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/admin/users', createForm); setMessage('User created'); setShowCreate(false); setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT', companyId: '' }); fetchUsers(); }
    catch (err: any) { setMessage(err.message); }
  };

  const handleUserUpdate = async (userId: string, update: { userType?: string; isActive?: boolean }, successMessage: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, update);
      setMessage(successMessage);
      fetchUsers();
    } catch (err: any) {
      setMessage(err.message || 'User update failed');
    }
  };

  const handleCompanyChange = async (managedUser: AdminUser) => {
    try {
      await api.patch(`/admin/users/${managedUser.id}/company`, {
        companyId: newCompanyId || null,
        reason: 'Updated in User Management',
      });
      setMessage('Company assignment updated. The user must sign in again.');
      setEditingCompany(null);
      fetchUsers();
    } catch (err: any) {
      setMessage(err.message || 'Company assignment failed');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? They will be deactivated.')) return;
    try { await api.delete(`/admin/users/${userId}`); setMessage('User deleted'); fetchUsers(); }
    catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          {(searchParams.get('userType') || searchParams.get('companyId')) && (
            <p className="mt-1 text-sm text-gray-500">
              Filtered by {searchParams.get('userType') || 'company'}.
              <button onClick={() => router.push('/admin/users')} className="ml-2 text-primary hover:underline">Clear filter</button>
            </p>
          )}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90">
          {showCreate ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {message && <div className={`p-3 rounded text-sm mb-4 ${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 max-w-lg">
            <div><label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input type="text" required maxLength={80} value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input type="text" required maxLength={80} value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required maxLength={191} value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Password *</label>
              <input type="password" required minLength={8} maxLength={128} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="CLIENT">CLIENT</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                <option value="GLOBAL_TECH">GLOBAL_TECH</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                <option value="READ_ONLY">READ_ONLY</option>
              </select></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Company {GLOBAL_USER_ROLES.includes(createForm.role) ? '' : '*'}</label>
              <select required={!GLOBAL_USER_ROLES.includes(createForm.role)} value={createForm.companyId} onChange={(e) => setCreateForm({ ...createForm, companyId: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="">{GLOBAL_USER_ROLES.includes(createForm.role) ? 'No tenant/global user' : 'Select company...'}</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input type="text" maxLength={191} placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.userType}
                    onChange={(event) => handleUserUpdate(u.id, { userType: event.target.value }, 'User type updated. The user must sign in again.')}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    aria-label={`Type for ${u.firstName} ${u.lastName}`}
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="BUSINESS">BUSINESS</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <div className="flex gap-1">
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="text-xs rounded border px-1 py-0.5">
                        <option value="CLIENT">CLIENT</option>
                        <option value="TECHNICIAN">TECHNICIAN</option>
                        <option value="GLOBAL_TECH">GLOBAL_TECH</option>
                        <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="READ_ONLY">READ_ONLY</option>
                      </select>
                      <button onClick={() => handleRoleChange(u.id)} className="text-xs text-primary">Save</button>
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-500">X</button>
                    </div>
                  ) : (
                    <span className="text-sm">{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {editingCompany === u.id ? (
                    <div className="flex min-w-56 items-center gap-1">
                      <select
                        value={newCompanyId}
                        disabled={GLOBAL_USER_ROLES.includes(u.role)}
                        onChange={(event) => setNewCompanyId(event.target.value)}
                        className="min-w-40 rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">{GLOBAL_USER_ROLES.includes(u.role) ? 'Global company context' : 'No company'}</option>
                        {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                      </select>
                      <button onClick={() => handleCompanyChange(u)} disabled={GLOBAL_USER_ROLES.includes(u.role)} className="text-xs text-primary disabled:text-gray-400">Save</button>
                      <button onClick={() => setEditingCompany(null)} className="text-xs text-gray-500">X</button>
                    </div>
                  ) : (
                    u.company?.name || (GLOBAL_USER_ROLES.includes(u.role) ? 'Global' : '-')
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleUserUpdate(u.id, { isActive: !u.isActive }, u.isActive ? 'User deactivated.' : 'User activated.')}
                    className={`rounded px-2 py-1 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    aria-pressed={u.isActive}
                  >
                    {u.isActive ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(u.id); setNewRole(u.role); }} className="text-xs text-primary hover:underline">Role</button>
                    <button
                      onClick={() => { setEditingCompany(u.id); setNewCompanyId(u.company?.id || ''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Company
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  {message ? 'Users could not be loaded.' : 'No users found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
