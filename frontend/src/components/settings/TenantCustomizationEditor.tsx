'use client';

import { useEffect, useMemo, useState } from 'react';
import { ImageUp, Megaphone, Palette, Presentation, RotateCcw, Workflow, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const defaults = {
  branding: {
    companyName: '',
    logoUrl: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
    sidebarImageUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#e2e8f0',
    accentColor: '#0ea5e9',
    backgroundColor: '#f8fafc',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    borderRadius: 8,
  },
  customization: {
    banner: { enabled: false, imageUrl: '', text: '', linkUrl: '', linkLabel: '', tone: 'info', dismissible: true },
    workflow: { defaultTrigger: 'ticket.created', defaultPriority: 'MEDIUM', requireApproval: false, autoAssign: false, approvalGroup: '' },
    reporting: { logoUrl: '', headerText: '', footerText: '', accentColor: '#2563eb', defaultDateRange: '30d', pageOrientation: 'portrait', showCompanyLogo: true },
  },
};

const themes = [
  { name: 'Professional', primaryColor: '#2563eb', secondaryColor: '#e2e8f0', accentColor: '#0ea5e9', backgroundColor: '#f8fafc', surfaceColor: '#ffffff', textColor: '#0f172a' },
  { name: 'Midnight', primaryColor: '#4f46e5', secondaryColor: '#334155', accentColor: '#8b5cf6', backgroundColor: '#0f172a', surfaceColor: '#1e293b', textColor: '#f8fafc' },
  { name: 'Evergreen', primaryColor: '#047857', secondaryColor: '#d1fae5', accentColor: '#0d9488', backgroundColor: '#f0fdf4', surfaceColor: '#ffffff', textColor: '#052e16' },
  { name: 'Warm', primaryColor: '#c2410c', secondaryColor: '#ffedd5', accentColor: '#d97706', backgroundColor: '#fff7ed', surfaceColor: '#ffffff', textColor: '#431407' },
];

const colorFields = [
  ['primaryColor', 'Primary'],
  ['secondaryColor', 'Secondary'],
  ['accentColor', 'Accent'],
  ['backgroundColor', 'Page'],
  ['surfaceColor', 'Cards'],
  ['textColor', 'Text'],
] as const;

const imageFields = [
  ['logoUrl', 'Company logo', 'Automatically fitted for headers and reports'],
  ['faviconUrl', 'Browser icon', 'Square PNG, JPEG, or WebP'],
  ['loginBackgroundUrl', 'Login background', 'Landscape image'],
  ['sidebarImageUrl', 'Sidebar background', 'Portrait or square image'],
] as const;

const tabs = [
  ['brand', 'Brand', Palette],
  ['banner', 'Banner', Megaphone],
  ['workflow', 'Workflow', Workflow],
  ['reports', 'Reports', Presentation],
] as const;

const toneStyles: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  critical: 'border-red-200 bg-red-50 text-red-900',
};

