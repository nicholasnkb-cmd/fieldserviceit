import { Save, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export interface DiscoveryResult { id: string; subnet: string; ipAddress: string; hostname?: string; status: string; assetId?: string; discoveredAt: string }
export interface DiscoverySchedule { subnet: string; intervalMinutes: number; hostLimit: number; enabled: boolean | number; lastRunAt?: string; nextRunAt?: string; lastResultCount?: number; lastError?: string }

export function NetworkDiscoveryPanel({ subnet, onSubnetChange, onScan, results, schedule, onScheduleChange, onSaveSchedule, busy }: {
  subnet: string;
  onSubnetChange: (value: string) => void;
  onScan: () => void;
  results: DiscoveryResult[];
  schedule: DiscoverySchedule;
  onScheduleChange: (patch: Partial<DiscoverySchedule>) => void;
  onSaveSchedule: () => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-gray-200 p-4 md:grid-cols-[1fr_auto]"><Field label="Subnet" value={subnet} onChange={onSubnetChange} /><button onClick={onScan} disabled={busy} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"><Search className="h-4 w-4" /> Scan</button></div>
      <div className="rounded border border-gray-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-gray-950">Scheduled discovery</h3><p className="text-sm text-gray-500">Run a bounded subnet scan automatically. The minimum interval is one hour.</p></div><label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={Boolean(schedule.enabled)} onChange={(event) => onScheduleChange({ enabled: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary" /> Enabled</label></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Scheduled subnet" value={schedule.subnet} onChange={(value) => onScheduleChange({ subnet: value })} /><NumberField label="Interval (minutes)" value={schedule.intervalMinutes} onChange={(value) => onScheduleChange({ intervalMinutes: value })} /><NumberField label="Maximum hosts" value={schedule.hostLimit} onChange={(value) => onScheduleChange({ hostLimit: value })} /><button onClick={onSaveSchedule} disabled={busy} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" /> Save schedule</button></div>
        <p className="mt-3 text-xs text-gray-500">{schedule.lastRunAt ? `Last run ${formatDate(schedule.lastRunAt)} · ${schedule.lastResultCount || 0} devices found` : 'No scheduled run yet.'}{schedule.lastError ? ` · Last error: ${schedule.lastError}` : ''}</p>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200"><table className="min-w-full text-sm"><thead><tr>{['Subnet', 'IP', 'Hostname', 'Status', 'Asset'].map((header) => <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">{header}</th>)}</tr></thead><tbody>{results.map((item) => <tr key={item.id} className="border-t border-gray-100"><td className="px-3 py-2">{item.subnet}</td><td className="px-3 py-2">{item.ipAddress}</td><td className="px-3 py-2">{item.hostname || '-'}</td><td className="px-3 py-2">{item.status}</td><td className="px-3 py-2">{item.assetId ? 'Linked' : 'New'}</td></tr>)}</tbody></table>{results.length === 0 && <p className="p-4 text-sm text-gray-500">No discovery results yet.</p>}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="text-sm font-medium text-gray-700">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label><span className="text-sm font-medium text-gray-700">{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>; }
