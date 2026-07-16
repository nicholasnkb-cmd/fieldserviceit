import { Globe2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { NetworkDevice } from './types';

export interface AssetHistoryItem { id: string; action: string; actorName: string; createdAt: string }

export function NetworkDeviceOverview({ device, config, onConfigChange, lifecycle, onLifecycleChange, history }: {
  device: NetworkDevice;
  config: { managementIp: string; wanMode: string; uplink: string };
  onConfigChange: (patch: Partial<{ managementIp: string; wanMode: string; uplink: string }>) => void;
  lifecycle: { purchaseDate: string; warrantyExpiresAt: string };
  onLifecycleChange: (patch: Partial<{ purchaseDate: string; warrantyExpiresAt: string }>) => void;
  history: AssetHistoryItem[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label><span className="text-sm font-medium text-gray-700">Management IP</span><input value={config.managementIp || device.ipAddress || ''} onChange={(event) => onConfigChange({ managementIp: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
      <label><span className="text-sm font-medium text-gray-700">WAN mode</span><select value={config.wanMode} onChange={(event) => onConfigChange({ wanMode: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">{['DHCP', 'Static', 'PPPoE', 'Cellular failover'].map((mode) => <option key={mode}>{mode}</option>)}</select></label>
      <label><span className="text-sm font-medium text-gray-700">Primary uplink</span><input value={config.uplink} onChange={(event) => onConfigChange({ uplink: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
      <label><span className="text-sm font-medium text-gray-700">Purchase date</span><input type="date" value={lifecycle.purchaseDate} onChange={(event) => onLifecycleChange({ purchaseDate: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
      <label><span className="text-sm font-medium text-gray-700">Warranty expiration</span><input type="date" value={lifecycle.warrantyExpiresAt} onChange={(event) => onLifecycleChange({ warrantyExpiresAt: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600"><div className="flex items-center gap-2 font-medium text-gray-800"><Globe2 className="h-4 w-4" aria-hidden="true" /> Last seen</div><div className="mt-2">{device.lastCheckInAt ? formatDate(device.lastCheckInAt) : 'No check-in recorded'}</div></div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4 md:col-span-2"><h3 className="text-sm font-semibold text-gray-900">Configuration history</h3><div className="mt-2 space-y-2">{history.slice(0, 5).map((entry) => <p key={entry.id} className="text-xs text-gray-600"><span className="font-semibold">{entry.action}</span> by {entry.actorName} · {formatDate(entry.createdAt)}</p>)}{history.length === 0 && <p className="text-xs text-gray-500">History will appear after the first saved change, import, retirement, or restore.</p>}</div></div>
    </div>
  );
}
