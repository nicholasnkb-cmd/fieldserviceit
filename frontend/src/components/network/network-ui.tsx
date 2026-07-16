import { Cable, Router, Shield, Wifi } from 'lucide-react';

export function networkStatusClass(status?: string) {
  if (status === 'active' || status === 'COMPLIANT') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'maintenance' || status === 'UNKNOWN') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-gray-200 bg-gray-50 text-gray-700';
}

export function NetworkDeviceGlyph({ type }: { type?: string }) {
  if (type?.toLowerCase().includes('switch')) return <Cable className="h-4 w-4" aria-hidden="true" />;
  if (type?.toLowerCase().includes('ap') || type?.toLowerCase().includes('wireless')) return <Wifi className="h-4 w-4" aria-hidden="true" />;
  if (type?.toLowerCase().includes('firewall')) return <Shield className="h-4 w-4" aria-hidden="true" />;
  return <Router className="h-4 w-4" aria-hidden="true" />;
}
