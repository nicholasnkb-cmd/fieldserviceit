'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Laptop, Save } from 'lucide-react';
import { api } from '../../../../lib/api';

const deviceCategories = ['DESKTOP', 'LAPTOP', 'MOBILE', 'TABLET', 'SERVER', 'IOT', 'CHROMEBOOK', 'RUGGED', 'WEARABLE', 'KIOSK', 'NETWORK_DEVICE', 'PRINTER', 'OTHER'];
const ownershipTypes = ['COMPANY', 'BYOD', 'COBO', 'COPE'];
const enrollmentStatuses = ['ENROLLED', 'PENDING', 'UNMANAGED', 'STALE', 'RETIRED'];
const managementModes = ['FULL', 'WORK_PROFILE', 'USER_ENROLLMENT', 'AGENT', 'RMM', 'NONE'];

export default function NewAssetPage() {
  const router = useRouter();
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    assetType: 'LAPTOP',
    deviceCategory: 'LAPTOP',
    ownership: 'COMPANY',
    assignedUser: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    os: '',
    osVersion: '',
    ipAddress: '',
    macAddress: '',
    enrollmentStatus: 'UNMANAGED',
    managementMode: 'NONE',
    complianceStatus: 'UNKNOWN',
    policyProfile: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/options').then((data: any) => {
      const list = Array.isArray(data) ? data : data?.data || [];
      setUsers(list);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/assets', form);
      router.push('/assets');
    } catch (err: any) {
      setError(err.message || 'Unable to enroll device');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-gray-50">
          <Laptop className="h-5 w-5 text-gray-700" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Enroll Device</h1>
          <p className="text-sm text-gray-500">Add any managed endpoint, mobile device, server, kiosk, IoT device, or network asset.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-white p-5">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Device name *</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Device category</span>
            <select value={form.deviceCategory} onChange={(e) => setForm({ ...form, deviceCategory: e.target.value, assetType: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              {deviceCategories.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Ownership</span>
            <select value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              {ownershipTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Assigned user</span>
            <select value={form.assignedUser} onChange={(e) => setForm({ ...form, assignedUser: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.email || u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Serial number</span>
            <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Manufacturer</span>
            <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Model</span>
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">OS</span>
            <input value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">OS version</span>
            <input value={form.osVersion} onChange={(e) => setForm({ ...form, osVersion: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">IP address</span>
            <input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">MAC address</span>
            <input value={form.macAddress} onChange={(e) => setForm({ ...form, macAddress: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Enrollment status</span>
            <select value={form.enrollmentStatus} onChange={(e) => setForm({ ...form, enrollmentStatus: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              {enrollmentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Management mode</span>
            <select value={form.managementMode} onChange={(e) => setForm({ ...form, managementMode: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              {managementModes.map((mode) => <option key={mode} value={mode}>{mode.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Policy profile</span>
            <input value={form.policyProfile} onChange={(e) => setForm({ ...form, policyProfile: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label className="md:col-span-3">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </label>
        </div>
        <button type="submit" disabled={submitting} className="mt-5 inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
          <Save className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Enrolling...' : 'Enroll device'}
        </button>
      </form>
    </div>
  );
}
