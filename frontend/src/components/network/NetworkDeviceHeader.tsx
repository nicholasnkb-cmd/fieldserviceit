import { Cable, Router, Save, Shield, Trash2, Wifi } from 'lucide-react';
import type { NetworkDevice } from './types';

interface NetworkDeviceHeaderProps {
  device: NetworkDevice;
  canEdit: boolean;
  canRetire: boolean;
  saving: boolean;
  retiring: boolean;
  onSave: () => void;
  onRetire: () => void;
}

function DeviceIcon({ type }: { type?: string }) {
  const value = type?.toLowerCase() || '';
  if (value.includes('switch')) return <Cable className="h-4 w-4" aria-hidden="true" />;
  if (value.includes('ap') || value.includes('wireless')) return <Wifi className="h-4 w-4" aria-hidden="true" />;
  if (value.includes('firewall')) return <Shield className="h-4 w-4" aria-hidden="true" />;
  return <Router className="h-4 w-4" aria-hidden="true" />;
}

export function NetworkDeviceHeader({ device, canEdit, canRetire, saving, retiring, onSave, onRetire }: NetworkDeviceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <DeviceIcon type={`${device.manufacturer} ${device.model}`} />
          <h2 className="text-xl font-semibold text-gray-950">{device.name}</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">{[device.manufacturer, device.model, device.serialNumber].filter(Boolean).join(' - ') || 'No hardware identifiers'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canRetire && <button onClick={onRetire} disabled={retiring || saving} className="inline-flex items-center justify-center gap-2 rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 className="h-4 w-4" aria-hidden="true" />{retiring ? 'Retiring...' : 'Retire device'}</button>}
        {canEdit && <button onClick={onSave} disabled={saving || retiring} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save config'}</button>}
      </div>
    </div>
  );
}
