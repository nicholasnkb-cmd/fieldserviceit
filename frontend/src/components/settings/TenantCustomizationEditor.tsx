'use client';

import { useEffect, useState } from 'react';
import { ImageUp, Palette, Presentation, Workflow } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const colorFields = [
  ['primaryColor', 'Primary'],
  ['secondaryColor', 'Secondary'],
  ['accentColor', 'Accent'],
  ['backgroundColor', 'Page background'],
  ['surfaceColor', 'Cards and surfaces'],
  ['textColor', 'Text'],
] as const;

const imageFields = [
  ['logoUrl', 'Main logo'],
  ['faviconUrl', 'Browser icon'],
  ['loginBackgroundUrl', 'Login background'],
  ['sidebarImageUrl', 'Sidebar image'],
] as const;

export function TenantCustomizationEditor({ initial, onMessage }: { initial: any; onMessage: (message: string) => void }) {
  const setCompany = useAuthStore((state) => state.setCompany);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [branding, setBranding] = useState<any>({});
  const [customization, setCustomization] = useState<any>({
    banner: { enabled: false, text: '', linkUrl: '', linkLabel: '', tone: 'info', dismissible: true },
    workflow: { defaultTrigger: 'ticket.created', defaultPriority: 'MEDIUM', requireApproval: false, autoAssign: false, approvalGroup: '' },
    reporting: { logoUrl: '', headerText: '', footerText: '', accentColor: '#2563eb', defaultDateRange: '30d', pageOrientation: 'portrait', showCompanyLogo: true },
  });

  useEffect(() => {
    if (!initial) return;
    setBranding({
      companyName: initial.branding?.companyName || initial.name || '',
      logoUrl: initial.branding?.logoUrl || initial.logo || '',
      faviconUrl: initial.branding?.faviconUrl || '',
      loginBackgroundUrl: initial.branding?.loginBackgroundUrl || '',
      sidebarImageUrl: initial.branding?.sidebarImageUrl || '',
      primaryColor: initial.branding?.primaryColor || '#2563eb',
      secondaryColor: initial.branding?.secondaryColor || '#e2e8f0',
      accentColor: initial.branding?.accentColor || '#0ea5e9',
      backgroundColor: initial.branding?.backgroundColor || '#f8fafc',
      surfaceColor: initial.branding?.surfaceColor || '#ffffff',
      textColor: initial.branding?.textColor || '#0f172a',
      borderRadius: initial.branding?.borderRadius ?? 8,
    });
    const saved = initial.settings?.customization || {};
    setCustomization((current: any) => ({
      banner: { ...current.banner, ...(saved.banner || {}) },
      workflow: { ...current.workflow, ...(saved.workflow || {}) },
      reporting: { ...current.reporting, ...(saved.reporting || {}) },
    }));
  }, [initial]);

  const uploadImage = async (field: string, file?: File) => {
    if (!file) return;
    setUploading(field);
    try {
      const body = new FormData();
      body.append('image', file);
      const result = await api.upload<{ url: string }>('/uploads/branding', body);
      setBranding((current: any) => ({ ...current, [field]: result.url }));
      if (field === 'logoUrl') setCustomization((current: any) => ({
        ...current,
        reporting: { ...current.reporting, logoUrl: current.reporting.logoUrl || result.url },
      }));
      onMessage('Image uploaded. Save customization to publish it.');
    } catch (error: any) {
      onMessage(error.message || 'Image upload failed');
    } finally {
      setUploading('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings/branding', branding);
      const updated = await api.put('/settings/customization', customization);
      setCompany(updated);
      onMessage('Tenant customization published');
    } catch (error: any) {
      onMessage(error.message || 'Customization could not be saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <div className="mb-5 flex items-center gap-3">
          <Palette className="text-primary" size={22} />
          <div><h2 className="text-lg font-semibold">Visual Theme and Images</h2><p className="text-sm text-gray-500">Apply tenant colors and imagery throughout the authenticated workspace.</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Display name
            <input value={branding.companyName || ''} onChange={(event) => setBranding({ ...branding, companyName: event.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-gray-700">Corner radius
            <input type="number" min="0" max="24" value={branding.borderRadius ?? 8} onChange={(event) => setBranding({ ...branding, borderRadius: Number(event.target.value) })} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          {colorFields.map(([field, label]) => (
            <label key={field} className="text-sm font-medium text-gray-700">{label}
              <div className="mt-1 flex gap-2">
                <input type="color" value={branding[field] || '#2563eb'} onChange={(event) => setBranding({ ...branding, [field]: event.target.value })} className="h-10 w-12 rounded border" />
                <input value={branding[field] || ''} onChange={(event) => setBranding({ ...branding, [field]: event.target.value })} className="min-w-0 flex-1 rounded border px-3 py-2" />
              </div>
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {imageFields.map(([field, label]) => (
            <div key={field} className="rounded border p-3">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <div className="mt-2 flex items-center gap-3">
                {branding[field] ? <img src={branding[field]} alt="" className="h-14 w-20 rounded border object-contain" /> : <div className="h-14 w-20 rounded bg-gray-100" />}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm">
                  <ImageUp size={16} /> {uploading === field ? 'Uploading...' : 'Upload'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={!!uploading} onChange={(event) => uploadImage(field, event.target.files?.[0])} />
                </label>
              </div>
              <input value={branding[field] || ''} onChange={(event) => setBranding({ ...branding, [field]: event.target.value })} placeholder="Or enter an image URL" className="mt-2 w-full rounded border px-3 py-2 text-xs" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Workspace Banner</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!customization.banner.enabled} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, enabled: event.target.checked } })} /> Show banner</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!customization.banner.dismissible} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, dismissible: event.target.checked } })} /> Allow dismissal</label>
          <label className="md:col-span-2 text-sm font-medium">Message<input value={customization.banner.text || ''} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, text: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="text-sm font-medium">Link URL<input value={customization.banner.linkUrl || ''} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, linkUrl: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="text-sm font-medium">Link label<input value={customization.banner.linkLabel || ''} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, linkLabel: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="text-sm font-medium">Tone<select value={customization.banner.tone} onChange={(event) => setCustomization({ ...customization, banner: { ...customization.banner, tone: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2"><option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2"><Workflow className="text-primary" size={20} /><h2 className="text-lg font-semibold">Workflow Defaults</h2></div>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">Default trigger<input value={customization.workflow.defaultTrigger || ''} onChange={(event) => setCustomization({ ...customization, workflow: { ...customization.workflow, defaultTrigger: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
            <label className="block text-sm font-medium">Default priority<select value={customization.workflow.defaultPriority} onChange={(event) => setCustomization({ ...customization, workflow: { ...customization.workflow, defaultPriority: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!customization.workflow.requireApproval} onChange={(event) => setCustomization({ ...customization, workflow: { ...customization.workflow, requireApproval: event.target.checked } })} /> Add approval step to new workflows</label>
            <label className="block text-sm font-medium">Approval group<input value={customization.workflow.approvalGroup || ''} onChange={(event) => setCustomization({ ...customization, workflow: { ...customization.workflow, approvalGroup: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
          </div>
        </section>
        <section className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2"><Presentation className="text-primary" size={20} /><h2 className="text-lg font-semibold">Report Presentation</h2></div>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">Header text<input value={customization.reporting.headerText || ''} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, headerText: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
            <label className="block text-sm font-medium">Footer text<input value={customization.reporting.footerText || ''} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, footerText: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2" /></label>
            <label className="block text-sm font-medium">Report accent color<div className="mt-1 flex gap-2"><input type="color" value={customization.reporting.accentColor || '#2563eb'} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, accentColor: event.target.value } })} className="h-10 w-12 rounded border" /><input value={customization.reporting.accentColor || ''} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, accentColor: event.target.value } })} className="min-w-0 flex-1 rounded border px-3 py-2" /></div></label>
            <label className="block text-sm font-medium">Default range<select value={customization.reporting.defaultDateRange} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, defaultDateRange: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option><option value="quarter">Quarter</option><option value="year">Year</option></select></label>
            <label className="block text-sm font-medium">Orientation<select value={customization.reporting.pageOrientation} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, pageOrientation: event.target.value } })} className="mt-1 w-full rounded border px-3 py-2"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!customization.reporting.showCompanyLogo} onChange={(event) => setCustomization({ ...customization, reporting: { ...customization.reporting, showCompanyLogo: event.target.checked } })} /> Show company logo</label>
          </div>
        </section>
      </div>

      <button type="button" onClick={save} disabled={saving || !!uploading} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? 'Publishing...' : 'Publish Tenant Customization'}
      </button>
    </div>
  );
}
