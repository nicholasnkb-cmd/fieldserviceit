'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Eraser,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Wifi,
} from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';
import { useAuthStore } from '../../../stores/authStore';
import { SavedViews } from '../../../components/ui/SavedViews';

interface Device {
  id: string;
  name: string;
  assetType: string;
  deviceCategory?: string;
  ownership?: string;
  assignedUser?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  os?: string;
  osVersion?: string;
  status: string;
  enrollmentStatus?: string;
  managementMode?: string;
  mdmProvider?: string;
  lastCheckInAt?: string;
  complianceStatus?: string;
  complianceReasons?: string;
  encryptionStatus?: string;
  firewallEnabled?: boolean;
  antivirusStatus?: string;
  passcodeCompliant?: boolean;
  jailbreakDetected?: boolean;
  lostModeEnabled?: boolean;
  batteryLevel?: number;
  imei?: string;
  phoneNumber?: string;
  carrier?: string;
  appInventory?: string;
  policyProfile?: string;
  notes?: string;
  createdAt: string;
  deletedAt?: string;
  tickets?: { id: string; ticketNumber: string; title: string; status: string }[];
}

interface MdmSummary {
  total: number;
  enrolled: number;
  unmanaged: number;
  nonCompliant: number;
  stale: number;
  complianceRate: number;
  byCategory: { mobile: number; desktop: number; server: number; other: number };
}

interface MdmCommand {
  id: string;
  action: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

const deviceCategories = ['DESKTOP', 'LAPTOP', 'MOBILE', 'TABLET', 'SERVER', 'IOT', 'CHROMEBOOK', 'RUGGED', 'WEARABLE', 'KIOSK', 'NETWORK_DEVICE', 'PRINTER', 'OTHER'];
const enrollmentStatuses = ['ENROLLED', 'PENDING', 'UNMANAGED', 'STALE', 'RETIRED'];
const complianceStatuses = ['COMPLIANT', 'NON_COMPLIANT', 'UNKNOWN'];
const ownershipTypes = ['COMPANY', 'BYOD', 'COBO', 'COPE'];
const managementModes = ['FULL', 'WORK_PROFILE', 'USER_ENROLLMENT', 'AGENT', 'RMM', 'NONE'];

const emptyForm = {
  name: '',
  assetType: 'LAPTOP',
  deviceCategory: 'LAPTOP',
  ownership: 'COMPANY',
  assignedUser: '',
  serialNumber: '',
  manufacturer: '',
  model: '',
  location: '',
  ipAddress: '',
  macAddress: '',
  os: '',
  osVersion: '',
  enrollmentStatus: 'UNMANAGED',
  managementMode: 'NONE',
  mdmProvider: '',
  complianceStatus: 'UNKNOWN',
  encryptionStatus: 'UNKNOWN',
  antivirusStatus: '',
  batteryLevel: '',
  imei: '',
  phoneNumber: '',
  carrier: '',
  policyProfile: '',
  notes: '',
};

function statusClass(value?: string) {
  if (value === 'COMPLIANT' || value === 'ENROLLED' || value === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (value === 'NON_COMPLIANT' || value === 'STALE') return 'bg-red-50 text-red-700 border-red-200';
  if (value === 'PENDING' || value === 'UNKNOWN') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function DeviceIcon({ category }: { category?: string }) {
  if (category === 'MOBILE') return <Smartphone className="h-4 w-4" aria-hidden="true" />;
  if (category === 'TABLET') return <Tablet className="h-4 w-4" aria-hidden="true" />;
  return <Laptop className="h-4 w-4" aria-hidden="true" />;
}

export default function AssetsPage() {
  const { user, activeCompanyContext } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [summary, setSummary] = useState<MdmSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ deviceCategory: '', enrollmentStatus: '', complianceStatus: '', ownership: '' });
  const [selected, setSelected] = useState<Device | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [enrollmentToken, setEnrollmentToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [commands, setCommands] = useState<MdmCommand[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [retired, setRetired] = useState<Device[]>([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchDevices = useCallback(() => {
    if (user?.role === 'SUPER_ADMIN' && !activeCompanyContext) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    Promise.all([
      api.get(`/assets?${params}`),
      api.get('/assets/mdm/summary').catch(() => null),
    ])
      .then(([assetData, summaryData]) => {
        setDevices(getListData<Device>(assetData));
        if (summaryData) setSummary(summaryData);
      })
      .catch((err) => setMessage(err.message || 'Failed to load devices'))
      .finally(() => setLoading(false));
  }, [activeCompanyContext, debouncedSearch, filters, user?.role]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      const aCheckIn = a.lastCheckInAt ? new Date(a.lastCheckInAt).getTime() : 0;
      const bCheckIn = b.lastCheckInAt ? new Date(b.lastCheckInAt).getTime() : 0;
      return bCheckIn - aCheckIn || a.name.localeCompare(b.name);
    });
  }, [devices]);

  const viewDevice = async (id: string) => {
    const [data, commandData] = await Promise.all([
      api.get(`/assets/${id}`),
      api.get<MdmCommand[]>(`/assets/${id}/commands`).catch(() => []),
    ]);
    setSelected(data);
    setCommands(commandData);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        batteryLevel: form.batteryLevel === '' ? undefined : Number(form.batteryLevel),
      };
      await api.post('/assets', payload);
      setMessage('Device added to MDM inventory');
      setShowForm(false);
      setForm(emptyForm);
      fetchDevices();
    } catch (err: any) {
      setMessage(err.message || 'Failed to create device');
    }
  };

