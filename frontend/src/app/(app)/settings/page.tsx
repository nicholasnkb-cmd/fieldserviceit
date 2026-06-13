'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { TenantCustomizationEditor } from '../../../components/settings/TenantCustomizationEditor';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', domain: '', logo: '' });
  const [branding, setBranding] = useState({ primaryColor: '#2563eb', logoUrl: '', companyName: '' });
  const [emailTemplate, setEmailTemplate] = useState<any>({
    subjectTemplate: 'Ticket {{ticketNumber}}: {{action}}',
    htmlTemplate: '',
    senderName: '',
    replyTo: '',
    accentColor: '#2563eb',
    headerText: '',
    footerText: 'This is an automated ticket notification.',
    enabled: true,
  });
  const [emailPreview, setEmailPreview] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'BUSINESS') { router.push('/my-tickets'); return; }
    api.get('/settings').then((data) => {
      setSettings(data);
      setForm({ name: data.name || '', domain: data.domain || '', logo: data.logo || '' });
      setBranding({
        primaryColor: data.branding?.primaryColor || '#2563eb',
        logoUrl: data.branding?.logoUrl || '',
        companyName: data.branding?.companyName || data.name || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
    if (isAdmin) {
      api.get('/notifications/email/templates/TICKET_PARTICIPANT')
        .then((data) => setEmailTemplate((current: any) => ({ ...current, ...data, enabled: data.enabled !== false && data.enabled !== 0 })))
        .catch(() => {});
    }
  }, [isAdmin, router, user]);

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings', form);
      setMessage('Settings saved');
    } catch (err: any) { setMessage(err.message); }
    finally { setSaving(false); }
  };

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/branding', branding);
      setMessage('Branding saved');
    } catch (err: any) { setMessage(err.message); }
    finally { setSaving(false); }
  };

  const saveEmailTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put('/notifications/email/templates/TICKET_PARTICIPANT', emailTemplate);
      setEmailTemplate((current: any) => ({ ...current, ...updated, enabled: updated.enabled !== false && updated.enabled !== 0 }));
      setMessage('Email branding saved');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewEmailTemplate = async () => {
    setPreviewing(true);
    try {
      const preview = await api.post('/notifications/email/templates/TICKET_PARTICIPANT/preview', emailTemplate);
      setEmailPreview(preview.htmlBody || '');
    } catch (err: any) {
      setMessage(err.message || 'Email preview could not be generated');
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>
      {message && <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4">{message}</div>}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">General</h2>
        {isAdmin ? (
          <form onSubmit={saveGeneral} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain</label>
              <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input type="url" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p>Company Name: <span className="font-medium text-gray-900">{form.name || '-'}</span></p>
            <p>Domain: <span className="font-medium text-gray-900">{form.domain || '-'}</span></p>
            {form.logo && <p>Logo URL: <span className="font-medium text-gray-900">{form.logo}</span></p>}
            <p className="text-xs text-gray-400 italic mt-2">Only administrators can edit these settings.</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Ticket Email Branding</h2>
            <p className="mt-1 text-sm text-gray-500">Customize the sender identity and wrapper used for ticket notifications.</p>
          </div>
          <form onSubmit={saveEmailTemplate} className="space-y-4">
            <label className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm text-gray-700">
              Enable tenant-branded ticket emails
              <input
                type="checkbox"
                checked={!!emailTemplate.enabled}
                onChange={(e) => setEmailTemplate({ ...emailTemplate, enabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sender Name</label>
                <input value={emailTemplate.senderName || ''} onChange={(e) => setEmailTemplate({ ...emailTemplate, senderName: e.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Your support team" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reply-To Address</label>
                <input type="email" value={emailTemplate.replyTo || ''} onChange={(e) => setEmailTemplate({ ...emailTemplate, replyTo: e.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="support@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Header Text</label>
                <input value={emailTemplate.headerText || ''} onChange={(e) => setEmailTemplate({ ...emailTemplate, headerText: e.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder={branding.companyName || form.name || 'Company name'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                <div className="mt-1 flex gap-2">
                  <input type="color" value={emailTemplate.accentColor || '#2563eb'} onChange={(e) => setEmailTemplate({ ...emailTemplate, accentColor: e.target.value })}
                    className="h-9 w-9 rounded border border-gray-300" />
                  <input value={emailTemplate.accentColor || '#2563eb'} onChange={(e) => setEmailTemplate({ ...emailTemplate, accentColor: e.target.value })}
                    className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Template</label>
              <input value={emailTemplate.subjectTemplate || ''} onChange={(e) => setEmailTemplate({ ...emailTemplate, subjectTemplate: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-gray-500">Available fields: {'{{ticketNumber}}'}, {'{{ticketTitle}}'}, {'{{action}}'}, {'{{companyName}}'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Footer Text</label>
              <input value={emailTemplate.footerText || ''} onChange={(e) => setEmailTemplate({ ...emailTemplate, footerText: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Email Branding'}
              </button>
              <button type="button" onClick={previewEmailTemplate} disabled={previewing}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <Eye size={16} />
                {previewing ? 'Generating...' : 'Preview'}
              </button>
            </div>
            {emailPreview && (
              <div className="border-t border-gray-200 pt-4">
                <div className="mb-2 text-sm font-medium text-gray-700">Email preview</div>
                <iframe
                  title="Ticket email preview"
                  srcDoc={emailPreview}
                  sandbox=""
                  className="h-[520px] w-full rounded-md border border-gray-300 bg-white"
                />
              </div>
            )}
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Branding</h2>
        {isAdmin ? (
          <form onSubmit={saveBranding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input type="text" value={branding.companyName} onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-9 w-9 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input type="url" value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p>Display Name: <span className="font-medium text-gray-900">{branding.companyName || '-'}</span></p>
            <p>Primary Color: <span className="font-medium text-gray-900">{branding.primaryColor}</span></p>
            {branding.logoUrl && <p>Logo: <span className="font-medium text-gray-900">{branding.logoUrl}</span></p>}
            <p className="text-xs text-gray-400 italic mt-2">Only administrators can edit branding.</p>
          </div>
        )}
      </div>

      {isAdmin && <TenantCustomizationEditor initial={settings} onMessage={setMessage} />}

      {settings?.settings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Timezone: <span className="font-medium">{settings.settings.timezone || 'UTC'}</span></p>
            <p>Locale: <span className="font-medium">{settings.settings.locale || 'en-US'}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
