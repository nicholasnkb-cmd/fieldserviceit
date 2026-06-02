'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, ClipboardList, Loader2, MapPin, Plus, RefreshCw, Search, Truck } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

type Part = {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  vendor?: string;
  locationId?: string;
  locationName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  unitPrice: number;
  status: string;
  updatedAt?: string;
};

type Location = {
  id: string;
  name: string;
  locationType: string;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPartForm, setShowPartForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [movement, setMovement] = useState({ movementType: 'RECEIVE', quantity: 1, ticketId: '', notes: '' });
  const [partForm, setPartForm] = useState({
    sku: '',
    name: '',
    category: '',
    vendor: '',
    locationId: '',
    unitCost: 0,
    unitPrice: 0,
    quantityOnHand: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
  });
  const [locationForm, setLocationForm] = useState({ name: '', locationType: 'WAREHOUSE', address: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (query.trim()) params.set('search', query.trim());
      if (lowStockOnly) params.set('lowStock', 'true');
      const [summaryRes, partsRes, locationsRes, transactionsRes, ticketsRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get(`/inventory/parts?${params.toString()}`),
        api.get('/inventory/locations'),
        api.get('/inventory/transactions?limit=25'),
        api.get('/tickets?limit=100').catch(() => []),
      ]);
      setSummary(summaryRes || {});
      const nextParts = getListData<Part>(partsRes).map((part: any) => ({
        ...part,
        quantityOnHand: Number(part.quantityOnHand || 0),
        quantityReserved: Number(part.quantityReserved || 0),
        reorderPoint: Number(part.reorderPoint || 0),
        reorderQuantity: Number(part.reorderQuantity || 0),
        unitCost: Number(part.unitCost || 0),
        unitPrice: Number(part.unitPrice || 0),
      }));
      setParts(nextParts);
      setLocations(getListData(locationsRes));
      setTransactions(getListData(transactionsRes));
      setTickets(getListData(ticketsRes));
      if (!selectedPartId && nextParts[0]) setSelectedPartId(nextParts[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [lowStockOnly, query, selectedPartId]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const selectedPart = useMemo(() => parts.find((part) => part.id === selectedPartId), [parts, selectedPartId]);
  const available = selectedPart ? Math.max(0, selectedPart.quantityOnHand - selectedPart.quantityReserved) : 0;

  const metrics = [
    { label: 'Parts', value: summary.partCount || 0, icon: Boxes },
    { label: 'Low stock', value: summary.lowStockCount || 0, icon: AlertTriangle },
    { label: 'Reserved', value: summary.reservedCount || 0, icon: ClipboardList },
    { label: 'Value', value: money.format(summary.inventoryValue || 0), icon: Truck },
  ];

  const createPart = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/parts', {
        ...partForm,
        locationId: partForm.locationId || undefined,
      });
      setPartForm({ sku: '', name: '', category: '', vendor: '', locationId: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderPoint: 0, reorderQuantity: 0 });
      setShowPartForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create part');
    } finally {
      setSaving(false);
    }
  };

  const createLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/locations', locationForm);
      setLocationForm({ name: '', locationType: 'WAREHOUSE', address: '' });
      setShowLocationForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  const createMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPartId) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/movements', {
        partId: selectedPartId,
        ...movement,
        ticketId: movement.ticketId || undefined,
      });
      setMovement({ movementType: 'RECEIVE', quantity: 1, ticketId: '', notes: '' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock movement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Parts Control</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Inventory and Parts</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Track warehouse and van stock, low inventory, parts reserved for tickets, consumed materials, and purchase request signals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowPartForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              Add part
            </button>
            <button onClick={() => setShowLocationForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <MapPin size={16} />
              Add location
            </button>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-sm font-medium">{label}</p>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      {showPartForm && (
        <form onSubmit={createPart} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-4">
          <input required value={partForm.name} onChange={(e) => setPartForm((c) => ({ ...c, name: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Part name" />
          <input value={partForm.sku} onChange={(e) => setPartForm((c) => ({ ...c, sku: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="SKU" />
          <input value={partForm.category} onChange={(e) => setPartForm((c) => ({ ...c, category: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Category" />
          <input value={partForm.vendor} onChange={(e) => setPartForm((c) => ({ ...c, vendor: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Vendor" />
          <select value={partForm.locationId} onChange={(e) => setPartForm((c) => ({ ...c, locationId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Main warehouse</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <NumberInput value={partForm.quantityOnHand} onChange={(value) => setPartForm((c) => ({ ...c, quantityOnHand: value }))} placeholder="Starting qty" />
          <NumberInput value={partForm.reorderPoint} onChange={(value) => setPartForm((c) => ({ ...c, reorderPoint: value }))} placeholder="Reorder point" />
          <NumberInput value={partForm.reorderQuantity} onChange={(value) => setPartForm((c) => ({ ...c, reorderQuantity: value }))} placeholder="Reorder qty" />
          <NumberInput value={partForm.unitCost} onChange={(value) => setPartForm((c) => ({ ...c, unitCost: value }))} placeholder="Unit cost" />
          <NumberInput value={partForm.unitPrice} onChange={(value) => setPartForm((c) => ({ ...c, unitPrice: value }))} placeholder="Unit price" />
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 lg:col-span-2">
            {saving && <Loader2 className="animate-spin" size={16} />}
            Save part
          </button>
        </form>
      )}

      {showLocationForm && (
        <form onSubmit={createLocation} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-[1fr_180px_1fr_auto]">
          <input required value={locationForm.name} onChange={(e) => setLocationForm((c) => ({ ...c, name: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Location name" />
          <select value={locationForm.locationType} onChange={(e) => setLocationForm((c) => ({ ...c, locationType: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="WAREHOUSE">Warehouse</option>
            <option value="VAN">Van</option>
            <option value="CUSTOMER_SITE">Customer site</option>
            <option value="OTHER">Other</option>
          </select>
          <input value={locationForm.address} onChange={(e) => setLocationForm((c) => ({ ...c, address: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Address or notes" />
          <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
        </form>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Parts Inventory</h2>
              <p className="text-sm text-gray-500">Available, reserved, reorder, and location details.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search parts" />
              </label>
              <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
                <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
                Low stock
              </label>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading inventory...</div>
            ) : parts.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No parts found.</div>
            ) : parts.map((part) => {
              const isLow = part.quantityOnHand <= part.reorderPoint;
              return (
                <button key={part.id} onClick={() => setSelectedPartId(part.id)} className={`block w-full p-4 text-left hover:bg-gray-50 ${selectedPartId === part.id ? 'bg-primary/5' : ''}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {part.sku && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{part.sku}</span>}
                        {isLow && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">LOW</span>}
                        <p className="truncate text-sm font-semibold text-gray-950">{part.name}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {[part.category, part.vendor, part.locationName || 'No location', part.updatedAt ? `Updated ${formatDate(part.updatedAt)}` : null].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-right text-sm">
                      <Stat label="On hand" value={part.quantityOnHand} />
                      <Stat label="Reserved" value={part.quantityReserved} />
                      <Stat label="Available" value={Math.max(0, part.quantityOnHand - part.quantityReserved)} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={createMovement} className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-950">Stock Movement</h2>
            <p className="mt-1 text-sm text-gray-500">{selectedPart ? `${selectedPart.name} has ${available} available.` : 'Select a part to record stock activity.'}</p>
            <div className="mt-4 space-y-3">
              <select value={selectedPartId} onChange={(e) => setSelectedPartId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Select part</option>
                {parts.map((part) => <option key={part.id} value={part.id}>{part.sku ? `${part.sku} - ` : ''}{part.name}</option>)}
              </select>
              <select value={movement.movementType} onChange={(e) => setMovement((c) => ({ ...c, movementType: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="RECEIVE">Receive stock</option>
                <option value="ADJUST">Adjust up</option>
                <option value="RESERVE">Reserve for ticket</option>
                <option value="USE">Use/consume</option>
                <option value="RETURN">Return reservation</option>
                <option value="TRANSFER_OUT">Transfer out</option>
                <option value="TRANSFER_IN">Transfer in</option>
              </select>
              <NumberInput value={movement.quantity} onChange={(value) => setMovement((c) => ({ ...c, quantity: value }))} placeholder="Quantity" />
              <select value={movement.ticketId} onChange={(e) => setMovement((c) => ({ ...c, ticketId: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">No linked ticket</option>
                {tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.ticketNumber || ticket.id} - {ticket.title}</option>)}
              </select>
              <input value={movement.notes} onChange={(e) => setMovement((c) => ({ ...c, notes: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Notes" />
              <button disabled={saving || !selectedPartId} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="animate-spin" size={16} />}
                Record movement
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-950">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {transactions.length === 0 ? <div className="p-4 text-sm text-gray-500">No transactions yet.</div> : transactions.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-950">{item.partName || item.sku || 'Part'}</p>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{item.movementType}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {[`Qty ${Number(item.quantity || 0)}`, item.locationName, item.ticketNumber, item.createdAt ? formatDate(item.createdAt) : null].filter(Boolean).join(' | ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number; onChange: (value: number) => void; placeholder: string }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
      placeholder={placeholder}
    />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-950">{value}</p>
    </div>
  );
}