  const runAction = async (action: string, body: Record<string, any> = {}) => {
    if (!selected) return;
    setActionLoading(action);
    try {
      const updated = await api.post(`/assets/${selected.id}/actions/${action}`, body);
      setSelected(updated);
      await viewDevice(selected.id);
      setMessage(`${action.replaceAll('_', ' ')} queued for ${selected.name}`);
      fetchDevices();
    } catch (err: any) {
      setMessage(err.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const checkIn = async () => {
    if (!selected) return;
    setActionLoading('CHECK_IN');
    try {
      const updated = await api.post(`/assets/${selected.id}/check-in`, {
        enrollmentStatus: 'ENROLLED',
        complianceStatus: selected.complianceStatus || 'COMPLIANT',
      });
      setSelected(updated);
      setMessage(`${selected.name} checked in`);
      fetchDevices();
    } catch (err: any) {
      setMessage(err.message || 'Check-in failed');
    } finally {
      setActionLoading('');
    }
  };

  const createEnrollmentToken = async () => {
    setTokenLoading(true);
    try {
      const token = await api.post('/assets/mdm/enrollment-tokens', {
        ttlHours: 24,
        deviceCategory: 'LAPTOP',
        ownership: 'COMPANY',
        policyProfile: 'Baseline',
      });
      setEnrollmentToken(token.token);
      setMessage('Enrollment token created');
    } catch (err: any) {
      setMessage(err.message || 'Failed to create enrollment token');
    } finally {
      setTokenLoading(false);
    }
  };

  const copyEnrollmentToken = async () => {
    if (!enrollmentToken) return;
    await navigator.clipboard.writeText(enrollmentToken);
    setMessage('Enrollment token copied');
  };

  const loadRecycleBin = async () => {
    const data = await api.get('/assets/retired');
    setRetired(getListData<Device>(data));
  };

  const retireSelected = async () => {
    if (!selectedIds.size || !confirm(`Move ${selectedIds.size} device(s) to the recycle bin?`)) return;
    await api.post('/assets/bulk/retire', { ids: [...selectedIds] });
    setSelectedIds(new Set()); setSelected(null); setMessage('Devices moved to the recycle bin'); fetchDevices(); loadRecycleBin();
  };

  const restoreRetired = async (id: string) => {
    await api.post(`/assets/retired/${id}/restore`, {}); setMessage('Device restored'); loadRecycleBin(); fetchDevices();
  };

  const purgeRetired = async (id: string) => {
    if (!confirm('Permanently delete this device? This is only available after the 30-day recovery period.')) return;
    try { await api.delete(`/assets/retired/${id}`); setMessage('Device permanently deleted'); loadRecycleBin(); }
    catch (error: any) { setMessage(error.message || 'Device is still within its recovery period'); }
  };

  const statItems = [
    { label: 'Devices', value: summary?.total ?? devices.length, icon: Laptop },
    { label: 'Enrolled', value: summary?.enrolled ?? 0, icon: CheckCircle2 },
    { label: 'Non-compliant', value: summary?.nonCompliant ?? 0, icon: AlertTriangle },
    { label: 'Compliance', value: `${summary?.complianceRate ?? 0}%`, icon: ShieldCheck },
  ];

  return (
    <RequireCompanyContext area="Assets">
    <div className="p-6">
      <div className="mb-4"><SavedViews resource="assets" filters={{ search, ...filters }} onApply={(view) => { setSearch(view.search || ''); setFilters({ deviceCategory: view.deviceCategory || '', enrollmentStatus: view.enrollmentStatus || '', complianceStatus: view.complianceStatus || '', ownership: view.ownership || '' }); }} /></div>
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Device management</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">MDM Fleet</h1>
          <p className="mt-1 text-sm text-gray-500">Manage desktops, laptops, mobile devices, servers, kiosks, IoT, and network hardware.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showForm ? 'Close enrollment' : 'Enroll device'}
        </button>
      </div>

      {message && <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.label}</span>
                <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-950">Enrollment token</h2>
            <p className="mt-1 text-sm text-gray-500">Use this with the device agent endpoint at /v1/mdm/enroll.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={createEnrollmentToken} disabled={tokenLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {tokenLoading ? 'Creating...' : 'Create token'}
            </button>
            <button onClick={copyEnrollmentToken} disabled={!enrollmentToken} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              Copy
            </button>
          </div>
        </div>
        {enrollmentToken && <div className="mt-3 break-all rounded border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs text-emerald-800">{enrollmentToken}</div>}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-5 rounded border border-gray-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Device name *</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Category</span>
              <select value={form.deviceCategory} onChange={(e) => setForm({ ...form, deviceCategory: e.target.value, assetType: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {deviceCategories.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Ownership</span>
              <select value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {ownershipTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Assigned user</span>
              <input value={form.assignedUser} onChange={(e) => setForm({ ...form, assignedUser: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Serial</span>
              <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Manufacturer</span>
              <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Model</span>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">OS</span>
              <input value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} placeholder="Windows, macOS, iOS, Android" className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">OS version</span>
              <input value={form.osVersion} onChange={(e) => setForm({ ...form, osVersion: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Enrollment</span>
              <select value={form.enrollmentStatus} onChange={(e) => setForm({ ...form, enrollmentStatus: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {enrollmentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Management mode</span>
              <select value={form.managementMode} onChange={(e) => setForm({ ...form, managementMode: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {managementModes.map((mode) => <option key={mode} value={mode}>{mode.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Compliance</span>
              <select value={form.complianceStatus} onChange={(e) => setForm({ ...form, complianceStatus: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {complianceStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">IP address</span>
              <input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">IMEI</span>
              <input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Policy profile</span>
              <input value={form.policyProfile} onChange={(e) => setForm({ ...form, policyProfile: e.target.value })} placeholder="Baseline, kiosk, executive" className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="md:col-span-4">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4">
            <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Save device</button>
          </div>
        </form>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded border border-gray-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchDevices()} placeholder="Search name, serial, IP, IMEI, or user" className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm" />
        </div>
        {[
          ['deviceCategory', 'All device types', deviceCategories],
          ['enrollmentStatus', 'All enrollment', enrollmentStatuses],
          ['complianceStatus', 'All compliance', complianceStatuses],
          ['ownership', 'All ownership', ownershipTypes],
        ].map(([key, label, options]) => (
          <select key={String(key)} value={(filters as any)[key as string]} onChange={(e) => setFilters({ ...filters, [key as string]: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">{String(label)}</option>
            {(options as string[]).map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
          </select>
        ))}
        <button type="button" onClick={() => { setShowRecycleBin((value) => !value); if (!showRecycleBin) loadRecycleBin(); }} className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{showRecycleBin ? 'Hide recycle bin' : `Recycle bin${retired.length ? ` (${retired.length})` : ''}`}</button>
      </div>

      {selectedIds.size > 0 && <div className="mt-3 flex items-center justify-between rounded border border-blue-200 bg-blue-50 p-3 text-sm"><span><strong>{selectedIds.size}</strong> device(s) selected</span><button onClick={retireSelected} className="inline-flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-2 font-medium text-red-700"><Trash2 className="h-4 w-4"/>Move to recycle bin</button></div>}

      {showRecycleBin && <section className="mt-4 rounded border border-amber-200 bg-amber-50 p-4" aria-labelledby="asset-recycle-title"><h2 id="asset-recycle-title" className="font-semibold text-gray-950">Device recycle bin</h2><p className="mt-1 text-sm text-gray-600">Devices can be restored for 30 days. Expired entries without ticket history are removed automatically.</p><div className="mt-3 divide-y divide-amber-200 rounded border border-amber-200 bg-white">{retired.map((device) => { const eligible = Boolean(device.deletedAt && Date.now() - new Date(device.deletedAt).getTime() >= 30 * 86400000); return <div key={device.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"><span><strong className="text-sm">{device.name}</strong><br/><span className="text-xs text-gray-500">Retired {device.deletedAt ? formatDate(device.deletedAt) : 'recently'} · {eligible ? 'retention complete' : 'recoverable'}</span></span><span className="flex gap-2"><button onClick={() => restoreRetired(device.id)} className="inline-flex items-center gap-1 rounded border border-emerald-200 px-3 py-2 text-sm text-emerald-700"><Undo2 className="h-4 w-4"/>Restore</button><button disabled={!eligible} onClick={() => purgeRetired(device.id)} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Delete forever</button></span></div>; })}{retired.length === 0 && <p className="p-4 text-sm text-gray-500">The recycle bin is empty.</p>}</div></section>}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded border border-gray-200 bg-white">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3"><input type="checkbox" checked={sortedDevices.length > 0 && selectedIds.size === sortedDevices.length} onChange={(event) => setSelectedIds(event.target.checked ? new Set(sortedDevices.map((item) => item.id)) : new Set())} aria-label="Select all devices" /></th>
                <th className="w-[28%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Device</th>
                <th className="w-[16%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
                <th className="w-[16%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Enrollment</th>
                <th className="w-[16%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Compliance</th>
                <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Check-in</th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedDevices.map((device) => (
                <tr key={device.id} onClick={() => viewDevice(device.id)} className="cursor-pointer hover:bg-blue-50">
                  <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(device.id)} onClick={(event) => event.stopPropagation()} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); event.target.checked ? next.add(device.id) : next.delete(device.id); return next; })} aria-label={`Select ${device.name}`} /></td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-600">
                        <DeviceIcon category={device.deviceCategory || device.assetType} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-blue-700">{device.name}</div>
                        <div className="truncate text-xs text-gray-500">{[device.manufacturer, device.model, device.os].filter(Boolean).join(' ') || device.assetType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="truncate">{device.assignedUser || '-'}</div>
                    <div className="text-xs text-gray-500">{device.ownership || 'COMPANY'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${statusClass(device.enrollmentStatus)}`}>{(device.enrollmentStatus || 'UNMANAGED').replaceAll('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${statusClass(device.complianceStatus)}`}>{(device.complianceStatus || 'UNKNOWN').replaceAll('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{device.lastCheckInAt ? formatDate(device.lastCheckInAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{device.batteryLevel !== undefined && device.batteryLevel !== null ? `${device.batteryLevel}%` : '-'}</td>
                </tr>
              ))}
              {!loading && sortedDevices.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No devices found</td></tr>
              )}
            </tbody>
          </table>
          {loading && <div className="border-t border-gray-200 p-4 text-sm text-gray-500">Loading device inventory...</div>}
        </div>

        <aside className="rounded border border-gray-200 bg-white p-5">
          {!selected ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center text-gray-500">
              <ShieldCheck className="mb-3 h-8 w-8" aria-hidden="true" />
              <p className="text-sm">Select a device to inspect compliance, security posture, and management actions.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <DeviceIcon category={selected.deviceCategory || selected.assetType} />
                    <h2 className="text-lg font-semibold text-gray-950">{selected.name}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{[selected.manufacturer, selected.model, selected.serialNumber].filter(Boolean).join(' - ') || 'No hardware identifiers'}</p>
                </div>
                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusClass(selected.complianceStatus)}`}>{selected.complianceStatus || 'UNKNOWN'}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Category</span><div className="font-medium">{selected.deviceCategory || selected.assetType}</div></div>
                <div><span className="text-gray-500">Enrollment</span><div className="font-medium">{selected.enrollmentStatus || 'UNMANAGED'}</div></div>
                <div><span className="text-gray-500">Management</span><div className="font-medium">{selected.managementMode || 'NONE'}</div></div>
                <div><span className="text-gray-500">Provider</span><div className="font-medium">{selected.mdmProvider || '-'}</div></div>
                <div><span className="text-gray-500">OS</span><div className="font-medium">{[selected.os, selected.osVersion].filter(Boolean).join(' ') || '-'}</div></div>
                <div><span className="text-gray-500">Check-in</span><div className="font-medium">{selected.lastCheckInAt ? formatDate(selected.lastCheckInAt) : 'Never'}</div></div>
                <div><span className="text-gray-500">Encryption</span><div className="font-medium">{selected.encryptionStatus || 'UNKNOWN'}</div></div>
                <div><span className="text-gray-500">Antivirus</span><div className="font-medium">{selected.antivirusStatus || '-'}</div></div>
                <div><span className="text-gray-500">Location</span><div className="font-medium">{selected.location || '-'}</div></div>
                <div><span className="text-gray-500">IP</span><div className="font-medium">{selected.ipAddress || '-'}</div></div>
              </div>

              {selected.complianceReasons && (
                <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{selected.complianceReasons}</div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={checkIn} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Check in
                </button>
                <button onClick={() => runAction('LOCK')} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                  <Lock className="h-4 w-4" aria-hidden="true" /> Lock
                </button>
                <button onClick={() => runAction('RESTART')} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                  <RotateCw className="h-4 w-4" aria-hidden="true" /> Restart
                </button>
                <button onClick={() => runAction(selected.lostModeEnabled ? 'CLEAR_LOST_MODE' : 'LOST_MODE')} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> {selected.lostModeEnabled ? 'Clear lost' : 'Lost mode'}
                </button>
                <button onClick={() => runAction('SYNC')} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                  <Wifi className="h-4 w-4" aria-hidden="true" /> Sync
                </button>
                <button onClick={() => runAction('WIPE', { reason: 'Admin requested wipe' })} disabled={!!actionLoading} className="inline-flex items-center justify-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60">
                  <Eraser className="h-4 w-4" aria-hidden="true" /> Wipe
                </button>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-950">Command queue</h3>
                <div className="mt-2 divide-y divide-gray-200 rounded border border-gray-200">
                  {commands.slice(0, 6).map((command) => (
                    <div key={command.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-800">{command.action.replaceAll('_', ' ')}</div>
                        <div className="text-xs text-gray-500">{formatDate(command.createdAt)}</div>
                      </div>
                      <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${statusClass(command.status)}`}>{command.status}</span>
                    </div>
                  ))}
                  {commands.length === 0 && <div className="px-3 py-4 text-sm text-gray-500">No commands queued yet</div>}
                </div>
              </div>

              {selected.notes && <div className="mt-5 whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">{selected.notes}</div>}
            </div>
          )}
        </aside>
      </div>
    </div>
    </RequireCompanyContext>
  );
}
