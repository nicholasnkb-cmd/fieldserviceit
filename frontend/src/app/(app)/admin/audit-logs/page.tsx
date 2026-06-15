'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getListData, getResponseMeta } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { Pagination } from '../../../../components/ui/Pagination';
import { TableSkeleton } from '../../../../components/ui/Skeleton';
import { ResponsiveTable } from '../../../../components/ui/ResponsiveTable';
import { formatDate } from '../../../../lib/utils';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState';

const sensitiveTerms = ['permission', 'role', 'credential', 'secret', 'company', 'tenant', 'impersonat', 'security', 'mfa', 'oidc'];

function isSensitive(log: any) {
  const value = `${log.action || ''} ${log.resourceType || ''}`.toLowerCase();
  return sensitiveTerms.some((term) => value.includes(term));
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    setLoading(true);
    const params = `?page=${page}&limit=25${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`;
    api.get(`/admin/audit-logs${params}`).then((d) => { setLogs(getListData(d)); setMeta(getResponseMeta(d)); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, debouncedSearch, user, router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
      {!loading && logs.some(isSensitive) && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 shrink-0" size={19} />
          <div><strong>{logs.filter(isSensitive).length} sensitive changes</strong> appear on this page. Review permission, credential, company, identity, and security-policy changes carefully.</div>
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={sensitiveOnly} onChange={(event) => setSensitiveOnly(event.target.checked)} />
          Sensitive changes only
        </label>
      </div>
      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <ResponsiveTable>
          <table className="w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-50"><tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resource ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {logs.filter((log) => !sensitiveOnly || isSensitive(log)).map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span className={isSensitive(l) ? 'font-semibold text-amber-800' : ''}>{l.action}</span>
                    {isSensitive(l) && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">Sensitive</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.resourceType}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">{l.resourceId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">{l.actor?.firstName} {l.actor?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.company?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
              {logs.filter((log) => !sensitiveOnly || isSensitive(log)).length === 0 && <tr><td colSpan={6} className="p-4"><EmptyState icon={ShieldAlert} title="No matching audit activity" description={sensitiveOnly ? 'No permission, credential, tenant, or security changes appear on this page.' : 'Audit entries will appear after administrative or operational changes.'} /></td></tr>}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
    </div>
  );
}
