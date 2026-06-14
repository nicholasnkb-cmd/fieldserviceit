'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, MonitorUp, Plus, RefreshCw } from 'lucide-react';
import { api, getListData } from '../../../lib/api';

const providers = ['ANYDESK', 'SPLASHTOP', 'TEAMVIEWER', 'SCREENCONNECT'];

export default function RemoteAccessPage() {
  const [summary, setSummary] = useState<any>({});
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ assetId: '', provider: 'ANYDESK', externalDeviceId: '', launchUrl: '' });

  const load = useCallback(async () => {
    setError('');
    try {
      const [summaryData, endpointData, sessionData, assetData] = await Promise.all([
        api.get('/endpoint-operations/remote-access/summary'),
        api.get('/endpoint-operations/remote-access/endpoints'),
        api.get('/endpoint-operations/remote-access/sessions'),
        api.get('/assets?limit=100'),
      ]);
      setSummary(summaryData || {});
      setEndpoints(getListData(endpointData));
      setSessions(getListData(sessionData));
      setAssets(getListData(assetData));
    } catch (err: any) {
      setError(err.message || 'Unable to load remote access');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/endpoint-operations/remote-access/endpoints', form);
      setForm({ assetId: '', provider: 'ANYDESK', externalDeviceId: '', launchUrl: '' });
      setShowForm(false);
      setMessage('Remote access endpoint saved');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save endpoint');
    } finally {
      setSaving(false);
    }
  };

  const launch = async (endpoint: any) => {
    setError('');
    try {
      const session = await api.post(`/endpoint-operations/remote-access/endpoints/${endpoint.id}/session`, {});
      setMessage(`${endpoint.provider} session launched for ${endpoint.assetName}`);
      window.location.assign(session.launchUrl);
    } catch (err: any) {
      setError(err.message || 'Unable to launch remote session');
    }
  };

  const metrics = [
    ['Configured endpoints', summary.totalEndpoints || 0],
    ['Enabled endpoints', summary.enabledEndpoints || 0],
    ['Sessions, 30 days', summary.sessionsLast30Days || 0],
    ['Supported providers', summary.supportedProviders?.length || providers.length],
  ];

  return (
    <div className="space-y-6 p-6">
      <section className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Endpoint Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Remote Access</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Launch provider-managed support sessions while keeping an auditable history in FieldserviceIT.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Configure endpoint
          </button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {error && <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      {showForm && (
        <form onSubmit={save} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-2">
          <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select an asset</option>
            {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} {asset.os ? `(${asset.os})` : ''}</option>)}
          </select>
          <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
            {providers.map((provider) => <option key={provider}>{provider}</option>)}
          </select>
          <input required value={form.externalDeviceId} onChange={(e) => setForm({ ...form, externalDeviceId: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Provider device or session ID" />
          <input required value={form.launchUrl} onChange={(e) => setForm({ ...form, launchUrl: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="https://provider.example/session/... or provider protocol URL" />
          <p className="text-xs text-gray-500 lg:col-span-2">Use the launch URL supplied by the remote-access provider. FieldserviceIT records the launch but does not store provider passwords.</p>
          <button disabled={saving} className="w-fit rounded bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save endpoint'}</button>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-semibold text-gray-950">Managed endpoints</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>{['Asset', 'Provider', 'Device ID', 'Enrollment', 'Last check-in', 'Action'].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{endpoint.assetName}</td>
                  <td className="px-4 py-3">{endpoint.provider}</td>
                  <td className="px-4 py-3">{endpoint.externalDeviceId}</td>
                  <td className="px-4 py-3">{endpoint.enrollmentStatus || 'Unknown'}</td>
                  <td className="px-4 py-3">{endpoint.lastCheckInAt ? new Date(endpoint.lastCheckInAt).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => launch(endpoint)} className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 font-semibold text-white">
                      <MonitorUp size={15} /> Connect <ExternalLink size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!endpoints.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No remote-access endpoints configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-950">Recent session launches</h2>
        <div className="mt-3 space-y-2">
          {sessions.slice(0, 10).map((session) => (
            <div key={session.id} className="flex flex-wrap justify-between gap-2 rounded border border-gray-100 px-3 py-2 text-sm">
              <span>{session.assetName} via {session.provider}</span>
              <span className="text-gray-500">{session.requestedByEmail || 'Unknown user'} · {new Date(session.requestedAt).toLocaleString()}</span>
            </div>
          ))}
          {!sessions.length && <p className="text-sm text-gray-500">No sessions have been launched.</p>}
        </div>
      </section>
    </div>
  );
}
