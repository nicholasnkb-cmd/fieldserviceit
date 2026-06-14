'use client';

export interface PermissionHistoryEntry {
  id: string;
  roleId: string;
  action: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string } | null;
  diff?: { roleName?: string; before?: string[]; after?: string[]; added?: string[]; removed?: string[]; sourceRoleId?: string };
}

export function PermissionHistoryPanel({
  history,
  roleNames,
  restoringId,
  onRestore,
}: {
  history: PermissionHistoryEntry[];
  roleNames: Record<string, string>;
  restoringId?: string;
  onRestore: (entry: PermissionHistoryEntry) => void;
}) {
  if (history.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No permission changes recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <th className="pb-2">Time</th>
            <th className="pb-2">Actor</th>
            <th className="pb-2">Role</th>
            <th className="pb-2">Added</th>
            <th className="pb-2">Removed</th>
            <th className="pb-2 text-right">Version</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-100">
              <td className="py-2 pr-3">{new Date(entry.createdAt).toLocaleString()}</td>
              <td className="py-2 pr-3">{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'System'}</td>
              <td className="py-2 pr-3">{entry.diff?.roleName || roleNames[entry.roleId] || entry.roleId}</td>
              <td className="py-2 pr-3 text-emerald-700">{entry.diff?.added?.join(', ') || '-'}</td>
              <td className="py-2 pr-3 text-red-700">{entry.diff?.removed?.join(', ') || '-'}</td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  disabled={!Array.isArray(entry.diff?.before) || restoringId === entry.id}
                  onClick={() => onRestore(entry)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {restoringId === entry.id ? 'Restoring...' : 'Restore previous'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
