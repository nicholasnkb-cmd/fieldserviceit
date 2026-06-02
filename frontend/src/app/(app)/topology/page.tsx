'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Cable, CheckCircle2, Download, Eye, GitFork, Loader2, MapPin, Plus, RefreshCw, Router, Search, Shield, Wifi } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

type OverlayMode = 'health' | 'utilization' | 'errors' | 'poe' | 'alerts';

type TopologyNode = {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  healthStatus: string;
  role: string;
  x: number;
  y: number;
  activeAlerts: number;
  openTickets: number;
  portCount: number;
  downPorts: number;
  errorPorts?: number;
  poeWatts?: number;
  impactScore: number;
  firmwareVersion?: string;
  latestVersion?: string;
  eolStatus?: string;
  healthAt?: string;
};

type TopologyLink = {
  id: string;
  companyId: string;
  sourceAssetId: string;
  targetAssetId: string;
  sourceInterface?: string;
  targetInterface?: string;
  linkType: string;
  status: string;
  bandwidthMbps?: number;
  discoveredBy?: string;
  notes?: string;
  inferred?: boolean;
};

type InterfaceMetric = {
  id: string;
  assetId: string;
  ifIndex: number;
  name?: string;
  status?: string;
  speedMbps?: number;
  inErrors?: number;
  outErrors?: number;
  poeWatts?: number;
  vlan?: string;
  connectedMac?: string;
  neighborProtocol?: string;
  neighborSystemName?: string;
  neighborPort?: string;
};

type DeviceAction = {
  id: string;
  assetId: string;
  action: string;
  status: string;
  createdAt: string;
};

const blankLink = () => ({
  companyId: '',
  sourceAssetId: '',
  targetAssetId: '',
  sourceInterface: '',
  targetInterface: '',
  linkType: 'UPLINK',
  bandwidthMbps: '',
  notes: '',
});

const blankSite = () => ({ companyId: '', name: '', type: 'SITE', address: '', notes: '' });
const refreshOptions = [0, 30, 60, 120];

