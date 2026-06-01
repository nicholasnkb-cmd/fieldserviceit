'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  isActive: boolean;
  inviteCode?: string;
  _count: { users: number; tickets: number; assets: number };
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', slug: '', domain: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState({ name: '', slug: '', domain: '', isActive: true });
  const [message, setMessage] = useState('');
  const { user, authChecked, setActiveCompanyContext } = useAuthStore();
  const router = useRouter();

  const openCompanyArea = (company: Company, path: string) => {
    setActiveCompanyContext({ id: company.id, name: company.name, slug: company.slug });
    router.push(path);
  };

  const fetchCompanies = useCallback(() => {
    setMessage('');
    api.get('/admin/companies')
      .then((data) => setCompanies(data.data || []))
      .catch((err: any) => setMessage(err.message || 'Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchCompanies();
  }, [authChecked, user, router, fetchCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/companies', newCompany);
      setMessage('Company created successfully');
      setShowCreate(false);
      setNewCompany({ name: '', slug: '', domain: '' });
      fetchCompanies();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleInviteCode = async (companyId: string) => {
    try {
      const data = await api.post(`/admin/companies/${companyId}/invite-code`, {});
      setMessage(`Invite code generated: ${data.inviteCode}`);
      fetchCompanies();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setEditCompany({
      name: company.name,
      slug: company.slug,
      domain: company.domain || '',
      isActive: company.isActive,
    });
  };

  const handleUpdate = async (companyId: string) => {
    try {
      await api.patch(`/admin/companies/${companyId}`, editCompany);
      setMessage('Company updated successfully');
      setEditingId(null);
      fetchCompanies();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleDeactivate = async (companyId: string) => {
    if (!confirm('Deactivate this company and its users?')) return;
    try {
      await api.delete(`/admin/companies/${companyId}`);
      setMessage('Company deactivated');
      fetchCompanies();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Company Management</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
        >
          {showCreate ? 'Cancel' : 'Create Company'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm mb-4 ${message.includes('Failed') || message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Company</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                required
                value={newCompany.slug}
                onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain (optional)</label>
              <input
                type="text"
                value={newCompany.domain}
                onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                placeholder="company.com"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Domain</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Assets</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invite Code</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {editingId === c.id ? (
                    <input value={editCompany.name} onChange={(e) => setEditCompany({ ...editCompany, name: e.target.value })}
                      className="w-40 rounded border border-gray-300 px-2 py-1 text-sm" />
                  ) : c.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingId === c.id ? (
                    <input value={editCompany.slug} onChange={(e) => setEditCompany({ ...editCompany, slug: e.target.value })}
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-sm" />
                  ) : c.slug}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingId === c.id ? (
                    <input value={editCompany.domain} onChange={(e) => setEditCompany({ ...editCompany, domain: e.target.value })}
                      className="w-40 rounded border border-gray-300 px-2 py-1 text-sm" />
                  ) : c.domain || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingId === c.id ? (
                    <select value={String(editCompany.isActive)} onChange={(e) => setEditCompany({ ...editCompany, isActive: e.target.value === 'true' })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span className={`rounded px-2 py-1 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <button onClick={() => router.push(`/admin/users?companyId=${encodeURIComponent(c.id)}`)} className="text-primary hover:underline">
                    {c._count.users}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <button onClick={() => openCompanyArea(c, '/tickets')} className="text-primary hover:underline">
                    {c._count.tickets}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <button onClick={() => openCompanyArea(c, '/assets')} className="text-primary hover:underline">
                    {c._count.assets}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{c.inviteCode || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {editingId === c.id ? (
                      <>
                        <button onClick={() => handleUpdate(c.id)} className="text-xs text-primary hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(c)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => handleInviteCode(c.id)} className="text-xs text-primary hover:underline">Invite</button>
                        <button onClick={() => handleDeactivate(c.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                      </>
                    )}
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
