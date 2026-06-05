'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { formatDate } from '../../../../lib/utils';
import { useAuthStore } from '../../../../stores/authStore';
import { useToast } from '../../../../components/ui/Toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FULFILLED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const requestTypeLabels: Record<string, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  SERVICE: 'Service',
  ACCESS: 'Access',
  OTHER: 'Other',
};

export default function CatalogRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isBusiness = user?.userType === 'BUSINESS' && (user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get(`/catalog-requests/${id}`)
      .then(setRequest)
      .catch(() => { toast('error', 'Request not found'); router.push('/catalog-requests'); })
      .finally(() => setLoading(false));
  }, [id, user, router, toast]);

  const doAction = async (action: string, body?: any) => {
    setActionLoading(true);
    try {
      const updated = await api.post(`/catalog-requests/${id}/${action}`, body || {});
      setRequest(updated);
      toast('success', `Request ${action}ed`);
      setShowReject(false);
      setRejectReason('');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!request) return null;

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-primary hover:underline mb-4">&larr; Back</button>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status] || ''}`}>
            {request.status}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="font-medium ml-1">{requestTypeLabels[request.requestType] || request.requestType}</span>
          </div>
          <div>
            <span className="text-gray-500">Priority:</span>
            <span className="font-medium ml-1">{request.priority}</span>
          </div>
          {request.itemName && (
            <div>
              <span className="text-gray-500">Item:</span>
              <span className="font-medium ml-1">{request.itemName}</span>
            </div>
          )}
          {request.quantity && (
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="font-medium ml-1">{request.quantity}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="font-medium ml-1">{formatDate(request.createdAt)}</span>
          </div>
          {request.approvedAt && (
            <div>
              <span className="text-gray-500">Approved:</span>
              <span className="font-medium ml-1">{formatDate(request.approvedAt)}</span>
            </div>
          )}
          {request.fulfilledAt && (
            <div>
              <span className="text-gray-500">Fulfilled:</span>
              <span className="font-medium ml-1">{formatDate(request.fulfilledAt)}</span>
            </div>
          )}
        </div>

        {request.justification && (
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Justification</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.justification}</p>
          </div>
        )}

        {request.description && (
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}

        {request.rejectionReason && (
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Rejection Reason</h3>
            <p className="text-sm text-red-600 whitespace-pre-wrap">{request.rejectionReason}</p>
          </div>
        )}

        {request.status === 'PENDING' && isBusiness && (
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
            <div className="flex gap-2">
              <button onClick={() => doAction('approve')} disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50">
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button onClick={() => setShowReject(!showReject)} disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50">
                Reject
              </button>
              <button onClick={() => doAction('fulfill')} disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                Fulfill
              </button>
            </div>
            {showReject && (
              <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm" rows={2} placeholder="Why is this being rejected?" />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => doAction('reject', { reason: rejectReason })} disabled={!rejectReason.trim() || actionLoading}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50">
                    Confirm Reject
                  </button>
                  <button onClick={() => { setShowReject(false); setRejectReason(''); }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {request.status === 'APPROVED' && isBusiness && (
          <div className="border-t pt-4">
            <button onClick={() => doAction('fulfill')} disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
              {actionLoading ? 'Processing...' : 'Mark Fulfilled'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
