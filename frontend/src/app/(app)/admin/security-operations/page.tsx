'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity, CheckCircle2, CloudCog, DatabaseBackup, KeyRound, Loader2,
  Play, RefreshCw, Save, ServerCog, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { api, getListData } from '../../../../lib/api';
import { formatDate } from '../../../../lib/utils';
import { useAuthStore } from '../../../../stores/authStore';

type Tab = 'overview' | 'identity' | 'backups' | 'retention' | 'approvals';

const defaultOidc = {
  name: '', issuer: '', clientId: '', clientSecret: '', allowedDomains: '',
  autoProvision: false, defaultRole: 'CLIENT', enabled: false,
};

export default function SecurityOperationsPage() {
  const { user } = useAuthStore();
  const isSuper = user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<any>({});
  const [policy, setPolicy] = useState<any>({});
  const [policyHistory, setPolicyHistory] = useState<any[]>([]);
  const [backupPolicy, setBackupPolicy] = useState<any>({});
  const [retention, setRetention] = useState<any>({});
  const [backups, setBackups] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [scans, setScans] = useState<any>({});
  const [oidc, setOidc] = useState<any>(defaultOidc);
  const [editingOidcId, setEditingOidcId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [stepUpCode, setStepUpCode] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const common = await Promise.all([
        api.get('/platform-security/oidc'),
        api.get('/platform-security/approvals'),
      ]);
      setProviders(getListData(common[0]));
      setApprovals(getListData(common[1]));
      if (isSuper) {
        const [dashboardResult, policyResult, policyHistoryResult, backupPolicyResult, backupResult, retentionResult, scanResult] = await Promise.all([
          api.get('/platform-security/dashboard'),
          api.get('/platform-security/policy'),
          api.get('/platform-security/policy/history'),
          api.get('/platform-security/backups/policy'),
          api.get('/platform-security/backups'),
          api.get('/platform-security/retention'),
          api.get('/platform-security/scans'),
        ]);
        setDashboard(dashboardResult || {});
        setPolicy(policyResult || {});
        setPolicyHistory(getListData(policyHistoryResult));
        setBackupPolicy(backupPolicyResult || {});
        setBackups(getListData(backupResult));
        setRetention(retentionResult || {});
        setScans(scanResult || {});
      }
    } catch (err: any) {
      setError(err.message || 'Security operations could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [isSuper, user]);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, work: () => Promise<any>, success: string) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      await load();
    } catch (err: any) {
      setError(err.message || 'The operation failed');
    } finally {
      setBusy('');
    }
  };

  const savePolicy = () => run('policy', () => api.patch('/platform-security/policy', policy), 'Security policy saved');
  const saveBackupPolicy = () => run('backup-policy', () => api.patch('/platform-security/backups/policy', backupPolicy), 'Backup schedule saved');
  const saveRetention = () => run('retention-policy', () => api.patch('/platform-security/retention', retention), 'Retention policy saved');
  const verifyStepUp = () => run('step-up', () => api.post('/auth/step-up', { code: stepUpCode }), 'Sensitive actions unlocked for 10 minutes');

  const saveOidc = async (event: React.FormEvent) => {
    event.preventDefault();
    await run('oidc', () => editingOidcId
      ? api.patch(`/platform-security/oidc/${editingOidcId}`, oidc)
      : api.post('/platform-security/oidc', oidc), 'OIDC provider saved');
    setOidc(defaultOidc);
    setEditingOidcId('');
  };

  const editOidc = (provider: any) => {
    setEditingOidcId(provider.id);
    setOidc({
      name: provider.name || '',
      issuer: provider.issuer || '',
      clientId: provider.clientId || '',
      clientSecret: '',
      allowedDomains: (provider.allowedDomains || []).join(', '),
      autoProvision: Boolean(provider.autoProvision),
      defaultRole: provider.defaultRole || 'CLIENT',
      enabled: Boolean(provider.enabled),
      companyId: provider.companyId || '',
    });
    setTab('identity');
  };

  const tabs: Array<[Tab, string]> = [
    ['overview', 'Overview'],
    ['identity', 'Identity'],
    ...(isSuper ? [['backups', 'Backups'], ['retention', 'Retention']] as Array<[Tab, string]> : []),
    ['approvals', `Approvals${approvals.length ? ` (${approvals.length})` : ''}`],
  ];

  return (
    <div className="space-y-6 p-6">
      <header className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Platform administration</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Security Operations</h1>
            <p className="mt-2 text-sm text-gray-600">Identity controls, encrypted recovery, retention, scanner health, and independent approvals.</p>
          </div>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {isSuper && (
        <div className="flex flex-col gap-2 border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-semibold text-amber-950">Fresh MFA verification
            <input value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} placeholder="Authenticator or recovery code" className="mt-1 h-10 w-full border border-amber-300 bg-white px-3 text-sm" />
          </label>
          <button onClick={verifyStepUp} disabled={!stepUpCode || busy === 'step-up'} className="h-10 bg-amber-900 px-4 text-sm font-semibold text-white disabled:bg-amber-300">Verify MFA</button>
        </div>
      )}

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading security operations...</div>
      ) : tab === 'overview' ? (
        <Overview dashboard={dashboard} scans={scans} isSuper={isSuper} />
      ) : tab === 'identity' ? (
        <IdentityPanel
          isSuper={isSuper}
          policy={policy}
          setPolicy={setPolicy}
          savePolicy={savePolicy}
          providers={providers}
          oidc={oidc}
          setOidc={setOidc}
          editingOidcId={editingOidcId}
          setEditingOidcId={setEditingOidcId}
          saveOidc={saveOidc}
          editOidc={editOidc}
          busy={busy}
          run={run}
          policyHistory={policyHistory}
        />
      ) : tab === 'backups' ? (
        <BackupPanel policy={backupPolicy} setPolicy={setBackupPolicy} backups={backups} busy={busy}
          savePolicy={saveBackupPolicy} run={run} />
      ) : tab === 'retention' ? (
        <RetentionPanel policy={retention} setPolicy={setRetention} busy={busy} savePolicy={saveRetention} run={run} />
      ) : (
        <ApprovalPanel approvals={approvals} busy={busy} run={run} />
      )}
    </div>
  );
}