export function TenantCustomizationEditor({ initial, onMessage }: { initial: any; onMessage: (message: string) => void }) {
  const setCompany = useAuthStore((state) => state.setCompany);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>('brand');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [branding, setBranding] = useState<any>(defaults.branding);
  const [customization, setCustomization] = useState<any>(defaults.customization);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!initial) return;
    const nextBranding = {
      ...defaults.branding,
      ...(initial.branding || {}),
      companyName: initial.branding?.companyName || initial.name || '',
      logoUrl: initial.branding?.logoUrl || initial.logo || '',
    };
    const saved = initial.settings?.customization || {};
    const nextCustomization = {
      banner: { ...defaults.customization.banner, ...(saved.banner || {}) },
      workflow: { ...defaults.customization.workflow, ...(saved.workflow || {}) },
      reporting: { ...defaults.customization.reporting, ...(saved.reporting || {}) },
    };
    setBranding(nextBranding);
    setCustomization(nextCustomization);
    setSavedSnapshot(JSON.stringify({ branding: nextBranding, customization: nextCustomization }));
  }, [initial]);

  const dirty = useMemo(
    () => savedSnapshot !== '' && savedSnapshot !== JSON.stringify({ branding, customization }),
    [branding, customization, savedSnapshot],
  );
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const [field, label] of colorFields) {
      if (!/^#[0-9a-f]{6}$/i.test(branding[field] || '')) errors[`branding.${field}`] = `${label} must be a six-digit hex color.`;
    }
    if (!/^#[0-9a-f]{6}$/i.test(customization.reporting.accentColor || '')) {
      errors['reporting.accentColor'] = 'Report accent must be a six-digit hex color.';
    }
    const checkUrl = (key: string, value: string, label: string) => {
      if (!value) return;
      if (value.startsWith('/uploads/branding/')) return;
      try {
        const parsed = new URL(value);
        if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) throw new Error();
      } catch {
        errors[key] = `${label} must be a valid HTTP, HTTPS, or uploaded image URL.`;
      }
    };
    imageFields.forEach(([field, label]) => checkUrl(`branding.${field}`, branding[field], label));
    checkUrl('banner.imageUrl', customization.banner.imageUrl, 'Banner image');
    checkUrl('banner.linkUrl', customization.banner.linkUrl, 'Banner link');
    return errors;
  }, [branding, customization]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const loadHistory = async () => {
    try {
      setHistory(await api.get<any[]>('/settings/history'));
    } catch (error: any) {
      onMessage(error.message || 'Customization history could not be loaded');
    }
  };

  const updateSection = (section: string, values: Record<string, any>) => {
    setCustomization((current: any) => ({ ...current, [section]: { ...current[section], ...values } }));
  };

  const uploadImage = async (field: string, file?: File) => {
    if (!file) return;
    setUploading(field);
    try {
      const body = new FormData();
      body.append('image', file);
      body.append('field', field);
      const result = await api.upload<{ url: string; field: string; company: any }>('/uploads/branding', body);
      if (field === 'bannerImageUrl') {
        updateSection('banner', { imageUrl: result.url });
      } else {
        setBranding((current: any) => ({ ...current, [field]: result.url }));
      }
      if (field === 'logoUrl') updateSection('reporting', { logoUrl: result.url, showCompanyLogo: true });
      if (result.company) setCompany(result.company);
      onMessage(field === 'logoUrl' ? 'Logo formatted and configured automatically.' : 'Image uploaded and configured automatically.');
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
      setSavedSnapshot(JSON.stringify({ branding, customization }));
      loadHistory();
      onMessage('Tenant customization published');
    } catch (error: any) {
      onMessage(error.message || 'Customization could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    if (!savedSnapshot) return;
    const saved = JSON.parse(savedSnapshot);
    setBranding(saved.branding);
    setCustomization(saved.customization);
    onMessage('Unpublished changes discarded');
  };

  const resetTenantCustomization = async () => {
    if (!window.confirm('Reset all tenant branding, images, banners, workflow defaults, and report presentation? General company settings will be preserved.')) return;
    setSaving(true);
    try {
      const updated = await api.delete<any>('/settings/customization');
      const nextBranding = { ...defaults.branding, companyName: updated.name || initial?.name || '' };
      const nextCustomization = {
        banner: { ...defaults.customization.banner },
        workflow: { ...defaults.customization.workflow },
        reporting: { ...defaults.customization.reporting },
      };
      setBranding(nextBranding);
      setCustomization(nextCustomization);
      setSavedSnapshot(JSON.stringify({ branding: nextBranding, customization: nextCustomization }));
      setCompany(updated);
      setActiveTab('brand');
      loadHistory();
      onMessage('Tenant customization reset to defaults');
    } catch (error: any) {
      onMessage(error.message || 'Tenant customization could not be reset');
    } finally {
      setSaving(false);
    }
  };

  const rollback = async (id: string) => {
    if (!window.confirm('Restore this saved tenant customization version? The current version will remain available in history.')) return;
    setSaving(true);
    try {
      const updated = await api.post<any>(`/settings/history/${id}/rollback`, {});
      const nextBranding = {
        ...defaults.branding,
        ...(updated.branding || {}),
        companyName: updated.branding?.companyName || updated.name || '',
        logoUrl: updated.branding?.logoUrl || updated.logo || '',
      };
      const saved = updated.settings?.customization || {};
      const nextCustomization = {
        banner: { ...defaults.customization.banner, ...(saved.banner || {}) },
        workflow: { ...defaults.customization.workflow, ...(saved.workflow || {}) },
        reporting: { ...defaults.customization.reporting, ...(saved.reporting || {}) },
      };
      setBranding(nextBranding);
      setCustomization(nextCustomization);
      setSavedSnapshot(JSON.stringify({ branding: nextBranding, customization: nextCustomization }));
      setCompany(updated);
      await loadHistory();
      onMessage('Tenant customization version restored');
    } catch (error: any) {
      onMessage(error.message || 'Customization version could not be restored');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Tenant Customization Studio</h2>
            <p className="mt-1 text-sm text-slate-500">Control how this tenant looks and how new workflows and reports behave.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {dirty ? 'Unpublished changes' : 'Published'}
          </span>
        </div>
        <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === id ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 sm:p-6">
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <input value={branding.companyName} maxLength={120} onChange={(event) => setBranding({ ...branding, companyName: event.target.value })} className="input" />
                </Field>
                <Field label="Corner radius">
                  <input type="range" min="0" max="24" value={branding.borderRadius} onChange={(event) => setBranding({ ...branding, borderRadius: Number(event.target.value) })} className="mt-3 w-full accent-primary" />
                  <div className="mt-1 text-right text-xs text-slate-500">{branding.borderRadius}px</div>
                </Field>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Theme presets</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {themes.map((theme) => (
                    <button key={theme.name} type="button" onClick={() => {
                      const { name: _name, ...colors } = theme;
                      setBranding({ ...branding, ...colors });
                    }}
                      className="rounded-lg border border-slate-200 p-3 text-left hover:border-primary">
                      <div className="flex gap-1">{[theme.primaryColor, theme.accentColor, theme.backgroundColor].map((color) => <span key={color} className="h-5 flex-1 rounded" style={{ backgroundColor: color }} />)}</div>
                      <span className="mt-2 block text-xs font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {colorFields.map(([field, label]) => (
                  <Field key={field} label={label} error={validationErrors[`branding.${field}`]}>
                    <div className="flex gap-2">
                      <input type="color" value={branding[field]} onChange={(event) => setBranding({ ...branding, [field]: event.target.value })} className="h-10 w-12 rounded border" />
                      <input aria-invalid={!!validationErrors[`branding.${field}`]} value={branding[field]} maxLength={7} onChange={(event) => setBranding({ ...branding, [field]: event.target.value })} className="input min-w-0 flex-1" />
                    </div>
                  </Field>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {imageFields.map(([field, label, hint]) => (
                  <ImageField key={field} label={label} hint={hint} value={branding[field]} uploading={uploading === field}
                    onUpload={(file) => uploadImage(field, file)} onRemove={() => setBranding({ ...branding, [field]: '' })}
                    onChange={(value) => setBranding({ ...branding, [field]: value })} error={validationErrors[`branding.${field}`]} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'banner' && (
            <div className="space-y-5">
              <Toggle label="Show announcement banner" description="Display the banner below the application header." checked={customization.banner.enabled} onChange={(checked) => updateSection('banner', { enabled: checked })} />
              <Toggle label="Allow users to dismiss it" description="The dismissal lasts for the current browser session." checked={customization.banner.dismissible} onChange={(checked) => updateSection('banner', { dismissible: checked })} />
              <Field label="Message">
                <textarea rows={3} maxLength={300} value={customization.banner.text} onChange={(event) => updateSection('banner', { text: event.target.value })} className="input" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Link label"><input maxLength={60} value={customization.banner.linkLabel} onChange={(event) => updateSection('banner', { linkLabel: event.target.value })} className="input" /></Field>
                <Field label="Link URL" error={validationErrors['banner.linkUrl']}><input aria-invalid={!!validationErrors['banner.linkUrl']} value={customization.banner.linkUrl} onChange={(event) => updateSection('banner', { linkUrl: event.target.value })} className="input" placeholder="https://..." /></Field>
                <Field label="Tone">
                  <select value={customization.banner.tone} onChange={(event) => updateSection('banner', { tone: event.target.value })} className="input">
                    <option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="critical">Critical</option>
                  </select>
                </Field>
              </div>
              <ImageField label="Banner image" hint="Optional wide supporting image" value={customization.banner.imageUrl} uploading={uploading === 'bannerImageUrl'}
                onUpload={(file) => uploadImage('bannerImageUrl', file)} onRemove={() => updateSection('banner', { imageUrl: '' })}
                onChange={(value) => updateSection('banner', { imageUrl: value })} error={validationErrors['banner.imageUrl']} wide />
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-5">
              <Field label="Default workflow trigger">
                <select value={customization.workflow.defaultTrigger} onChange={(event) => updateSection('workflow', { defaultTrigger: event.target.value })} className="input">
                  <option value="ticket.created">Ticket created</option><option value="ticket.updated">Ticket updated</option><option value="ticket.assigned">Ticket assigned</option><option value="ticket.resolved">Ticket resolved</option><option value="sla.warning">SLA warning</option>
                </select>
              </Field>
              <Field label="Default priority">
                <select value={customization.workflow.defaultPriority} onChange={(event) => updateSection('workflow', { defaultPriority: event.target.value })} className="input">
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                </select>
              </Field>
              <Toggle label="Add approval step" description="New workflows begin with an approval requirement." checked={customization.workflow.requireApproval} onChange={(checked) => updateSection('workflow', { requireApproval: checked })} />
              {customization.workflow.requireApproval && <Field label="Approval group"><input maxLength={120} value={customization.workflow.approvalGroup} onChange={(event) => updateSection('workflow', { approvalGroup: event.target.value })} className="input" placeholder="Tenant administrators" /></Field>}
              <Toggle label="Automatically assign work" description="New workflows use least-loaded technician assignment." checked={customization.workflow.autoAssign} onChange={(checked) => updateSection('workflow', { autoAssign: checked })} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-5">
              <Toggle label="Show company logo" description="Include the tenant logo in report headers." checked={customization.reporting.showCompanyLogo} onChange={(checked) => updateSection('reporting', { showCompanyLogo: checked })} />
              <Field label="Report header"><input maxLength={160} value={customization.reporting.headerText} onChange={(event) => updateSection('reporting', { headerText: event.target.value })} className="input" /></Field>
              <Field label="Report footer"><textarea rows={3} maxLength={300} value={customization.reporting.footerText} onChange={(event) => updateSection('reporting', { footerText: event.target.value })} className="input" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Accent color" error={validationErrors['reporting.accentColor']}><div className="flex gap-2"><input type="color" value={customization.reporting.accentColor} onChange={(event) => updateSection('reporting', { accentColor: event.target.value })} className="h-10 w-12 rounded border" /><input aria-invalid={!!validationErrors['reporting.accentColor']} value={customization.reporting.accentColor} onChange={(event) => updateSection('reporting', { accentColor: event.target.value })} className="input min-w-0 flex-1" /></div></Field>
                <Field label="Default date range"><select value={customization.reporting.defaultDateRange} onChange={(event) => updateSection('reporting', { defaultDateRange: event.target.value })} className="input"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option><option value="quarter">Quarter</option><option value="year">Year</option></select></Field>
                <Field label="Page orientation"><select value={customization.reporting.pageOrientation} onChange={(event) => updateSection('reporting', { pageOrientation: event.target.value })} className="input"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field>
              </div>
            </div>
          )}
        </div>

        <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
          <div className="sticky top-20">
            <h3 className="text-sm font-semibold text-slate-900">Live preview</h3>
            <p className="mt-1 text-xs text-slate-500">Preview changes before publishing.</p>
            <Preview activeTab={activeTab} branding={branding} customization={customization} />
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
        <button type="button" onClick={resetTenantCustomization} disabled={saving || !!uploading}
          className="mr-auto rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40">
          Reset tenant customization
        </button>
        <button type="button" onClick={resetChanges} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"><RotateCcw size={16} /> Discard</button>
        <button type="button" onClick={() => {
          const next = !historyOpen;
          setHistoryOpen(next);
          if (next) loadHistory();
        }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          {historyOpen ? 'Hide history' : 'Version history'}
        </button>
        <button type="button" onClick={save} disabled={!dirty || saving || !!uploading || hasValidationErrors} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Publishing...' : 'Publish changes'}</button>
      </div>
      {historyOpen && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <h3 className="text-sm font-semibold text-slate-900">Saved versions</h3>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No previous versions are available yet.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">{String(entry.action || '').replaceAll('_', ' ').toLowerCase()}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleString()} · {entry.actor?.email || 'Administrator'}
                    </div>
                  </div>
                  <button type="button" disabled={saving} onClick={() => rollback(entry.id)} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1.5">{children}</div>{error && <span className="mt-1 block text-xs text-red-700">{error}</span>}</label>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"><span><span className="block text-sm font-medium text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" /></label>;
}

function ImageField({ label, hint, value, uploading, onUpload, onRemove, onChange, error, wide = false }: { label: string; hint: string; value: string; uploading: boolean; onUpload: (file?: File) => void; onRemove: () => void; onChange: (value: string) => void; error?: string; wide?: boolean }) {
  return <div className="rounded-lg border border-slate-200 p-4"><div className="text-sm font-medium text-slate-800">{label}</div><p className="mt-1 text-xs text-slate-500">{hint}</p><div className="mt-3 flex items-center gap-3">{value ? <img src={value} alt="" className={`${wide ? 'w-28 object-cover' : 'w-20 object-contain'} h-14 rounded border bg-white`} /> : <div className={`${wide ? 'w-28' : 'w-20'} h-14 rounded bg-slate-100`} />}<label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-xs font-medium"><ImageUp size={15} /> {uploading ? 'Uploading...' : 'Upload'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={(event) => onUpload(event.target.files?.[0])} /></label>{value && <button type="button" onClick={onRemove} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${label}`}><X size={16} /></button>}</div><input aria-invalid={!!error} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Or enter an image URL" className="input mt-3 text-xs" />{error && <p className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}

function Preview({ activeTab, branding, customization }: { activeTab: string; branding: any; customization: any }) {
  if (activeTab === 'banner') return <div className="mt-4 overflow-hidden rounded-lg border bg-white"><div className={`flex min-h-20 items-center gap-2 border-b p-3 text-xs ${toneStyles[customization.banner.tone]}`}>{customization.banner.imageUrl && <img src={customization.banner.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />}<span>{customization.banner.text || 'Your tenant announcement appears here.'}</span>{customization.banner.linkLabel && <b className="underline">{customization.banner.linkLabel}</b>}</div><PreviewPlaceholder /></div>;
  if (activeTab === 'reports') return <div className="mt-4 rounded-lg border bg-white p-5 shadow-sm" style={{ aspectRatio: customization.reporting.pageOrientation === 'landscape' ? '1.4' : '.78' }}><div className="flex items-center justify-between border-b pb-3">{customization.reporting.showCompanyLogo && branding.logoUrl ? <img src={branding.logoUrl} alt="" className="h-8 w-24 object-contain object-left" /> : <b className="text-xs">{branding.companyName || 'Company'}</b>}<span className="text-[10px] text-slate-500">{customization.reporting.headerText || 'Operations Report'}</span></div><div className="mt-5 h-2 w-2/3 rounded" style={{ backgroundColor: customization.reporting.accentColor }} /><div className="mt-3 space-y-2"><div className="h-2 rounded bg-slate-100" /><div className="h-2 w-5/6 rounded bg-slate-100" /><div className="h-16 rounded bg-slate-50" /></div><div className="mt-5 border-t pt-2 text-[9px] text-slate-400">{customization.reporting.footerText || 'Confidential tenant report'}</div></div>;
  if (activeTab === 'workflow') return <div className="mt-4 space-y-2 rounded-lg border bg-white p-4"><PreviewStep label={customization.workflow.defaultTrigger.replaceAll('.', ' ')} /><PreviewStep label={`Set priority: ${customization.workflow.defaultPriority}`} />{customization.workflow.requireApproval && <PreviewStep label={`Approval: ${customization.workflow.approvalGroup || 'Tenant administrators'}`} />}{customization.workflow.autoAssign && <PreviewStep label="Assign least-loaded technician" />}</div>;
  return <div className="mt-4 overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: branding.backgroundColor, color: branding.textColor, borderRadius: branding.borderRadius }}><div className="flex items-center gap-2 border-b p-3" style={{ backgroundColor: branding.surfaceColor }}>{branding.logoUrl ? <img src={branding.logoUrl} alt="" className="h-7 w-16 object-contain object-left" /> : <span className="h-7 w-7 rounded" style={{ backgroundColor: branding.primaryColor }} />}<b className="truncate text-xs">{branding.companyName || 'Company name'}</b></div><div className="flex min-h-52"><div className="w-20 border-r p-2" style={{ backgroundColor: branding.surfaceColor }}>{['Overview', 'Tickets', 'Assets', 'Reports'].map((item, index) => <div key={item} className="mb-1 truncate rounded px-2 py-1.5 text-[9px]" style={index === 0 ? { backgroundColor: branding.primaryColor, color: '#fff' } : undefined}>{item}</div>)}</div><div className="flex-1 p-3"><div className="mb-3 h-3 w-2/3 rounded" style={{ backgroundColor: branding.primaryColor }} /><div className="grid grid-cols-2 gap-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-14 border p-2" style={{ backgroundColor: branding.surfaceColor, borderRadius: branding.borderRadius }}><div className="h-2 w-1/2 rounded" style={{ backgroundColor: branding.accentColor }} /></div>)}</div></div></div></div>;
}

function PreviewPlaceholder() {
  return <div className="space-y-2 p-4"><div className="h-3 w-1/2 rounded bg-slate-200" /><div className="h-16 rounded bg-slate-100" /><div className="h-16 rounded bg-slate-100" /></div>;
}

function PreviewStep({ label }: { label: string }) {
  return <div className="flex items-center gap-2 rounded border border-slate-200 p-3 text-xs capitalize"><span className="h-6 w-6 rounded-full bg-primary/10 text-center font-semibold leading-6 text-primary">+</span>{label}</div>;
}
