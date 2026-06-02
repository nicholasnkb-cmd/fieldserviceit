'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { Cable, Loader2, Router, Shield, Wifi } from 'lucide-react';
import { api, getListData } from '../../../../../lib/api';

type PublicNode = {
  id: string;
  name: string;
  role: string;
  location?: string;
  healthStatus: string;
  activeAlerts?: number;
  x: number;
  y: number;
};

type PublicLink = {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  linkType: string;
  status: string;
  inferred?: boolean;
};

export default function PublicTopologyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/public/topology/shares/${token}`, { skipAuth: true })
      .then(setData)
      .catch((err) => setError(err.message || 'Shared topology is not available'))
      .finally(() => setLoading(false));
  }, [token]);

  const nodes = getListData<PublicNode>(data?.nodes);
  const links = getListData<PublicLink>(data?.links);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const mapWidth = Math.max(1000, ...nodes.map((node) => node.x + 180), 1000);
  const mapHeight = Math.max(560, ...nodes.map((node) => node.y + 120), 560);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <div className="border-b border-gray-200 pb-4">
          <p className="text-xs font-semibold uppercase text-primary">Shared Network View</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">{data?.name || 'Network Topology'}</h1>
          <p className="mt-2 text-sm text-gray-600">Read-only topology health and link status for customer review.</p>
        </div>
        {loading && <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600"><Loader2 className="animate-spin" size={16} /> Loading shared topology...</div>}
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {!loading && !error && (
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap gap-3 border-b border-gray-200 p-4 text-xs text-gray-500">
              <Legend color="bg-emerald-500" label="Online" />
              <Legend color="bg-rose-500" label="Offline" />
              <Legend color="bg-amber-500" label="Unknown" />
            </div>
            <div className="overflow-auto bg-white">
              <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
                <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                  {links.map((link) => {
                    const source = nodeById.get(link.sourceAssetId);
                    const target = nodeById.get(link.targetAssetId);
                    if (!source || !target) return null;
                    return <line key={link.id} x1={source.x + 72} y1={source.y + 44} x2={target.x + 72} y2={target.y + 44} stroke={link.status === 'DOWN' ? '#e11d48' : link.inferred ? '#64748b' : '#2563eb'} strokeWidth={link.inferred ? 2 : 3} strokeDasharray={link.inferred ? '6 6' : undefined} />;
                  })}
                </svg>
                {nodes.map((node) => (
                  <div key={node.id} className="absolute w-36 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm" style={{ left: node.x, top: node.y }}>
                    <div className={`inline-flex rounded-md p-2 text-white ${nodeColor(node.healthStatus)}`}><NodeIcon role={node.role} /></div>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-950">{node.name}</p>
                    <p className="truncate text-xs text-gray-500">{node.location || node.role}</p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">{node.healthStatus}</p>
                  </div>
                ))}
                {nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No topology nodes are available for this share.</div>}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${color}`} /> {label}</span>;
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
