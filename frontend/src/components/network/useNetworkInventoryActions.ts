'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { NetworkDevice } from './types';
import { retiredNetworkDevicesKey } from './useRetiredNetworkDevices';

export interface RemovalImpact {
  activeTickets: number;
  topologyLinks: number;
  activeAlerts: number;
  ipReservations: number;
  action: string;
}

export function useNetworkInventoryActions({ devices, setDevices, selected, setSelected, onFallbackSelected, refetchRetired, toast }: {
  devices: NetworkDevice[];
  setDevices: React.Dispatch<React.SetStateAction<NetworkDevice[]>>;
  selected: NetworkDevice | null;
  setSelected: React.Dispatch<React.SetStateAction<NetworkDevice | null>>;
  onFallbackSelected: (device: NetworkDevice | null) => void;
  refetchRetired: () => Promise<unknown>;
  toast: (tone: 'success' | 'error', message: string) => void;
}) {
  const queryClient = useQueryClient();
  const { user, activeCompanyContext } = useAuthStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removeCandidate, setRemoveCandidate] = useState<NetworkDevice | null>(null);
  const [removalImpact, setRemovalImpact] = useState<RemovalImpact | null>(null);
  const [bulkRetireOpen, setBulkRetireOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!removeCandidate) {
      setRemovalImpact(null);
      return;
    }
    api.get<RemovalImpact>(`/assets/${removeCandidate.id}/removal-impact`).then(setRemovalImpact).catch(() => setRemovalImpact(null));
  }, [removeCandidate]);

  const importDevices = async (imported: Record<string, string>[]) => {
    setBusy(true);
    try {
      const result = await api.post<{ created: NetworkDevice[]; duplicates: any[]; invalid: any[] }>('/assets/network/import', { devices: imported });
      setDevices((current) => [...result.created, ...current]);
      toast('success', `${result.created.length} network device${result.created.length === 1 ? '' : 's'} imported${result.duplicates.length ? `; ${result.duplicates.length} duplicate rows skipped` : ''}.`);
      if (result.invalid.length) toast('error', `${result.invalid.length} row${result.invalid.length === 1 ? '' : 's'} could not be imported.`);
    } catch (error: any) {
      toast('error', error.message || 'Network device import failed');
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const retireOne = async () => {
    if (!removeCandidate || busy) return;
    setBusy(true);
    try {
      await api.delete(`/assets/${removeCandidate.id}`);
      const remaining = devices.filter((device) => device.id !== removeCandidate.id);
      const next = remaining[0] || null;
      setDevices(remaining);
      queryClient.setQueryData<NetworkDevice[]>(retiredNetworkDevicesKey(user?.companyId, activeCompanyContext?.id), (current = []) => [removeCandidate, ...current.filter((device) => device.id !== removeCandidate.id)]);
      setSelected(next);
      onFallbackSelected(next);
      toast('success', `${removeCandidate.name} retired. It can be restored from Retired devices.`);
      setRemoveCandidate(null);
    } catch (error: any) {
      toast('error', error.message || 'Failed to retire network equipment');
    } finally {
      setBusy(false);
    }
  };

  const bulkRetire = async () => {
    if (!selectedIds.size) return;
    setBusy(true);
    try {
      const result = await api.post<{ retired: Array<{ id: string; name: string }> }>('/assets/network/bulk/retire', { ids: [...selectedIds] });
      const retiredIds = new Set(result.retired.map((device) => device.id));
      setDevices((current) => current.filter((device) => !retiredIds.has(device.id)));
      if (selected && retiredIds.has(selected.id)) {
        setSelected(null);
        onFallbackSelected(null);
      }
      setSelectedIds(new Set());
      setBulkRetireOpen(false);
      await refetchRetired();
      toast('success', `${result.retired.length} network device${result.retired.length === 1 ? '' : 's'} retired and available for restore.`);
    } catch (error: any) {
      toast('error', error.message || 'Bulk retirement failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleSelection = (deviceId: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(deviceId)) next.delete(deviceId); else next.add(deviceId);
    return next;
  });

  return {
    busy,
    selectedIds,
    clearSelection: () => setSelectedIds(new Set()),
    toggleSelection,
    importDevices,
    removeCandidate,
    setRemoveCandidate,
    removalImpact,
    retireOne,
    bulkRetireOpen,
    setBulkRetireOpen,
    bulkRetire,
  };
}
