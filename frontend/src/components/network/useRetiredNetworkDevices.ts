'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { NetworkDevice } from './types';

export const retiredNetworkDevicesKey = (companyId?: string | null, companyContextId?: string) =>
  ['network-devices', 'retired', companyId, companyContextId] as const;

export function useRetiredNetworkDevices(options: {
  companyId?: string | null;
  companyContextId?: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: retiredNetworkDevicesKey(options.companyId, options.companyContextId),
    queryFn: async () => {
      const result = await api.get<{ data: NetworkDevice[] }>('/assets/retired?deviceCategory=NETWORK_DEVICE');
      return result.data || [];
    },
    enabled: options.enabled,
  });
}
