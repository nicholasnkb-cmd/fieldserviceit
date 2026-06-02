'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Cable, CheckCircle2, GitFork, Loader2, MapPin, Plus, RefreshCw, Router, Search, Shield, Wifi } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

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

export default function TopologyPage() {
  const [summary, setSummary] = useState<any>({});
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [links, setLinks] = useState<TopologyLink[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [siteId, setSiteId] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [linkForm, setLinkForm] = useState(blankLink);
  const [siteForm, setSiteForm] = useState(blankSite);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      setSummary(summaryRes || {});
      setNodes(getListData(mapRes?.nodes));
      setLinks(getListData(mapRes?.links));
      setSites(getListData(mapRes?.sites));
      setDiscoveries(getListData(mapRes?.discoveries));
      setCompanies(getListData(companiesRes));
      if (!selectedId && mapRes?.nodes?.[0]) setSelectedId(mapRes.nodes[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load topology');
    } finally {
      setLoading(false);
    }
  }, [search, selectedId, siteId]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) || nodes[0], [nodes, selectedId]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const visibleLinks = links.filter((link) => nodeById.has(link.sourceAssetId) && nodeById.has(link.targetAssetId));
  const mapWidth = Math.max(1000, ...nodes.map((node) => node.x + 180), 1000);
  const mapHeight = Math.max(560, ...nodes.map((node) => node.y + 120), 560);

  const metrics = [
    { label: 'Nodes', value: summary.nodes || 0, icon: Router },
    { label: 'Links', value: summary.links || visibleLinks.length, icon: GitFork },
    { label: 'Online', value: summary.online || 0, icon: CheckCircle2 },
    { label: 'Active alerts', value: summary.activeAlerts || 0, icon: AlertTriangle },
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

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Network Visibility</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Network Topology Map</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Map firewalls, routers, switches, APs, uplinks, sites, health, and impact paths from network assets and monitoring data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowLinkForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              Add link
            </button>
            <button onClick={() => setShowSiteForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <MapPin size={16} />
              Add site
            </button>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

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

      {(showLinkForm || showSiteForm) && (
        <section className="grid gap-4 xl:grid-cols-2">
          {showLinkForm && (
            <form onSubmit={createLink} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-950">Manual Link</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {companies.length > 0 && <CompanySelect value={linkForm.companyId} companies={companies} onChange={(value) => setLinkForm((c) => ({ ...c, companyId: value }))} />}
                <select required value={linkForm.sourceAssetId} onChange={(e) => setLinkForm((c) => ({ ...c, sourceAssetId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">Source device</option>
                  {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
                </select>
                <select required value={linkForm.targetAssetId} onChange={(e) => setLinkForm((c) => ({ ...c, targetAssetId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">Target device</option>
                  {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
                </select>
                <select value={linkForm.linkType} onChange={(e) => setLinkForm((c) => ({ ...c, linkType: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  {['UPLINK', 'DOWNLINK', 'PEER', 'WAN', 'WIRELESS', 'DEPENDENCY'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input value={linkForm.sourceInterface} onChange={(e) => setLinkForm((c) => ({ ...c, sourceInterface: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Source port" />
                <input value={linkForm.targetInterface} onChange={(e) => setLinkForm((c) => ({ ...c, targetInterface: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Target port" />
                <input type="number" value={linkForm.bandwidthMbps} onChange={(e) => setLinkForm((c) => ({ ...c, bandwidthMbps: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Bandwidth Mbps" />
                <input value={linkForm.notes} onChange={(e) => setLinkForm((c) => ({ ...c, notes: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Notes" />
              </div>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="animate-spin" size={16} />}
                Save link
              </button>
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
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="animate-spin" size={16} />}
                Save site
              </button>
            </form>
          )}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search devices, IPs, sites" />
              </label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">All sites</option>
                {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <Legend color="bg-emerald-500" label="Online" />
              <Legend color="bg-rose-500" label="Offline" />
              <Legend color="bg-amber-500" label="Unknown" />
              <Legend color="bg-blue-500" label="Manual link" />
            </div>
          </div>
          <div className="overflow-auto bg-slate-50">
            <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                {visibleLinks.map((link) => {
                  const source = nodeById.get(link.sourceAssetId)!;
                  const target = nodeById.get(link.targetAssetId)!;
                  return (
                    <g key={link.id}>
                      <line
                        x1={source.x + 72}
                        y1={source.y + 44}
                        x2={target.x + 72}
                        y2={target.y + 44}
                        stroke={linkColor(link)}
                        strokeWidth={link.inferred ? 2 : 3}
                        strokeDasharray={link.inferred ? '6 6' : undefined}
                      />
                      <text x={(source.x + target.x) / 2 + 72} y={(source.y + target.y) / 2 + 34} className="fill-gray-500 text-[11px]">
                        {link.linkType}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className={`absolute w-36 rounded-lg border bg-white p-3 text-left shadow-sm transition hover:shadow-md ${selected?.id === node.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-md p-2 text-white ${nodeColor(node.healthStatus)}`}>
                      <NodeIcon role={node.role} />
                    </div>
                    {node.impactScore > 0 && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{node.impactScore}</span>}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-950">{node.name}</p>
                  <p className="truncate text-xs text-gray-500">{node.ipAddress || node.location || node.role}</p>
                  <p className="mt-1 text-[11px] font-semibold text-gray-500">{node.healthStatus}</p>
                </button>
              ))}
              {!loading && nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No topology nodes found.</div>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading topology...</div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-950">Selected Node</h2>
            {selected ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md p-2 text-white ${nodeColor(selected.healthStatus)}`}><NodeIcon role={selected.role} /></div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-950">{selected.name}</p>
                    <p className="truncate text-xs text-gray-500">{[selected.companyName, selected.location].filter(Boolean).join(' | ')}</p>
                  </div>
                </div>
                <Detail label="IP address" value={selected.ipAddress || '-'} />
                <Detail label="MAC address" value={selected.macAddress || '-'} />
                <Detail label="Model" value={[selected.manufacturer, selected.model].filter(Boolean).join(' ') || '-'} />
                <Detail label="Ports" value={`${selected.portCount || 0} total, ${selected.downPorts || 0} down`} />
                <Detail label="Alerts" value={`${selected.activeAlerts || 0} active`} />
                <Detail label="Tickets" value={`${selected.openTickets || 0} open`} />
                <Detail label="Firmware" value={[selected.firmwareVersion, selected.latestVersion ? `latest ${selected.latestVersion}` : null, selected.eolStatus].filter(Boolean).join(' | ') || '-'} />
                {selected.healthAt && <Detail label="Last health" value={formatDate(selected.healthAt)} />}
              </div>
            ) : <p className="mt-3 text-sm text-gray-500">Select a node on the map.</p>}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-950">Topology Links</h2>
            </div>
            <div className="max-h-80 divide-y divide-gray-100 overflow-auto">
              {visibleLinks.length === 0 ? <div className="p-4 text-sm text-gray-500">No topology links yet.</div> : visibleLinks.map((link) => {
                const source = nodeById.get(link.sourceAssetId);
                const target = nodeById.get(link.targetAssetId);
                return (
                  <div key={link.id} className="p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-950">{`${source?.name || 'Source'} -> ${target?.name || 'Target'}`}</p>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{link.inferred ? 'INFERRED' : link.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{[link.linkType, link.sourceInterface, link.targetInterface, link.bandwidthMbps ? `${link.bandwidthMbps} Mbps` : null].filter(Boolean).join(' | ')}</p>
                    {!link.inferred && (
                      <div className="mt-2 flex gap-2">
                        {['ACTIVE', 'DEGRADED', 'DOWN'].map((item) => (
                          <button key={item} disabled={saving || link.status === item} onClick={() => updateLinkStatus(link, item)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:opacity-40">{item}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-950">Discovery Queue</h2>
            </div>
            <div className="max-h-64 divide-y divide-gray-100 overflow-auto">
              {discoveries.length === 0 ? <div className="p-4 text-sm text-gray-500">No discovery results yet.</div> : discoveries.slice(0, 20).map((item) => (
                <div key={item.id} className="p-4">
                  <p className="text-sm font-semibold text-gray-950">{item.hostname || item.ipAddress}</p>
                  <p className="mt-1 text-xs text-gray-500">{[item.subnet, item.vendor, item.status, item.assetId ? 'Mapped' : 'Unmapped'].filter(Boolean).join(' | ')}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function CompanySelect({ value, companies, onChange }: { value: string; companies: any[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
      <option value="">Current company context</option>
      {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
    </select>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${color}`} /> {label}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-gray-100 pt-2">
      <span className="text-gray-500">{label}</span>
      <span className="max-w-[210px] break-words text-right font-medium text-gray-800">{value}</span>
    </div>
  );
}

function NodeIcon({ role }: { role: string }) {
  if (role === 'firewall') return <Shield size={18} />;
  if (role === 'switch') return <Cable size={18} />;
  if (role === 'ap') return <Wifi size={18} />;
  return <Router size={18} />;
}

function nodeColor(status: string) {
  if (status === 'ONLINE') return 'bg-emerald-600';
  if (status === 'OFFLINE') return 'bg-rose-600';
  return 'bg-amber-500';
}

function linkColor(link: TopologyLink) {
  if (link.status === 'DOWN') return '#e11d48';
  if (link.status === 'DEGRADED') return '#f59e0b';
  if (link.inferred) return '#64748b';
  return '#2563eb';
}