function Overview({ dashboard, scans, isSuper }: any) {
  if (!isSuper) {
    return <div className="py-6 text-sm text-gray-600">Use Identity for tenant SSO configuration and Approvals for disruptive network changes.</div>;
  }
  const metrics = [
    ['Active sessions', dashboard.metrics?.activeSessions || 0, ShieldCheck],
    ['Errors in 24h', dashboard.metrics?.errors24h || 0, Activity],
    ['Pending approvals', dashboard.metrics?.pendingApprovals || 0, ServerCog],
    ['Recent backups', dashboard.recentBackups?.length || 0, DatabaseBackup],
  ];
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon]: any) => (
          <div key={label} className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between text-sm text-gray-500"><span>{label}</span><Icon size={18} /></div>
            <p className="mt-3 text-3xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-semibold text-gray-950">Environment readiness</h2>
          <div className="mt-3 divide-y divide-gray-100 border-y border-gray-200 text-sm">
            <StatusRow label="Encrypted backup key" ready={dashboard.environment?.encryptedBackupKeyConfigured} />
            <StatusRow label="ClamAV service" ready={dashboard.environment?.clamAvConfigured} optional />
            <StatusRow label="OIDC providers" ready={dashboard.environment?.oidcProviders > 0} optional value={dashboard.environment?.oidcProviders || 0} />
            <StatusRow label="Transactional email" ready={dashboard.emailProvider?.lastTestStatus === 'PASS'} />
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-950">Upload scanning</h2>
          <p className="mt-2 text-sm text-gray-600">
            {scans.configured ? 'ClamAV streaming scans are configured.' : 'Built-in content validation is active; ClamAV is not configured.'}
          </p>
          <div className="mt-3 divide-y divide-gray-100 border-y border-gray-200">
            {(scans.totals || []).map((item: any) => (
              <div key={`${item.scanner}-${item.status}`} className="flex items-center justify-between py-3 text-sm">
                <span>{item.scanner} / {item.status}</span><strong>{item.count}</strong>
              </div>
            ))}
            {!scans.totals?.length && <div className="py-3 text-sm text-gray-500">No upload scan events yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusRow({ label, ready, optional, value }: any) {
  return (
    <div className="flex items-center justify-between py-3">
      <span>{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-semibold ${ready ? 'text-emerald-700' : optional ? 'text-amber-700' : 'text-red-700'}`}>
        {ready ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
        {value ?? (ready ? 'Ready' : optional ? 'Optional' : 'Needs attention')}
      </span>
    </div>
  );
}

function IdentityPanel({ isSuper, policy, setPolicy, savePolicy, providers, oidc, setOidc, editingOidcId, setEditingOidcId, saveOidc, editOidc, busy, run, policyHistory }: any) {
  return (
    <div className="space-y-8">
      {isSuper && (
        <section>
          <h2 className="text-lg font-semibold text-gray-950">Authentication policy</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['requireMfaSuperAdmin', 'Require MFA for super admins'],
              ['requireMfaTenantAdmin', 'Require MFA for tenant admins'],
              ['requireMfaTechnicians', 'Require MFA for technicians'],
              ['requirePhishingResistantSuperAdmin', 'Require FIDO/WebAuthn through SSO for super admins'],
              ['requireNetworkApproval', 'Require independent network approval'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm font-medium text-gray-700">
                {label}
                <input type="checkbox" checked={Boolean(policy[key])} onChange={(event) => setPolicy({ ...policy, [key]: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary" />
              </label>
            ))}
            <NumberField label="Session lifetime (days)" value={policy.sessionLifetimeDays} min={1} max={30}
              onChange={(value: number) => setPolicy({ ...policy, sessionLifetimeDays: value })} />
            <NumberField label="Maximum active sessions" value={policy.maxActiveSessions} min={1} max={50}
              onChange={(value: number) => setPolicy({ ...policy, maxActiveSessions: value })} />
          </div>
          <button onClick={savePolicy} disabled={busy === 'policy'} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Save size={16} /> Save policy
          </button>
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">Policy versions</h3>
            <div className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
              {policyHistory.slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>{new Date(item.createdAt).toLocaleString()} · {item.firstName ? `${item.firstName} ${item.lastName}` : 'System'}</span>
                  <button onClick={() => run(`rollback-${item.id}`, () => api.post(`/platform-security/policy/history/${item.id}/rollback`, {}), 'Security policy rolled back')} className="border border-gray-300 px-3 py-1.5 text-xs font-semibold">Rollback</button>
                </div>
              ))}
              {!policyHistory.length && <p className="py-3 text-sm text-gray-500">No prior policy versions.</p>}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2"><CloudCog size={19} /><h2 className="text-lg font-semibold text-gray-950">OpenID Connect providers</h2></div>
        <form onSubmit={saveOidc} className="mt-4 grid gap-3 lg:grid-cols-2">
          <input required value={oidc.name} onChange={(event) => setOidc({ ...oidc, name: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Provider name" />
          <input required type="url" value={oidc.issuer} onChange={(event) => setOidc({ ...oidc, issuer: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://identity.example.com" />
          <input required value={oidc.clientId} onChange={(event) => setOidc({ ...oidc, clientId: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Client ID" />
          <input type="password" value={oidc.clientSecret} onChange={(event) => setOidc({ ...oidc, clientSecret: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder={editingOidcId ? 'Leave blank to keep secret' : 'Client secret'} />
          <input value={oidc.allowedDomains} onChange={(event) => setOidc({ ...oidc, allowedDomains: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Allowed domains, comma separated" />
          <select value={oidc.defaultRole} onChange={(event) => setOidc({ ...oidc, defaultRole: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="CLIENT">Client</option><option value="TECHNICIAN">Technician</option><option value="TENANT_ADMIN">Tenant admin</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={oidc.autoProvision} onChange={(event) => setOidc({ ...oidc, autoProvision: event.target.checked })} /> Auto-provision approved domains</label>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={oidc.enabled} onChange={(event) => setOidc({ ...oidc, enabled: event.target.checked })} /> Enable after validation</label>
          <div className="flex gap-2 lg:col-span-2">
            <button disabled={busy === 'oidc'} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> {editingOidcId ? 'Update provider' : 'Add provider'}</button>
            {editingOidcId && <button type="button" onClick={() => { setOidc(defaultOidc); setEditingOidcId(''); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>}
          </div>
        </form>
        <div className="mt-5 divide-y divide-gray-100 border-y border-gray-200">
          {providers.map((provider: any) => (
            <div key={provider.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => editOidc(provider)} className="font-semibold text-primary hover:underline">{provider.name}</button>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${provider.lastTestStatus === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{provider.lastTestStatus || 'UNTESTED'}</span>
                  {provider.enabled && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Enabled</span>}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{provider.issuer} | Client secret {provider.clientSecretConfigured ? 'stored' : 'missing'}</p>
                <p className="mt-1 break-all text-xs text-gray-500">Callback: {provider.callbackUrl}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => run(`test-${provider.id}`, () => api.post(`/platform-security/oidc/${provider.id}/test`, {}), 'OIDC discovery passed')} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700">Test</button>
                <button onClick={() => run(`delete-${provider.id}`, () => api.delete(`/platform-security/oidc/${provider.id}`), 'OIDC provider deleted')} className="rounded-md border border-red-200 p-2 text-red-700" title="Delete provider"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {!providers.length && <div className="py-4 text-sm text-gray-500">No OIDC providers configured.</div>}
        </div>
      </section>
    </div>
  );
}

function BackupPanel({ policy, setPolicy, backups, busy, savePolicy, run }: any) {
  return (
    <div className="space-y-7">
      <section>
        <h2 className="text-lg font-semibold text-gray-950">Encrypted backup schedule</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={Boolean(policy.enabled)} onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })} /> Enable weekly backups</label>
          <NumberField label="Day (0 Sunday)" value={policy.scheduleDay} min={0} max={6} onChange={(value: number) => setPolicy({ ...policy, scheduleDay: value })} />
          <NumberField label="Hour (0-23)" value={policy.scheduleHour} min={0} max={23} onChange={(value: number) => setPolicy({ ...policy, scheduleHour: value })} />
          <NumberField label="Artifacts retained" value={policy.retentionCount} min={1} max={30} onChange={(value: number) => setPolicy({ ...policy, retentionCount: value })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={savePolicy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"><Save size={16} /> Save schedule</button>
          <button onClick={() => run('backup', () => api.post('/platform-security/backups/run', {}, { timeout: 300000 }), 'Encrypted backup completed')} disabled={busy === 'backup'}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"><Play size={16} /> Run now</button>
        </div>
      </section>
      <section className="border-t border-gray-200 pt-5">
        <h2 className="font-semibold text-gray-950">Backup history</h2>
        <div className="mt-3 divide-y divide-gray-100 border-y border-gray-200">
          {backups.map((item: any) => (
            <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-950">{item.status} <span className="font-normal text-gray-500">at {formatDate(item.startedAt)}</span></p>
                <p className="mt-1 text-xs text-gray-500">{item.tableCount || 0} tables | {item.rowCount || 0} rows | {item.bytes ? `${Math.round(item.bytes / 1024)} KB` : '-' } | Restore test {item.restoreTestStatus || 'not run'}</p>
              </div>
              {item.status === 'COMPLETED' && <button onClick={() => run(`backup-test-${item.id}`, () => api.post(`/platform-security/backups/${item.id}/test`, {}), 'Backup integrity test passed')} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700">Test restore integrity</button>}
            </div>
          ))}
          {!backups.length && <div className="py-4 text-sm text-gray-500">No backup runs yet.</div>}
        </div>
      </section>
    </div>
  );
}

function RetentionPanel({ policy, setPolicy, busy, savePolicy, run }: any) {
  const fields = [
    ['sessionDays', 'Expired sessions'], ['auditLogDays', 'Audit logs'], ['errorReportDays', 'Error reports'],
    ['emailEventDays', 'Email events'], ['networkSnapshotDays', 'Network snapshots'], ['syslogDays', 'Syslog events'],
  ];
  return (
    <section>
      <div className="flex items-center gap-2"><ServerCog size={19} /><h2 className="text-lg font-semibold text-gray-950">Data lifecycle policy</h2></div>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={Boolean(policy.enabled)} onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })} /> Enable scheduled cleanup</label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([key, label]) => <NumberField key={key} label={`${label} (days)`} value={policy[key]} min={7} max={3650} onChange={(value: number) => setPolicy({ ...policy, [key]: value })} />)}
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={savePolicy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"><Save size={16} /> Save retention</button>
        <button onClick={() => run('retention', () => api.post('/platform-security/retention/run', {}), 'Retention cleanup completed')} disabled={busy === 'retention'} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"><Play size={16} /> Run cleanup</button>
      </div>
    </section>
  );
}

function ApprovalPanel({ approvals, busy, run }: any) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-950">Disruptive network actions</h2>
      <p className="mt-1 text-sm text-gray-600">A different administrator must approve reboots, port disable actions, and PoE bounces.</p>
      <div className="mt-4 divide-y divide-gray-100 border-y border-gray-200">
        {approvals.map((item: any) => (
          <div key={item.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{item.action}</span>
                <p className="font-semibold text-gray-950">{item.assetName || item.assetId}</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">{[item.companyName, item.requestedByEmail, formatDate(item.createdAt)].filter(Boolean).join(' | ')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => run(`approve-${item.id}`, () => api.post(`/platform-security/approvals/${item.id}/approve`, {}), 'Network action approved')} disabled={busy === `approve-${item.id}`} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={16} /> Approve</button>
              <button onClick={() => run(`reject-${item.id}`, () => api.post(`/platform-security/approvals/${item.id}/reject`, {}), 'Network action rejected')} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"><XCircle size={16} /> Reject</button>
            </div>
          </div>
        ))}
        {!approvals.length && <div className="py-5 text-sm text-gray-500">No actions are awaiting approval.</div>}
      </div>
    </section>
  );
}

function NumberField({ label, value, min, max, onChange }: any) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input type="number" min={min} max={max} value={value ?? ''} onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
