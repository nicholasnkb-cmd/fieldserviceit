'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useToast } from '../../../../components/ui/Toast';

type CatalogItem = {
  id: string;
  requestType: string;
  name: string;
  shortDescription?: string;
  description?: string;
  category: string;
  defaultPriority: string;
  estimatedFulfillment?: string;
  requiresApproval: boolean;
};

const requestTypes = ['SERVICE', 'SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'];

const typeLabels: Record<string, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  SERVICE: 'Service',
  ACCESS: 'Access',
  OTHER: 'Other',
};

const typeDescriptions: Record<string, string> = {
  HARDWARE: 'Devices, accessories, peripherals, or replacements.',
  SOFTWARE: 'Licenses, subscriptions, SaaS seats, or installs.',
  SERVICE: 'Support, onboarding, maintenance, consulting, or changes.',
  ACCESS: 'VPN, application access, permissions, groups, or MFA.',
  OTHER: 'Anything else not listed in the catalog.',
};

export default function NewCatalogRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedIdFromUrl = searchParams.get('catalogItemId') || '';
  const { toast } = useToast();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogItemId, setCatalogItemId] = useState(selectedIdFromUrl);
  const [requestType, setRequestType] = useState('SERVICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/catalog-requests/items')
      .then((data) => setCatalogItems(Array.isArray(data) ? data : []))
      .catch(() => toast('error', 'Failed to load catalog items'));
  }, [toast]);

  const selectedItem = useMemo(() => catalogItems.find((item) => item.id === catalogItemId) || null, [catalogItems, catalogItemId]);

  useEffect(() => {
    if (!selectedItem) return;
    setRequestType(selectedItem.requestType);
    setTitle(selectedItem.name);
    setItemName(selectedItem.name);
    setPriority(selectedItem.defaultPriority || 'MEDIUM');
    setDescription(selectedItem.description || selectedItem.shortDescription || '');
  }, [selectedItem]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!catalogItemId && !title.trim()) nextErrors.title = 'Title is required for custom requests';
    if (!justification.trim()) nextErrors.justification = 'Business reason is required';
    if (quantity && Number(quantity) < 1) nextErrors.quantity = 'Quantity must be at least 1';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearSelectedItem = () => {
    setCatalogItemId('');
    setTitle('');
    setItemName('');
    setDescription('');
    setPriority('MEDIUM');
    setRequestType('SERVICE');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: any = {
        requestType,
        title: title.trim(),
        priority,
        justification: justification.trim(),
      };
      if (catalogItemId) body.catalogItemId = catalogItemId;
      if (description.trim()) body.description = description.trim();
      if (itemName.trim()) body.itemName = itemName.trim();
      if (quantity) body.quantity = parseInt(quantity, 10);
      await api.post('/catalog-requests', body);
      toast('success', 'Catalog request submitted');
      router.push('/catalog-requests');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <button type="button" onClick={() => router.back()} className="mb-4 text-sm font-medium text-primary hover:underline">&larr; Back</button>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase text-primary">Service Catalog</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-950">Submit a catalog request</h1>
          <p className="mt-2 text-sm text-gray-600">Pick an approved catalog item or submit a custom request for service, software, hardware, access, or another need.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Catalog Item</label>
            <select
              value={catalogItemId}
              onChange={(event) => setCatalogItemId(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Custom request</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>{typeLabels[item.requestType] || item.requestType} - {item.name}</option>
              ))}
            </select>
            {selectedItem && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-blue-950">{selectedItem.name}</p>
                    <p className="mt-1 text-blue-800">{selectedItem.shortDescription || selectedItem.description}</p>
                  </div>
                  <button type="button" onClick={clearSelectedItem} className="text-xs font-semibold text-blue-700 hover:underline">Use custom</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700">{selectedItem.category}</span>
                  {selectedItem.estimatedFulfillment && <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700">{selectedItem.estimatedFulfillment}</span>}
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700">
                    {selectedItem.requiresApproval ? 'Approval required' : 'Fast-track'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!selectedItem && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Request Type</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {requestTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRequestType(type)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      requestType === type
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold text-gray-950">{typeLabels[type]}</span>
                    <span className="mt-1 block text-xs text-gray-500">{typeDescriptions[type]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Request Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="What do you need?"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Item or Service Name</label>
              <input
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. laptop, Adobe license, VPN access"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Priority</label>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Business Reason *</label>
            <textarea
              rows={3}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Why is this needed, who needs it, and when?"
            />
            {errors.justification && <p className="mt-1 text-xs text-red-500">{errors.justification}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Additional Details</label>
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Add model preferences, access level, location, asset details, or any special instructions."
            />
          </div>

          <button type="submit" disabled={submitting} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
