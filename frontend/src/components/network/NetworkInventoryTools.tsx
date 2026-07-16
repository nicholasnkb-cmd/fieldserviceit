'use client';

import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Trash2, Upload, X } from 'lucide-react';
import type { NetworkDevice } from './types';
import { networkCsvTemplate, networkDevicesToCsv, parseNetworkCsv } from './network-csv';

interface NetworkInventoryToolsProps {
  devices: NetworkDevice[];
  selectedCount: number;
  canImport: boolean;
  canBulkRetire: boolean;
  busy: boolean;
  onImport: (devices: Record<string, string>[]) => Promise<void>;
  onBulkRetire: () => void;
  onClearSelection: () => void;
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NetworkInventoryTools({ devices, selectedCount, canImport, canBulkRetire, busy, onImport, onBulkRetire, onClearSelection }: NetworkInventoryToolsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; devices: Record<string, string>[]; errors: string[] } | null>(null);

  const readFile = async (file?: File) => {
    if (!file) return;
    const parsed = parseNetworkCsv(await file.text());
    setPreview({ name: file.name, ...parsed });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" aria-labelledby="network-inventory-tools-heading">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="network-inventory-tools-heading" className="font-semibold text-gray-950">Inventory tools</h2>
          <p className="text-sm text-gray-500">Import, export, and safely manage multiple network devices.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => download('network-devices.csv', networkDevicesToCsv(devices))} className="inline-flex min-h-11 items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Download size={16} aria-hidden="true" /> Export CSV</button>
          <button type="button" onClick={() => download('network-import-template.csv', networkCsvTemplate())} className="inline-flex min-h-11 items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><FileSpreadsheet size={16} aria-hidden="true" /> Template</button>
          {canImport && <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"><Upload size={16} aria-hidden="true" /> Import CSV</button>}
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Import network devices from CSV" onChange={(event) => void readFile(event.target.files?.[0])} />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-amber-900">{selectedCount} device{selectedCount === 1 ? '' : 's'} selected</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClearSelection} className="inline-flex min-h-11 items-center gap-2 rounded border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900"><X size={16} aria-hidden="true" /> Clear</button>
            {canBulkRetire && <button type="button" disabled={busy} onClick={onBulkRetire} className="inline-flex min-h-11 items-center gap-2 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /> Retire selected</button>}
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-4" role="status">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-950">{preview.name}: {preview.devices.length} valid row{preview.devices.length === 1 ? '' : 's'}</p>
              <p className="mt-1 text-xs text-blue-800">The server will skip duplicate serial numbers, MAC addresses, and IP addresses.</p>
            </div>
            <button type="button" onClick={() => setPreview(null)} aria-label="Close import preview" className="rounded p-1 text-blue-900 hover:bg-blue-100"><X size={18} /></button>
          </div>
          {preview.errors.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-red-700">{preview.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>}
          <button type="button" disabled={busy || preview.devices.length === 0 || preview.errors.length > 0} onClick={() => void onImport(preview.devices).then(() => setPreview(null))} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Upload size={16} aria-hidden="true" /> Import valid devices</button>
        </div>
      )}
    </section>
  );
}
