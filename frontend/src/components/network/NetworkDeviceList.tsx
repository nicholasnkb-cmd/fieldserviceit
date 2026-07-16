import { Cable, Router, Search, Shield, Wifi } from 'lucide-react';
import type { NetworkDevice } from './types';

interface NetworkDeviceListProps {
  devices: NetworkDevice[];
  selectedId?: string;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (device: NetworkDevice) => void;
}

function DeviceIcon({ type }: { type?: string }) {
  const value = type?.toLowerCase() || '';
  if (value.includes('switch')) return <Cable className="h-4 w-4" aria-hidden="true" />;
  if (value.includes('ap') || value.includes('wireless')) return <Wifi className="h-4 w-4" aria-hidden="true" />;
  if (value.includes('firewall')) return <Shield className="h-4 w-4" aria-hidden="true" />;
  return <Router className="h-4 w-4" aria-hidden="true" />;
}

function statusClass(status?: string) {
  if (status === 'active' || status === 'COMPLIANT') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'maintenance' || status === 'UNKNOWN') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-gray-200 bg-gray-50 text-gray-700';
}

export function NetworkDeviceList({ devices, selectedId, loading, search, onSearch, onSelect }: NetworkDeviceListProps) {
  return (
    <section className="rounded border border-gray-200 bg-white" aria-label="Network equipment">
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search equipment" className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {devices.map((device) => (
          <button key={device.id} onClick={() => onSelect(device)} className={`flex w-full items-start gap-3 p-4 text-left hover:bg-blue-50 ${selectedId === device.id ? 'bg-blue-50' : ''}`}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-600"><DeviceIcon type={`${device.manufacturer} ${device.model}`} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-950">{device.name}</span>
              <span className="mt-1 block truncate text-xs text-gray-500">{[device.manufacturer, device.model].filter(Boolean).join(' ') || 'Network device'}</span>
              <span className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusClass(device.status)}`}>{device.status}</span>
                {device.ipAddress && <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">{device.ipAddress}</span>}
              </span>
            </span>
          </button>
        ))}
        {!loading && devices.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No network equipment found</div>}
        {loading && <div className="p-4 text-sm text-gray-500">Loading network equipment...</div>}
      </div>
    </section>
  );
}
