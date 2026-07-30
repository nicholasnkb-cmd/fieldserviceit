'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

interface CompanyUser {
  id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean; createdAt: string;
}

interface CompanyInvitation {
  id: string; email: string; role: string; expiresAt: string; acceptedAt?: string; createdAt: string; invitedByEmail?: string;
}

export default function TenantAdminPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'CLIENT' });
  const [editing, setEditing] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' });
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canGovern = (companyUser: CompanyUser) =>
    isSuperAdmin || (companyUser.id !== user?.id && companyUser.role !== 'TENANT_ADMIN');

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchUsers = useCallback(() => {
    const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
    api.get(`/admin/company/users${params}`)
      .then((data) => setUsers(getListData<CompanyUser>(data)))
      .catch(() => {});
  }, [debouncedSearch]);

  const fetchInvitations = useCallback(() => {
    if (user?.role !== 'TENANT_ADMIN') return;
    api.get('/admin/company/invitations')
      .then((data) => setInvitations(getListData<CompanyInvitation>(data)))
      .catch(() => setInvitations([]));
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    fetchUsers();
    fetchInvitations();
    setLoading(false);
  }, [user, router, fetchUsers, fetchInvitations]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/admin/company/invitations', inviteForm);
      setMessage(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: '', role: 'CLIENT' });
      setShowInvite(false);
      fetchInvitations();
    } catch (err: any) { setMessage(err.message || 'Invitation could not be sent'); }
  };

  const revokeInvitation = async (id: string) => {
    try {
      await api.delete(`/admin/company/invitations/${id}`);
      setMessage('Invitation revoked');
      fetchInvitations();
    } catch (err: any) { setMessage(err.message || 'Invitation could not be revoked'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/company/users', createForm);
      setMessage('User created');
      setShowCreate(false);
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' });
      fetchUsers();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleRoleChange = async (userId: string) => {
    try {
      await api.patch(`/admin/company/users/${userId}/role`, { role: newRole });
      setMessage('Role updated');
      setEditing(null);
      fetchUsers();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/admin/company/users/${userId}`);
      setMessage('User deactivated');
      fetchUsers();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Company Management</h1>
        <div className="flex gap-2">
          <Link href="/admin/company/users" className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-md hover:bg-primary/20">All Users</Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link href="/admin/roles" className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-md hover:bg-primary/20">Roles</Link>
          )}
          <Link href="/settings" className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-md hover:bg-primary/20">Settings</Link>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-md hover:bg-primary/20">
            {showCreate ? 'Cancel' : 'Create User'}
          </button>
          {user?.role === 'TENANT_ADMIN' && (
            <button onClick={() => setShowInvite(!showInvite)} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90">
              {showInvite ? 'Cancel' : 'Invite User'}
            </button>
          )}
        </div>
      </div>

      {message && <div className={`p-3 rounded text-sm mb-4 ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 max-w-lg">
            <div><label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input type="text" required value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input type="text" required value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Password *</label>
              <input type="password" required minLength={15} maxLength={128} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="CLIENT">CLIENT</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                {isSuperAdmin && <option value="TENANT_ADMIN">TENANT_ADMIN</option>}
                <option value="READ_ONLY">READ_ONLY</option>
              </select></div>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90">Create</button>
            </div>
          </form>
        </div>
      )}

      {showInvite && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Invite a user</h2>
          <p className="mt-1 text-sm text-gray-600">They will receive a secure link to create their password and join this company.</p>
          <form onSubmit={handleInvite} className="mt-4 flex max-w-2xl items-end gap-3">
            <label className="flex-1 text-sm font-medium text-gray-700">Email
              <input type="email" required maxLength={191} value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700">Role
              <select value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })} className="mt-1 block rounded border border-gray-300 px-3 py-2">
                <option value="CLIENT">Client</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="READ_ONLY">Read only</option>
              </select>
            </label>
            <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">Send invitation</button>
          </form>
        </div>
      )}

      {user?.role === 'TENANT_ADMIN' && invitations.length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Invitations</h2>
          <div className="mt-3 divide-y divide-gray-100">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between py-3 text-sm">
                <div><strong>{invitation.email}</strong><span className="ml-2 text-gray-500">{invitation.role} · {invitation.acceptedAt ? 'Accepted' : `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}</span></div>
                {!invitation.acceptedAt && <button onClick={() => revokeInvitation(invitation.id)} className="text-red-600 hover:underline">Revoke</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
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
                  {editing === u.id ? (
                    <div className="flex gap-1">
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="text-xs rounded border px-1 py-0.5">
                        <option value="CLIENT">CLIENT</option>
                        <option value="TECHNICIAN">TECHNICIAN</option>
                        {isSuperAdmin && <option value="TENANT_ADMIN">TENANT_ADMIN</option>}
                        <option value="READ_ONLY">READ_ONLY</option>
                      </select>
                      <button onClick={() => handleRoleChange(u.id)} className="text-xs text-primary">Save</button>
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-500">X</button>
                    </div>
                  ) : (
                    <span className="text-sm">{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.isActive ? 'Yes' : 'No'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {canGovern(u) ? (
                      <button onClick={() => { setEditing(u.id); setNewRole(u.role); }} className="text-xs text-primary hover:underline">Role</button>
                    ) : (
                      <span className="text-xs text-gray-400">Protected</span>
                    )}
                    {canGovern(u) && <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