export default function TopologyPage() {
  const [summary, setSummary] = useState<any>({});
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [links, setLinks] = useState<TopologyLink[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceMetric[]>([]);
  const [actions, setActions] = useState<DeviceAction[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [siteId, setSiteId] = useState('');
  const [overlay, setOverlay] = useState<OverlayMode>('health');
  const [refreshSec, setRefreshSec] = useState(60);
  const [draggingId, setDraggingId] = useState('');
  const [dirtyLayout, setDirtyLayout] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [linkForm, setLinkForm] = useState(blankLink);
  const [siteForm, setSiteForm] = useState(blankSite);
  const [portName, setPortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [origin, setOrigin] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (siteId) params.set('siteId', siteId);
      const [summaryRes, mapRes, companiesRes] = await Promise.all([
        api.get('/topology/summary'),
        api.get(`/topology/map?${params.toString()}`),
        api.get('/admin/companies?limit=100').catch(() => []),
      ]);
      const nextNodes = getListData<TopologyNode>(mapRes?.nodes);
      setSummary(summaryRes || {});
      setNodes(nextNodes);
      setLinks(getListData<TopologyLink>(mapRes?.links));
      setSites(getListData(mapRes?.sites));
      setDiscoveries(getListData(mapRes?.discoveries));
      setInterfaces(getListData<InterfaceMetric>(mapRes?.interfaces));
      setActions(getListData<DeviceAction>(mapRes?.actions));
      setChanges(getListData(mapRes?.changes));
      setShares(getListData(mapRes?.shares));
      setSettings(mapRes?.settings || {});
      setCompanies(getListData(companiesRes));
      setOverlay((current) => current || mapRes?.settings?.defaultOverlay || 'health');
      if (!selectedId && nextNodes[0]) setSelectedId(nextNodes[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load topology');
    } finally {
      setLoading(false);
    }
  }, [search, selectedId, siteId]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  useEffect(() => {
    if (!refreshSec) return undefined;
    const handle = window.setInterval(loadData, refreshSec * 1000);
    return () => window.clearInterval(handle);
  }, [loadData, refreshSec]);

  useEffect(() => {
    if (!draggingId) return undefined;
    const move = (event: PointerEvent) => {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setNodes((current) => current.map((node) => node.id === draggingId
        ? { ...node, x: Math.max(24, Math.round(event.clientX - rect.left - 72 + mapRef.current!.scrollLeft)), y: Math.max(24, Math.round(event.clientY - rect.top - 44 + mapRef.current!.scrollTop)) }
        : node));
      setDirtyLayout(true);
    };
    const stop = () => setDraggingId('');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [draggingId]);

  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) || nodes[0], [nodes, selectedId]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const visibleLinks = links.filter((link) => nodeById.has(link.sourceAssetId) && nodeById.has(link.targetAssetId));
  const selectedInterfaces = interfaces.filter((item) => item.assetId === selected?.id);
  const selectedActions = actions.filter((item) => item.assetId === selected?.id).slice(0, 5);
  const mapWidth = Math.max(1000, ...nodes.map((node) => node.x + 180), 1000);
  const mapHeight = Math.max(560, ...nodes.map((node) => node.y + 120), 560);

  const metrics = [
    { label: 'Nodes', value: summary.nodes || 0, icon: Router },
    { label: 'Links', value: summary.links || visibleLinks.length, icon: GitFork },
    { label: 'Online', value: summary.online || 0, icon: CheckCircle2 },
    { label: 'Changes', value: summary.openChanges || changes.filter((item) => item.status === 'OPEN').length, icon: AlertTriangle },
  ];

  const createLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/topology/links', {
        ...linkForm,
        companyId: linkForm.companyId || undefined,
        sourceInterface: linkForm.sourceInterface || undefined,
        targetInterface: linkForm.targetInterface || undefined,
        bandwidthMbps: linkForm.bandwidthMbps ? Number(linkForm.bandwidthMbps) : undefined,
        notes: linkForm.notes || undefined,
      });
      setLinkForm(blankLink());
      setShowLinkForm(false);
      setMessage('Topology link created');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create topology link');
    } finally {
      setSaving(false);
    }
  };

  const createSite = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/topology/sites', { ...siteForm, companyId: siteForm.companyId || undefined });
      setSiteForm(blankSite());
      setShowSiteForm(false);
      setMessage('Topology site created');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create site');
    } finally {
      setSaving(false);
    }
  };

  const updateLinkStatus = async (link: TopologyLink, status: string) => {
    if (link.inferred) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/topology/links/${link.id}`, { status });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update link');
    } finally {
      setSaving(false);
    }
  };

  const saveLayout = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/topology/layout', { positions: nodes.map((node) => ({ assetId: node.id, x: node.x, y: node.y, locked: true })) });
      setDirtyLayout(false);
      setMessage('Topology layout saved');
    } catch (err: any) {
      setError(err.message || 'Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const resetLayout = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/topology/layout/reset', {});
      setDirtyLayout(false);
      setMessage('Topology layout reset');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reset layout');
    } finally {
      setSaving(false);
    }
  };

  const queueAction = async (action: string, payload: Record<string, any> = {}) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const queued = await api.post<DeviceAction>(`/topology/assets/${selected.id}/actions`, { action, payload });
      setActions((current) => [queued, ...current]);
      setMessage(`${action.replaceAll('_', ' ')} queued safely`);
    } catch (err: any) {
      setError(err.message || 'Failed to queue action');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (next: any) => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch('/topology/settings', { ...settings, ...next });
      setSettings(updated);
      setSummary((current: any) => ({ ...current, customerVisible: Boolean(updated.customerVisible), defaultOverlay: updated.defaultOverlay }));
      setMessage('Topology visibility updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update topology settings');
    } finally {
      setSaving(false);
    }
  };

  const createShare = async () => {
    setSaving(true);
    setError('');
    try {
      const share = await api.post('/topology/shares', { name: 'Customer topology review', siteId: siteId || undefined });
      setShares((current) => [share, ...current]);
      setMessage('Share link created');
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setSaving(false);
    }
  };

  const detectChanges = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await api.post('/topology/changes/detect', {});
      setChanges(getListData(result?.changes));
      setMessage(`${result.created || 0} topology changes detected`);
    } catch (err: any) {
      setError(err.message || 'Failed to detect topology changes');
    } finally {
      setSaving(false);
    }
  };

  const exportMap = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      overlay,
      nodes,
      links: visibleLinks,
      changes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network-topology-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Network Visibility</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Network Topology Map</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Live map for devices, ports, LLDP/CDP relationships, topology drift, customer sharing, and safe network actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowLinkForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"><Plus size={16} />Add link</button>
            <button onClick={() => setShowSiteForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><MapPin size={16} />Add site</button>
            <button onClick={saveLayout} disabled={!dirtyLayout || saving} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"><CheckCircle2 size={16} />Save layout</button>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><RefreshCw size={16} />Refresh</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-gray-500"><p className="text-sm font-medium">{label}</p><Icon size={18} /></div>
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      {(showLinkForm || showSiteForm) && (
        <section className="grid gap-4 xl:grid-cols-2">
          {showLinkForm && (
            <form onSubmit={createLink} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-950">Manual Link</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {companies.length > 0 && <CompanySelect value={linkForm.companyId} companies={companies} onChange={(value) => setLinkForm((c) => ({ ...c, companyId: value }))} />}
                <DeviceSelect required value={linkForm.sourceAssetId} nodes={nodes} label="Source device" onChange={(value) => setLinkForm((c) => ({ ...c, sourceAssetId: value }))} />
                <DeviceSelect required value={linkForm.targetAssetId} nodes={nodes} label="Target device" onChange={(value) => setLinkForm((c) => ({ ...c, targetAssetId: value }))} />
                <select value={linkForm.linkType} onChange={(e) => setLinkForm((c) => ({ ...c, linkType: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  {['UPLINK', 'DOWNLINK', 'PEER', 'WAN', 'WIRELESS', 'DEPENDENCY'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input value={linkForm.sourceInterface} onChange={(e) => setLinkForm((c) => ({ ...c, sourceInterface: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Source port" />
                <input value={linkForm.targetInterface} onChange={(e) => setLinkForm((c) => ({ ...c, targetInterface: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Target port" />
                <input type="number" value={linkForm.bandwidthMbps} onChange={(e) => setLinkForm((c) => ({ ...c, bandwidthMbps: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Bandwidth Mbps" />
                <input value={linkForm.notes} onChange={(e) => setLinkForm((c) => ({ ...c, notes: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Notes" />
              </div>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="animate-spin" size={16} />}Save link</button>
            </form>
          )}
          {showSiteForm && (
            <form onSubmit={createSite} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-950">Site or Closet</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {companies.length > 0 && <CompanySelect value={siteForm.companyId} companies={companies} onChange={(value) => setSiteForm((c) => ({ ...c, companyId: value }))} />}
                <input required value={siteForm.name} onChange={(e) => setSiteForm((c) => ({ ...c, name: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Site name" />
                <select value={siteForm.type} onChange={(e) => setSiteForm((c) => ({ ...c, type: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  {['SITE', 'RACK', 'CLOSET', 'ROOM', 'ZONE'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input value={siteForm.address} onChange={(e) => setSiteForm((c) => ({ ...c, address: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Address" />
                <input value={siteForm.notes} onChange={(e) => setSiteForm((c) => ({ ...c, notes: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2" placeholder="Notes" />
              </div>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="animate-spin" size={16} />}Save site</button>
            </form>
          )}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                  <Search size={16} className="text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search devices, IPs, sites" />
                </label>
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">All sites</option>
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
                <select value={overlay} onChange={(e) => setOverlay(e.target.value as OverlayMode)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="health">Health overlay</option>
                  <option value="utilization">Utilization overlay</option>
                  <option value="errors">Packet error overlay</option>
                  <option value="poe">PoE overlay</option>
                  <option value="alerts">Alert overlay</option>
                </select>
                <select value={refreshSec} onChange={(e) => setRefreshSec(Number(e.target.value))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  {refreshOptions.map((item) => <option key={item} value={item}>{item ? `${item}s refresh` : 'Manual refresh'}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={detectChanges} disabled={saving} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"><Activity size={14} />Detect</button>
                <button onClick={resetLayout} disabled={saving} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"><RefreshCw size={14} />Reset</button>
                <button onClick={exportMap} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><Download size={14} />Export</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <Legend color="bg-emerald-500" label="Online" />
              <Legend color="bg-rose-500" label="Offline" />
              <Legend color="bg-amber-500" label="Unknown" />
              <Legend color="bg-blue-500" label="Manual link" />
              <Legend color="bg-slate-500" label="LLDP/CDP/inferred" />
            </div>
          </div>
          <div ref={mapRef} className="overflow-auto bg-slate-50">
            <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                {visibleLinks.map((link) => {
                  const source = nodeById.get(link.sourceAssetId)!;
                  const target = nodeById.get(link.targetAssetId)!;
                  return (
                    <g key={link.id}>
                      <line x1={source.x + 72} y1={source.y + 44} x2={target.x + 72} y2={target.y + 44} stroke={linkColor(link, overlay)} strokeWidth={linkStroke(link, source, target, overlay)} strokeDasharray={link.inferred ? '6 6' : undefined} />
                      <text x={(source.x + target.x) / 2 + 72} y={(source.y + target.y) / 2 + 34} className="fill-gray-500 text-[11px]">{link.discoveredBy || link.linkType}</text>
                    </g>
                  );
                })}
              </svg>
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  onPointerDown={(event) => { if (event.button === 0) setDraggingId(node.id); }}
                  className={`absolute w-36 rounded-lg border bg-white p-3 text-left shadow-sm transition hover:shadow-md ${selected?.id === node.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-md p-2 text-white ${nodeColor(node, overlay)}`}><NodeIcon role={node.role} /></div>
                    {node.impactScore > 0 && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{node.impactScore}</span>}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-950">{node.name}</p>
                  <p className="truncate text-xs text-gray-500">{node.ipAddress || node.location || node.role}</p>
                  <p className="mt-1 text-[11px] font-semibold text-gray-500">{overlayLabel(node, overlay)}</p>
                </button>
              ))}
              {!loading && nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No topology nodes found.</div>}
              {loading && <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading topology...</div>}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-950">Selected Node</h2>
            {selected ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md p-2 text-white ${nodeColor(selected, overlay)}`}><NodeIcon role={selected.role} /></div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-950">{selected.name}</p>
                    <p className="truncate text-xs text-gray-500">{[selected.companyName, selected.location].filter(Boolean).join(' | ')}</p>
                  </div>
                </div>
                <Detail label="IP address" value={selected.ipAddress || '-'} />
                <Detail label="MAC address" value={selected.macAddress || '-'} />
                <Detail label="Model" value={[selected.manufacturer, selected.model].filter(Boolean).join(' ') || '-'} />
                <Detail label="Ports" value={`${selected.portCount || 0} total, ${selected.downPorts || 0} down, ${selected.errorPorts || 0} error`} />
                <Detail label="PoE draw" value={`${Number(selected.poeWatts || 0).toFixed(1)} W`} />
                <Detail label="Alerts" value={`${selected.activeAlerts || 0} active`} />
                <Detail label="Tickets" value={`${selected.openTickets || 0} open`} />
                <Detail label="Firmware" value={[selected.firmwareVersion, selected.latestVersion ? `latest ${selected.latestVersion}` : null, selected.eolStatus].filter(Boolean).join(' | ') || '-'} />
                {selected.healthAt && <Detail label="Last health" value={formatDate(selected.healthAt)} />}
                <div className="border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Safe Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['SYNC_CONTROLLER', 'BACKUP_CONFIG', 'RESTART'].map((item) => <ActionButton key={item} label={item} saving={saving} onClick={() => queueAction(item)} />)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input value={portName} onChange={(e) => setPortName(e.target.value)} className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-primary" placeholder="Port name" />
                    <button disabled={saving || !portName.trim()} onClick={() => queueAction('BOUNCE_POE', { port: portName.trim() })} className="rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-40">PoE</button>
                  </div>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-gray-500">Select a node on the map.</p>}
          </div>

          <Panel title="Interfaces and Neighbors">
            {selectedInterfaces.length === 0 ? <Empty text="No interface metrics yet." /> : selectedInterfaces.slice(0, 12).map((item) => (
              <div key={item.id} className="border-b border-gray-100 p-3 text-sm last:border-b-0">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-gray-950">{item.name || `ifIndex ${item.ifIndex}`}</p><span className={`rounded px-2 py-0.5 text-xs font-semibold ${String(item.status).toLowerCase() === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{item.status || 'unknown'}</span></div>
                <p className="mt-1 text-xs text-gray-500">{[item.speedMbps ? `${item.speedMbps} Mbps` : null, item.vlan ? `VLAN ${item.vlan}` : null, item.poeWatts ? `${item.poeWatts} W PoE` : null].filter(Boolean).join(' | ') || 'No counters'}</p>
                {(item.neighborProtocol || item.connectedMac) && <p className="mt-1 text-xs text-gray-500">{[item.neighborProtocol, item.neighborSystemName, item.neighborPort, item.connectedMac].filter(Boolean).join(' | ')}</p>}
              </div>
            ))}
          </Panel>

          <Panel title="Topology Controls">
            <div className="space-y-3 p-4">
              <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                <span>Customer-visible topology</span>
                <input type="checkbox" checked={Boolean(settings.customerVisible)} onChange={(e) => saveSettings({ customerVisible: e.target.checked })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                <span>Share links enabled</span>
                <input type="checkbox" checked={settings.shareEnabled !== false && settings.shareEnabled !== 0} onChange={(e) => saveSettings({ shareEnabled: e.target.checked })} />
              </label>
              <button onClick={createShare} disabled={saving || settings.shareEnabled === false || settings.shareEnabled === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"><Eye size={16} />Create share link</button>
              {shares.slice(0, 3).map((share) => <p key={share.id} className="break-all rounded bg-gray-50 p-2 text-xs text-gray-600">{`${origin || ''}/topology/shared/${share.token}`}</p>)}
            </div>
          </Panel>

          <Panel title="Recent Actions">
            {selectedActions.length === 0 ? <Empty text="No queued topology actions." /> : selectedActions.map((item) => (
              <div key={item.id} className="border-b border-gray-100 p-3 text-sm last:border-b-0">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-gray-950">{item.action}</p><span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{item.status}</span></div>
                <p className="mt-1 text-xs text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Topology Changes">
            {changes.length === 0 ? <Empty text="No detected topology changes." /> : changes.slice(0, 8).map((item) => (
              <div key={item.id} className="border-b border-gray-100 p-3 text-sm last:border-b-0">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-gray-950">{item.title}</p><span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{item.status}</span></div>
                <p className="mt-1 text-xs text-gray-500">{[item.changeType, item.detectedAt ? formatDate(item.detectedAt) : null].filter(Boolean).join(' | ')}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Topology Links">
            {visibleLinks.length === 0 ? <Empty text="No topology links yet." /> : visibleLinks.slice(0, 20).map((link) => {
              const source = nodeById.get(link.sourceAssetId);
              const target = nodeById.get(link.targetAssetId);
              return (
                <div key={link.id} className="border-b border-gray-100 p-3 text-sm last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-950">{`${source?.name || 'Source'} -> ${target?.name || 'Target'}`}</p>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{link.inferred ? 'INFERRED' : link.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{[link.linkType, link.sourceInterface, link.targetInterface, link.bandwidthMbps ? `${link.bandwidthMbps} Mbps` : null].filter(Boolean).join(' | ')}</p>
                  {!link.inferred && <div className="mt-2 flex gap-2">{['ACTIVE', 'DEGRADED', 'DOWN'].map((item) => <button key={item} disabled={saving || link.status === item} onClick={() => updateLinkStatus(link, item)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:opacity-40">{item}</button>)}</div>}
                </div>
              );
            })}
          </Panel>

          <Panel title="Discovery Queue">
            {discoveries.length === 0 ? <Empty text="No discovery results yet." /> : discoveries.slice(0, 12).map((item) => (
              <div key={item.id} className="border-b border-gray-100 p-3 last:border-b-0">
                <p className="text-sm font-semibold text-gray-950">{item.hostname || item.ipAddress}</p>
                <p className="mt-1 text-xs text-gray-500">{[item.subnet, item.vendor, item.status, item.assetId ? 'Mapped' : 'Unmapped'].filter(Boolean).join(' | ')}</p>
              </div>
            ))}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function CompanySelect({ value, companies, onChange }: { value: string; companies: any[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"><option value="">Current company context</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>;
}

function DeviceSelect({ value, nodes, label, required, onChange }: { value: string; nodes: TopologyNode[]; label: string; required?: boolean; onChange: (value: string) => void }) {
  return <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"><option value="">{label}</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-gray-200 bg-white"><div className="border-b border-gray-200 p-4"><h2 className="text-lg font-semibold text-gray-950">{title}</h2></div><div className="max-h-80 overflow-auto">{children}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-4 text-sm text-gray-500">{text}</div>;
}

function ActionButton({ label, saving, onClick }: { label: string; saving: boolean; onClick: () => void }) {
  return <button disabled={saving} onClick={onClick} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40">{label.replaceAll('_', ' ')}</button>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${color}`} /> {label}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-t border-gray-100 pt-2"><span className="text-gray-500">{label}</span><span className="max-w-[210px] break-words text-right font-medium text-gray-800">{value}</span></div>;
}

function NodeIcon({ role }: { role: string }) {
  if (role === 'firewall') return <Shield size={18} />;
  if (role === 'switch') return <Cable size={18} />;
  if (role === 'ap') return <Wifi size={18} />;
  return <Router size={18} />;
}

function nodeColor(node: TopologyNode, overlay: OverlayMode) {
  if (overlay === 'alerts' && Number(node.activeAlerts || 0) > 0) return 'bg-rose-600';
  if (overlay === 'errors' && Number(node.errorPorts || 0) > 0) return 'bg-amber-600';
  if (overlay === 'poe' && Number(node.poeWatts || 0) > 0) return 'bg-blue-600';
  if (overlay === 'utilization' && Number(node.downPorts || 0) > 0) return 'bg-amber-600';
  if (node.healthStatus === 'ONLINE') return 'bg-emerald-600';
  if (node.healthStatus === 'OFFLINE') return 'bg-rose-600';
  return 'bg-amber-500';
}

function overlayLabel(node: TopologyNode, overlay: OverlayMode) {
  if (overlay === 'alerts') return `${node.activeAlerts || 0} alerts`;
  if (overlay === 'errors') return `${node.errorPorts || 0} error ports`;
  if (overlay === 'poe') return `${Number(node.poeWatts || 0).toFixed(1)} W PoE`;
  if (overlay === 'utilization') return `${node.downPorts || 0}/${node.portCount || 0} ports down`;
  return node.healthStatus;
}

function linkColor(link: TopologyLink, overlay: OverlayMode) {
  if (link.status === 'DOWN') return '#e11d48';
  if (link.status === 'DEGRADED') return '#f59e0b';
  if (overlay === 'utilization' && Number(link.bandwidthMbps || 0) >= 10000) return '#7c3aed';
  if (link.inferred) return '#64748b';
  return '#2563eb';
}

function linkStroke(link: TopologyLink, source: TopologyNode, target: TopologyNode, overlay: OverlayMode) {
  if (overlay === 'alerts' && (Number(source.activeAlerts || 0) || Number(target.activeAlerts || 0))) return 5;
  if (overlay === 'poe' && (Number(source.poeWatts || 0) || Number(target.poeWatts || 0))) return 4;
  if (Number(link.bandwidthMbps || 0) >= 10000) return 4;
  return link.inferred ? 2 : 3;
}
