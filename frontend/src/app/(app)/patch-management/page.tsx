'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { api, getListData } from '../../../lib/api';

export default function PatchManagementPage() {
  const [summary, setSummary] = useState<any>({});
  const [inventory, setInventory] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assetId, setAssetId] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);
  const [policy, setPolicy] = useState({ name: '', osFamily: 'ALL', delayDays: 0, maintenanceWindow: '', rebootAllowed: false });

  const load = useCallback(async () => {
    setError('');
    try {
      const [summaryData, inventoryData, policyData, jobData, assetData] = await Promise.all([
        api.get('/endpoint-operations/patches/summary'),
        api.get('/endpoint-operations/patches/inventory?status=MISSING'),
        api.get('/endpoint-operations/patches/policies'),
        api.get('/endpoint-operations/patches/jobs'),
        api.get('/assets?limit=200'),
      ]);
      setSummary(summaryData || {});
      setInventory(getListData(inventoryData));
      setPolicies(getListData(policyData));
      setJobs(getListData(jobData));
      setAssets(getListData(assetData));
    } catch (err: any) {
      setError(err.message || 'Unable to load patch management');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleInventory = useMemo(() => assetId ? inventory.filter((item) => item.assetId === assetId) : inventory, [assetId, inventory]);

  const createPolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/endpoint-operations/patches/policies', { ...policy, severities: ['CRITICAL', 'IMPORTANT'] });
      setPolicy({ name: '', osFamily: 'ALL', delayDays: 0, maintenanceWindow: '', rebootAllowed: false });
      setShowPolicy(false);
      setMessage('Patch policy created');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to create policy');
    }
  };

  const deploy = async () => {
    if (!assetId || !selected.length) {
      setError('Select an asset and at least one patch');
      return;
    }
    try {
      await api.post('/endpoint-operations/patches/jobs', { assetId, policyId: policyId || undefined, patchKeys: selected });
      setSelected([]);
      setMessage('Patch installation command queued for the device');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to queue patch job');
    }
  };

  const metrics = [
    ['Missing patches', summary.missing || 0],
    ['Critical missing', summary.criticalMissing || 0],
    ['Active policies', summary.activePolicies || 0],
    ['Active jobs', summary.activeJobs || 0],
  ];

  return (
    <div className="space-y-6 p-6">
      <section className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Endpoint Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Patch Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Track missing Windows, macOS, and Linux updates, define approval policies, and queue installation commands to enrolled devices.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPolicy((value) => !value)} className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> New policy</button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700"><RefreshCw size={16} /> Refresh</button>
        </div>
      </section>

      {error && <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
      </section>

      {showPolicy && (
        <form onSubmit={createPolicy} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-2">
          <input required value={policy.name} onChange={(e) => setPolicy({ ...policy, name: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Policy name" />
          <select value={policy.osFamily} onChange={(e) => setPolicy({ ...policy, osFamily: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
            {['ALL', 'WINDOWS', 'MACOS', 'LINUX'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input type="number" min="0" max="90" value={policy.delayDays} onChange={(e) => setPolicy({ ...policy, delayDays: Number(e.target.value) })} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Approval delay days" />
          <input value={policy.maintenanceWindow} onChange={(e) => setPolicy({ ...policy, maintenanceWindow: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Maintenance window, e.g. Sat 02:00-05:00" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={policy.rebootAllowed} onChange={(e) => setPolicy({ ...policy, rebootAllowed: e.target.checked })} /> Allow reboot when required</label>
          <button className="w-fit rounded bg-primary px-4 py-2 text-sm font-semibold text-white">Create policy</button>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex-1 text-sm font-medium text-gray-700">Target asset
            <select value={assetId} onChange={(e) => { setAssetId(e.target.value); setSelected([]); }} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="">All assets</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} {asset.os ? `(${asset.os})` : ''}</option>)}
            </select>
          </label>
          <label className="flex-1 text-sm font-medium text-gray-700">Policy
            <select value={policyId} onChange={(e) => setPolicyId(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
              <option value="">No policy override</option>
              {policies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button onClick={deploy} disabled={!assetId || !selected.length} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Download size={16} /> Deploy selected ({selected.length})
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4"><h2 className="font-semibold text-gray-950">Missing patch inventory</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr>{['', 'Asset', 'Patch', 'Severity', 'Released', 'Reboot'].map((item, index) => <th key={`${item}-${index}`} className="px-4 py-3">{item}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200">
              {visibleInventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3"><input type="checkbox" disabled={Boolean(assetId && item.assetId !== assetId)} checked={selected.includes(item.patchKey)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, item.patchKey] : current.filter((key) => key !== item.patchKey))} /></td>
                  <td className="px-4 py-3 font-medium">{item.assetName}</td>
                  <td className="px-4 py-3"><p className="font-medium">{item.patchKey}</p><p className="text-xs text-gray-500">{item.title}</p></td>
                  <td className="px-4 py-3">{item.severity}</td>
                  <td className="px-4 py-3">{item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">{item.requiresReboot ? 'Required' : 'No'}</td>
                </tr>
              ))}
              {!visibleInventory.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No missing patches reported. Enrolled agents and RMM syncs can submit inventory through the patch API.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> Policies</h2>
          <div className="mt-3 space-y-2">{policies.map((item) => <div key={item.id} className="rounded border border-gray-100 p-3 text-sm"><p className="font-medium">{item.name}</p><p className="text-gray-500">{item.osFamily} · {item.delayDays} day delay · {item.maintenanceWindow || 'Any window'}</p></div>)}{!policies.length && <p className="text-sm text-gray-500">No patch policies configured.</p>}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">Deployment jobs</h2>
          <div className="mt-3 space-y-2">{jobs.slice(0, 10).map((item) => <div key={item.id} className="rounded border border-gray-100 p-3 text-sm"><div className="flex justify-between"><p className="font-medium">{item.assetName}</p><span>{item.status}</span></div><p className="text-gray-500">{item.patchKeys?.length || 0} patches · {new Date(item.createdAt).toLocaleString()}</p></div>)}{!jobs.length && <p className="text-sm text-gray-500">No deployment jobs queued.</p>}</div>
        </div>
      </section>
    </div>
  );
}
