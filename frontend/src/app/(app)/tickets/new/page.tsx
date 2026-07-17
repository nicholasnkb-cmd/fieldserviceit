'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../stores/authStore';
import { api } from '../../../../lib/api';
import { allCategories, categories } from '../../../../lib/ticketCategories';
import { useToast } from '../../../../components/ui/Toast';

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/tickets/templates/list').then(setTemplates).catch(() => {});
  }, []);

  const applyTemplate = (t: any) => {
    if (t.title) setTitle(t.title);
    if (t.body) setDescription(t.body);
    if (t.category) { setCategory(t.category); setSubcategory(t.subcategory || ''); }
    if (t.priority) setPriority(t.priority);
  };

  const catOptions = allCategories;
  const subOptions = category ? categories[category] : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!contactName.trim()) e.contactName = 'Contact name is required';
    if (!contactEmail.trim()) e.contactEmail = 'Contact email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.contactEmail = 'Invalid email format';
    if (!contactPhone.trim()) e.contactPhone = 'Contact phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: any = {
        title, description, priority,
        contactName, contactEmail, contactPhone,
      };
      if (category) body.category = category;
      if (subcategory) body.subcategory = subcategory;
      if (location) body.location = location;

      await api.post('/tickets', body);
      toast('success', 'Ticket created successfully');
      router.push('/tickets');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Ticket</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Template</label>
            <select onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t) applyTemplate(t); }}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Select a template...</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.description ? ` — ${t.description}` : ''}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input required maxLength={191} value={title} onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="Brief summary" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
            <input required maxLength={160} value={contactName} onChange={(e) => setContactName(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="Affected person" />
            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
            <input type="email" required maxLength={191} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="email@example.com" />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone *</label>
            <input type="tel" required maxLength={24} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="+1 (555) 000-0000" />
            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Select category...</option>
              {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sub-category</label>
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={!category}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100">
              <option value="">Select sub-category...</option>
              {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location / Address</label>
          <input maxLength={255} value={location} onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="Street address, city, state" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={4} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}
