import { RefreshCw } from 'lucide-react';
import type { NetworkDevice } from './types';

interface RetiredNetworkDevicesProps {
  devices: NetworkDevice[];
  busy: boolean;
  onRefresh: () => void;
  onRestore: (device: NetworkDevice) => void;
  onPurge: (device: NetworkDevice) => void;
}

export function RetiredNetworkDevices({ devices, busy, onRefresh, onRestore, onPurge }: RetiredNetworkDevicesProps) {
  return (
    <section className="mt-5 rounded border border-amber-200 bg-amber-50 p-5" aria-labelledby="retired-network-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="retired-network-heading" className="font-semibold text-gray-950">Retired network devices</h2>
          <p className="text-sm text-gray-600">Retired devices are hidden from active inventory and can be restored without losing their configuration history.</p>
        </div>
        <button type="button" onClick={onRefresh} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 sm:mt-0">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh retired
        </button>
      </div>
      <div className="mt-4 divide-y divide-amber-200 rounded border border-amber-200 bg-white">
        {devices.map((device) => (
          <div key={device.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-950">{device.name}</p>
              <p className="text-xs text-gray-500">{[device.manufacturer, device.model, device.ipAddress].filter(Boolean).join(' · ') || 'Network device'}</p>
            </div>
            <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => onRestore(device)} className="rounded border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">Restore device</button><button type="button" disabled={busy || !device.deletedAt || Date.now() - new Date(device.deletedAt).getTime() < 30 * 86400000} onClick={() => onPurge(device)} title="Available after the 30-day recovery period" className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Delete forever</button></div>
          </div>
        ))}
        {devices.length === 0 && <p className="p-5 text-sm text-gray-500">No retired network devices.</p>}
      </div>
    </section>
  );
}
