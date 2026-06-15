'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { useToast } from '../../../../components/ui/Toast';
import { RequireCompanyContext } from '../../../../components/layout/RequireCompanyContext';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { RefreshCw } from 'lucide-react';
import { trackProductEvent } from '../../../../lib/analytics';

interface RmmConfig {
  id: string;
  provider: string;
  isActive: boolean;
  syncIntervalMin: number;
  lastSyncAt: string | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
  lastTestStatus?: string | null;
  lastTestAt?: string | null;
  createdAt: string;
  hasCredentials?: boolean;
}

interface RmmSyncRun {
  id: string;
  provider: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  assetsCreated?: number;
  assetsUpdated?: number;
  assetsSkipped?: number;
  errorMessage?: string | null;
}

interface ProviderDefinition {
  name: string;
  label: string;
  helpText: string;
  credentialFields: { key: string; label: string; type?: string; required?: boolean; placeholder?: string }[];
}

export default function RmmIntegrationPage() {
  const [providers, setProviders] = useState<string[]>([]);
  const [providerDefinitions, setProviderDefinitions] = useState<ProviderDefinition[]>([]);
  const [configs, setConfigs] = useState<RmmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [syncInterval, setSyncInterval] = useState(60);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<RmmSyncRun[]>([]);
  const { user, activeCompanyContext } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'BUSINESS') { router.push('/my-tickets'); return; }
    if (user.role === 'SUPER_ADMIN' && !activeCompanyContext) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get('/integrations/rmm/providers'),
      api.get('/integrations/rmm/configs'),
      api.get('/integrations/rmm/sync-history').catch(() => []),
    ]).then(([provData, configData, historyData]) => {
      setProviders(provData.providers);
      setProviderDefinitions(provData.definitions || []);
      setConfigs(configData);
      setHistory(historyData || []);
    }).catch((err) => setMessage(err.message || 'Unable to load RMM integrations')).finally(() => setLoading(false));
  }, [activeCompanyContext, router, user]);

  const openConfig = (provider: string) => {
    const existing = configs.find((c) => c.provider === provider);
    setShowConfig(provider);
    setConfigForm({});
    setSyncInterval(existing?.syncIntervalMin || 60);
    setMessage('');
  };

  const refreshRmm = async () => {
    const [configData, historyData] = await Promise.all([
      api.get('/integrations/rmm/configs'),
      api.get('/integrations/rmm/sync-history').catch(() => []),
    ]);
    setConfigs(configData);
    setHistory(historyData || []);
  };

  const testCurrentConfig = async () => {
    if (!showConfig) return;
    setTesting(`draft:${showConfig}`);
    setMessage('');
    try {
      const result = await api.post('/integrations/rmm/configs/test', {
        provider: showConfig,
        credentials: configForm,
      });
      const text = result.message || (result.status === 'PASS' ? 'Connection test passed' : 'Connection test failed');
      trackProductEvent('rmm_test', { provider: showConfig, status: result.status });
      setMessage(text);
      toast(result.status === 'PASS' ? 'success' : 'error', text);
    } catch (err: any) {
      setMessage(err.message || 'Connection test failed');
      toast('error', err.message || 'Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const testSavedConfig = async (provider: string) => {
    setTesting(provider);
    setMessage('');
    try {
      const result = await api.post(`/integrations/rmm/configs/${provider}/test`, {});
      await refreshRmm();
      const text = result.message || (result.status === 'PASS' ? `${provider} connection passed` : `${provider} connection failed`);
      trackProductEvent('rmm_test', { provider, status: result.status });
      setMessage(text);
      toast(result.status === 'PASS' ? 'success' : 'error', text);
    } catch (err: any) {
      setMessage(err.message || 'Connection test failed');
      toast('error', err.message || 'Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfig) return;
    setSaving(true);
    try {
      const saved = await api.post(`/integrations/rmm/configs`, {
        provider: showConfig,
        credentials: configForm,
        syncIntervalMin: syncInterval,
      });
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.provider === showConfig);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setShowConfig(null);
      trackProductEvent('rmm_configuration_saved', { provider: showConfig });
      toast('success', 'RMM configuration saved');
    } catch (err: any) {
      toast('error', err.message);
      setMessage(err.message || 'Unable to save RMM configuration');
    } finally {
      setSaving(false);
    }
  };

  const removeConfig = async (provider: string) => {
    if (!confirm(`Deactivate ${provider} configuration?`)) return;
    try {
      await api.delete(`/integrations/rmm/configs/${provider}`);
      setConfigs(configs.filter((c) => c.provider !== provider));
      toast('success', 'Configuration deactivated');
    } catch (err: any) {
      toast('error', err.message);
      setMessage(err.message || 'Unable to remove RMM configuration');
    }
  };

  const syncNow = async (provider: string) => {
    setSyncing(provider);
    try {
      const result = await api.post(`/integrations/rmm/sync-now/${provider}`, {});
      if (result.synced) {
        trackProductEvent('rmm_sync', { provider, status: 'success' });
        toast('success', `Sync triggered for ${provider}`);
        await refreshRmm();
      } else {
        trackProductEvent('rmm_sync', { provider, status: 'failed' });
        toast('error', result.error || 'Sync failed');
      }
    } catch (err: any) {
      toast('error', err.message);
      setMessage(err.message || 'Unable to sync RMM provider');
    } finally {
      setSyncing(null);
    }
  };

  const providerLabels: Record<string, string> = {
    connectwise: 'ConnectWise',
    datto: 'Datto',
    ninjaone: 'NinjaOne',
    atera: 'Atera',
    syncro: 'Syncro',
    kaseya: 'Kaseya VSA',
    nable: 'N-able N-sight',
  };

  const providerHelp: Record<string, string> = {
    connectwise: 'Requires a ConnectWise company ID, API public/private keys, and a client ID from developer settings.',
    datto: 'Requires a Datto API token. Site ID is optional but recommended to scope syncs to one site.',
    ninjaone: 'Requires a NinjaOne OAuth client ID, client secret, and instance URL.',
    atera: 'Requires an Atera API key. The standard API v3 URL is used unless overridden.',
    syncro: 'Requires a Syncro API token and account subdomain or API base URL.',
    kaseya: 'Requires a Kaseya VSA instance URL and API bearer token.',
    nable: 'Requires an N-able API service URL and token. The devices path can be customized per tenant.',
  };

  const credentialFields: Record<string, {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
  }[]> = {
    connectwise: [
      { key: 'baseUrl', label: 'Manage API URL', required: true },
      { key: 'companyId', label: 'Company ID', required: true },
      { key: 'publicKey', label: 'Public Key', required: true },
      { key: 'privateKey', label: 'Private Key', type: 'password', required: true },
      { key: 'clientId', label: 'Client ID', type: 'password', required: true },
    ],
    datto: [
      { key: 'apiToken', label: 'API Token', type: 'password' },
      { key: 'siteId', label: 'Site ID' },
    ],
    ninjaone: [
      { key: 'instanceUrl', label: 'Instance URL', required: true },
      { key: 'clientId', label: 'OAuth Client ID', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'scope', label: 'OAuth Scope' },
    ],
    atera: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'baseUrl', label: 'API Base URL' },
    ],
    syncro: [
      { key: 'apiToken', label: 'API Token', type: 'password' },
      { key: 'subdomain', label: 'Account Subdomain' },
      { key: 'baseUrl', label: 'API Base URL' },
    ],
    kaseya: [
      { key: 'baseUrl', label: 'VSA Instance URL' },
      { key: 'apiToken', label: 'API Token', type: 'password' },
    ],
    nable: [
      { key: 'baseUrl', label: 'API Service URL' },
      { key: 'apiToken', label: 'API Token', type: 'password' },
      { key: 'devicesPath', label: 'Devices Path' },
    ],
  };

  const definitionFor = (provider: string) => providerDefinitions.find((item) => item.name === provider);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <RequireCompanyContext area="RMM integrations">
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">RMM Integrations</h1>
      {message && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}

      <div className="grid gap-4 mb-8">
        {providers.map((provider) => {
          const config = configs.find((c) => c.provider === provider);
          return (
            <div key={provider} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{definitionFor(provider)?.label || providerLabels[provider] || provider}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {config
                      ? `Configured ${config.isActive ? '(active)' : '(inactive)'} — Sync every ${config.syncIntervalMin}min`
                      : 'Not configured'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{definitionFor(provider)?.helpText || providerHelp[provider]}</p>
                  {config?.lastSyncAt && (
                    <p className="text-xs text-gray-400">Last sync: {new Date(config.lastSyncAt).toLocaleString()}</p>
                  )}
                  {config?.lastSyncStatus && (
                    <p className="text-xs text-gray-400">Sync status: {config.lastSyncStatus}{config.lastSyncMessage ? ` - ${config.lastSyncMessage}` : ''}</p>
                  )}
                  {config?.lastTestStatus && (
                    <p className="text-xs text-gray-400">Last test: {config.lastTestStatus}{config.lastTestAt ? ` at ${new Date(config.lastTestAt).toLocaleString()}` : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openConfig(provider)}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">
                    {config ? 'Edit' : 'Configure'}
                  </button>
                  {config && (
                    <>
                      <button onClick={() => testSavedConfig(provider)} disabled={testing === provider}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50">
                        {testing === provider ? 'Testing...' : 'Test'}
                      </button>
                      <button onClick={() => syncNow(provider)} disabled={syncing === provider}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50">
                        {syncing === provider ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button onClick={() => removeConfig(provider)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100">Remove</button>
                    </>
                  )}
                </div>
              </div>

              {showConfig === provider && (
                <form onSubmit={saveConfig} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <p className="rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    Secrets are encrypted before storage. Existing secrets stay hidden; enter new values only when rotating credentials.
                  </p>
                  {(definitionFor(provider)?.credentialFields || credentialFields[provider] || []).map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                      <input type={field.type || 'text'} placeholder={field.placeholder} required={field.required && !configs.some((item) => item.provider === provider && item.hasCredentials)} value={configForm[field.key] || ''}
                        onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sync Interval (minutes)</label>
                    <input type="number" min={5} max={10080} value={syncInterval}
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      className="mt-1 block w-48 rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={testCurrentConfig} disabled={testing === `draft:${provider}`}
                      className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100 disabled:opacity-50">
                      {testing === `draft:${provider}` ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button type="submit" disabled={saving}
                      className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button type="button" onClick={() => setShowConfig(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
      <section className="rounded border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-950">Recent sync history</h2>
        <div className="mt-4 overflow-hidden rounded border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Started', 'Provider', 'Status', 'Created', 'Updated', 'Skipped', 'Message'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{providerLabels[run.provider] || run.provider}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{run.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{run.assetsCreated || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{run.assetsUpdated || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{run.assetsSkipped || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{run.errorMessage || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={7} className="p-4"><EmptyState icon={RefreshCw} title="No RMM sync runs yet" description="Configure a provider, pass its connection test, then run the first synchronization." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </RequireCompanyContext>
  );
}
