'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Cable,
  CheckCircle2,
  Cpu,
  Edit3,
  Globe2,
  KeyRound,
  Plus,
  RefreshCw,
  Router,
  Save,
  Search,
  Server,
  Shield,
  SlidersHorizontal,
  Trash2,
  Wifi,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { RequireCompanyContext } from '../../../components/layout/RequireCompanyContext';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { NetworkDeviceList } from '../../../components/network/NetworkDeviceList';
import { NetworkDeviceHeader } from '../../../components/network/NetworkDeviceHeader';
import { RetiredNetworkDevices } from '../../../components/network/RetiredNetworkDevices';
import { NetworkInventoryTools } from '../../../components/network/NetworkInventoryTools';
import { NetworkDeviceOverview, type AssetHistoryItem } from '../../../components/network/NetworkDeviceOverview';
import { NetworkDiscoveryPanel, type DiscoveryResult, type DiscoverySchedule } from '../../../components/network/NetworkDiscoveryPanel';
import { useNetworkInventoryActions } from '../../../components/network/useNetworkInventoryActions';
import type { NetworkDevice } from '../../../components/network/types';
import { networkDeviceSchema } from '../../../components/network/network-device-form';
import { retiredNetworkDevicesKey, useRetiredNetworkDevices } from '../../../components/network/useRetiredNetworkDevices';
import { NetworkDeviceGlyph, networkStatusClass } from '../../../components/network/network-ui';
import { useAuthStore, userCan } from '../../../stores/authStore';

type NetworkTab = 'overview' | 'topology' | 'vlans' | 'wifi' | 'firewall' | 'dhcp' | 'monitoring' | 'interfaces' | 'firmware' | 'discovery' | 'actions' | 'vendors' | 'credentials' | 'alerts' | 'ipam' | 'backups' | 'maintenance' | 'ops';

interface VlanConfig {
  id: string;
  name: string;
  subnet: string;
  gateway: string;
}

interface WifiConfig {
  id: string;
  name: string;
  security: string;
  vlan: string;
  enabled: boolean;
}

interface FirewallRule {
  id: string;
  name: string;
  source: string;
  destination: string;
  service: string;
  action: 'ALLOW' | 'DENY';
}

interface NetworkConfig {
  managementIp: string;
  uplink: string;
  wanMode: string;
  vlans: VlanConfig[];
  wifi: WifiConfig[];
  firewall: FirewallRule[];
  dhcpServer: boolean;
  dhcpRange: string;
  dnsServers: string;
  monitoring: boolean;
  alertEmail: string;
}

interface MonitoringConfig {
  pingEnabled: boolean;
  pingIntervalSec: number;
  snmpEnabled: boolean;
  snmpVersion: string;
  snmpCommunity?: string;
  snmpUsername?: string;
  snmpAuthProtocol?: string;
  snmpPrivacyProtocol?: string;
  syslogEnabled: boolean;
  syslogPort: number;
  vendor?: string;
  vendorControllerUrl?: string;
  vendorSiteId?: string;
  vendorApiKey?: string;
}

interface HealthSnapshot {
  id: string;
  status: string;
  latencyMs?: number;
  packetLossPct?: number;
  cpuPct?: number;
  memoryPct?: number;
  source: string;
  message?: string;
  createdAt: string;
}

interface SyslogEvent {
  id: string;
  severity?: string;
  facility?: string;
  message: string;
  receivedAt: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold?: string;
  severity: string;
  enabled: boolean | number;
  notifyEmail?: string;
}

interface AlertEvent {
  id: string;
  title: string;
  details?: string;
  status: string;
  ticketId?: string;
  triggeredAt: string;
}

interface IpReservation {
  id: string;
  subnet: string;
  ipAddress: string;
  hostname?: string;
  macAddress?: string;
  status: string;
}

interface ConfigBackup {
  id: string;
  source: string;
  checksum?: string;
  createdAt: string;
}

interface MaintenanceWindow {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  suppressAlerts: boolean | number;
}

interface InterfaceMetric {
  id: string;
  ifIndex: number;
  name?: string;
  status?: string;
  speedMbps?: number;
  inOctets?: number;
  outOctets?: number;
  inErrors?: number;
  outErrors?: number;
  poeWatts?: number;
  vlan?: string;
  connectedMac?: string;
}

interface FirmwareItem {
  id: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  latestVersion?: string;
  eolStatus?: string;
  cveSummary?: string;
  checkedAt: string;
}

interface DeviceAction {
  id: string;
  action: string;
  status: string;
  createdAt: string;
}

interface VendorMapping {
  vendor: string;
  label: string;
  auth: string;
  supported: string[];
  endpoints: Record<string, string>;
}

interface NetworkCredential {
  id: string;
  name: string;
  vendor?: string;
  authMode?: string;
  username?: string;
  lastTestStatus?: string;
  lastTestAt?: string;
}

interface EscalationPolicy {
  id: string;
  name: string;
  severity: string;
  secondDelayMin: number;
  managerDelayMin: number;
  enabled: boolean | number;
}

interface SyslogSavedSearch {
  id: string;
  name: string;
  query?: string;
  severity?: string;
  facility?: string;
}

interface RetentionPolicy {
  snapshotDays: number;
  syslogDays: number;
  maxConcurrentPolls: number;
  vendorBackoffSec: number;
}

const defaultConfig: NetworkConfig = {
  managementIp: '',
  uplink: 'WAN 1',
  wanMode: 'DHCP',
  vlans: [
    { id: '10', name: 'Corporate', subnet: '10.10.10.0/24', gateway: '10.10.10.1' },
    { id: '20', name: 'Guest', subnet: '10.10.20.0/24', gateway: '10.10.20.1' },
  ],
  wifi: [
    { id: 'corp', name: 'Corporate WiFi', security: 'WPA2/WPA3', vlan: '10', enabled: true },
    { id: 'guest', name: 'Guest WiFi', security: 'Captive portal', vlan: '20', enabled: true },
  ],
  firewall: [
    { id: 'allow-lan', name: 'Allow LAN outbound', source: 'LAN', destination: 'Any', service: 'Any', action: 'ALLOW' },
    { id: 'block-guest', name: 'Block guest to LAN', source: 'VLAN 20', destination: 'RFC1918', service: 'Any', action: 'DENY' },
  ],
  dhcpServer: true,
  dhcpRange: '10.10.10.50 - 10.10.10.250',
  dnsServers: '1.1.1.1, 8.8.8.8',
  monitoring: true,
  alertEmail: '',
};

const equipmentTypes = ['Firewall', 'Router', 'Switch', 'Wireless AP', 'Controller', 'Gateway', 'Other'];
const configMarker = 'FIELD_SERVICE_NETWORK_CONFIG:';

const emptyDeviceForm = {
  name: '',
  equipmentType: 'Firewall',
  manufacturer: '',
  model: '',
  serialNumber: '',
  location: '',
  ipAddress: '',
  macAddress: '',
};

const defaultMonitoring: MonitoringConfig = {
  pingEnabled: true,
  pingIntervalSec: 60,
  snmpEnabled: false,
  snmpVersion: '2c',
  snmpCommunity: '',
  snmpUsername: '',
  snmpAuthProtocol: '',
  snmpPrivacyProtocol: '',
  syslogEnabled: false,
  syslogPort: 514,
  vendor: '',
  vendorControllerUrl: '',
  vendorSiteId: '',
  vendorApiKey: '',
};

const emptyAlertRule = {
  name: 'Device offline',
  metric: 'offline',
  operator: 'GT',
  threshold: '0',
  severity: 'CRITICAL',
  notifyEmail: '',
};

const emptyIpReservation = { subnet: '10.10.10.0/24', ipAddress: '', hostname: '', macAddress: '', status: 'RESERVED' };
const emptyMaintenance = { name: 'Planned maintenance', startsAt: '', endsAt: '', suppressAlerts: true };
const emptyCredential = { name: '', vendor: 'meraki', authMode: 'API_KEY', username: '', secret: '' };

function parseConfig(notes?: string): NetworkConfig {
  if (!notes) return defaultConfig;
  const line = notes.split('\n').find((entry) => entry.startsWith(configMarker));
  if (!line) return defaultConfig;

  try {
    return { ...defaultConfig, ...JSON.parse(line.replace(configMarker, '').trim()) };
  } catch {
    return defaultConfig;
  }
}

function serializeConfig(config: NetworkConfig, notes?: string) {
  const readableNotes = (notes || '')
    .split('\n')
    .filter((entry) => !entry.startsWith(configMarker))
    .join('\n')
    .trim();
  return [readableNotes, `${configMarker} ${JSON.stringify(config)}`].filter(Boolean).join('\n');
}

export default function NetworkPage() {
  const { user, activeCompanyContext } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [selected, setSelected] = useState<NetworkDevice | null>(null);
  const [config, setConfig] = useState<NetworkConfig>(defaultConfig);
  const [form, setForm] = useState(emptyDeviceForm);
  const [showAdd, setShowAdd] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [tab, setTab] = useState<NetworkTab>('overview');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monitoring, setMonitoring] = useState<MonitoringConfig>(defaultMonitoring);
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [syslogEvents, setSyslogEvents] = useState<SyslogEvent[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [ipReservations, setIpReservations] = useState<IpReservation[]>([]);
  const [configBackups, setConfigBackups] = useState<ConfigBackup[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceMetric[]>([]);
  const [firmware, setFirmware] = useState<FirmwareItem[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryResult[]>([]);
  const [deviceActions, setDeviceActions] = useState<DeviceAction[]>([]);
  const [series, setSeries] = useState<HealthSnapshot[]>([]);
  const [vendorMappings, setVendorMappings] = useState<VendorMapping[]>([]);
  const [credentials, setCredentials] = useState<NetworkCredential[]>([]);
  const [escalations, setEscalations] = useState<EscalationPolicy[]>([]);
  const [savedSearches, setSavedSearches] = useState<SyslogSavedSearch[]>([]);
  const [retention, setRetention] = useState<RetentionPolicy>({ snapshotDays: 30, syslogDays: 30, maxConcurrentPolls: 10, vendorBackoffSec: 300 });
  const [credentialForm, setCredentialForm] = useState(emptyCredential);
  const [backupDiff, setBackupDiff] = useState<{ type: string; line: string }[]>([]);
  const [alertForm, setAlertForm] = useState(emptyAlertRule);
  const [ipForm, setIpForm] = useState(emptyIpReservation);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance);
  const [backupText, setBackupText] = useState('');
  const [discoverySubnet, setDiscoverySubnet] = useState('192.168.1.0/24');
  const [syslogFilter, setSyslogFilter] = useState('');
  const [pinging, setPinging] = useState(false);
  const [snmpPolling, setSnmpPolling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lifecycle, setLifecycle] = useState({ purchaseDate: '', warrantyExpiresAt: '' });
  const [assetHistory, setAssetHistory] = useState<AssetHistoryItem[]>([]);
  const [discoverySchedule, setDiscoverySchedule] = useState<DiscoverySchedule>({ subnet: '192.168.1.0/24', intervalMinutes: 1440, hostLimit: 64, enabled: false });
  const [pendingAction, setPendingAction] = useState<{ action: string; port: string } | null>(null);

  const canEditNetwork = userCan(user, 'assets.edit');
  const canDeleteNetwork = userCan(user, 'assets.delete');
  const canManageCredentials = userCan(user, 'network.credentials.manage');
  const canRunActions = userCan(user, 'network.actions.run');
  const canManageOps = userCan(user, 'operations.manage');
  const retiredQuery = useRetiredNetworkDevices({
    companyId: user?.companyId,
    companyContextId: activeCompanyContext?.id,
    enabled: showRetired && canDeleteNetwork && !(user?.role === 'SUPER_ADMIN' && !activeCompanyContext),
  });
  const retiredDevices = retiredQuery.data || [];
  const inventoryActions = useNetworkInventoryActions({
    devices,
    setDevices,
    selected,
    setSelected,
    onFallbackSelected: (device) => {
      setConfig(device ? parseConfig(device.notes) : defaultConfig);
      setLifecycle({ purchaseDate: device?.purchaseDate?.slice(0, 10) || '', warrantyExpiresAt: device?.warrantyExpiresAt?.slice(0, 10) || '' });
      setTab('overview');
    },
    refetchRetired: () => retiredQuery.refetch(),
    toast,
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchDevices = useCallback(async () => {
    if (user?.role === 'SUPER_ADMIN' && !activeCompanyContext) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ deviceCategory: 'NETWORK_DEVICE', limit: '100' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const result = await api.get<{ data: NetworkDevice[] }>(`/assets?${params.toString()}`);
      const networkDevices = result.data || [];
      setDevices(networkDevices);
      if (!selected && networkDevices.length > 0) {
        setSelected(networkDevices[0]);
        setConfig(parseConfig(networkDevices[0].notes));
        setLifecycle({ purchaseDate: networkDevices[0].purchaseDate?.slice(0, 10) || '', warrantyExpiresAt: networkDevices[0].warrantyExpiresAt?.slice(0, 10) || '' });
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to load network equipment');
    } finally {
      setLoading(false);
    }
  }, [activeCompanyContext, debouncedSearch, selected, user?.role]);

  useEffect(() => {
    if (retiredQuery.error) toast('error', (retiredQuery.error as Error).message || 'Failed to load retired network equipment');
  }, [retiredQuery.error, toast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const haystack = [device.name, device.manufacturer, device.model, device.serialNumber, device.ipAddress, device.location].join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [devices, search]);

  const stats = [
    { label: 'Equipment', value: devices.length, icon: Router },
    { label: 'Online', value: devices.filter((device) => device.status === 'active').length, icon: CheckCircle2 },
    { label: 'Wi-Fi Networks', value: config.wifi.length, icon: Wifi },
    { label: 'Firewall Rules', value: config.firewall.length, icon: Shield },
  ];

  const selectDevice = (device: NetworkDevice) => {
    setSelected(device);
    setConfig(parseConfig(device.notes));
    setLifecycle({ purchaseDate: device.purchaseDate?.slice(0, 10) || '', warrantyExpiresAt: device.warrantyExpiresAt?.slice(0, 10) || '' });
    setTab('overview');
    fetchMonitoring(device.id);
    fetchNetworkOperations(device.id);
  };

  const fetchMonitoring = async (deviceId: string) => {
    try {
      const data = await api.get<{
        config: MonitoringConfig;
        snapshots: HealthSnapshot[];
        syslogEvents: SyslogEvent[];
        alertRules: AlertRule[];
      }>(`/assets/${deviceId}/network-monitoring`);
      setMonitoring({ ...defaultMonitoring, ...data.config });
      setSnapshots(data.snapshots || []);
      setSyslogEvents(data.syslogEvents || []);
      setAlertRules(data.alertRules || []);
    } catch (err: any) {
      setMessage(err.message || 'Failed to load monitoring settings');
    }
  };

  useEffect(() => {
    if (selected) {
      fetchMonitoring(selected.id);
      fetchNetworkOperations(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const fetchNetworkOperations = async (deviceId?: string) => {
    try {
      const [events, ipam, windows, backups, schedule] = await Promise.all([
        api.get<AlertEvent[]>('/assets/network/alert-events?status=ACTIVE').catch(() => []),
        api.get<IpReservation[]>('/assets/network/ip-reservations').catch(() => []),
        api.get<MaintenanceWindow[]>('/assets/network/maintenance-windows').catch(() => []),
        deviceId ? api.get<ConfigBackup[]>(`/assets/${deviceId}/config-backups`).catch(() => []) : Promise.resolve([]),
        api.get<DiscoverySchedule>('/assets/network/discovery/schedule').catch(() => discoverySchedule),
      ]);
      const [ifaceData, firmwareData, actionData, seriesData, discoveryData] = await Promise.all([
        deviceId ? api.get<InterfaceMetric[]>(`/assets/${deviceId}/interfaces`).catch(() => []) : Promise.resolve([]),
        deviceId ? api.get<FirmwareItem[]>(`/assets/${deviceId}/firmware`).catch(() => []) : Promise.resolve([]),
        deviceId ? api.get<DeviceAction[]>(`/assets/${deviceId}/device-actions`).catch(() => []) : Promise.resolve([]),
        deviceId ? api.get<HealthSnapshot[]>(`/assets/${deviceId}/network-monitoring/series?limit=60`).catch(() => []) : Promise.resolve([]),
        api.get<DiscoveryResult[]>('/assets/network/discovery').catch(() => []),
      ]);
      const mappings = await api.get<VendorMapping[]>('/assets/network/vendor-mappings').catch(() => []);
      const [credentialData, escalationData, savedSearchData, retentionData] = await Promise.all([
        api.get<NetworkCredential[]>('/assets/network/credentials').catch(() => []),
        api.get<EscalationPolicy[]>('/assets/network/escalation-policies').catch(() => []),
        api.get<SyslogSavedSearch[]>('/assets/network/syslog-searches').catch(() => []),
        api.get<RetentionPolicy>('/assets/network/retention-policy').catch(() => retention),
      ]);
      setAlertEvents(events);
      setIpReservations(ipam);
      setMaintenanceWindows(windows);
      setConfigBackups(backups);
      setDiscoverySchedule(schedule);
      setInterfaces(ifaceData);
      setFirmware(firmwareData);
      setDeviceActions(actionData);
      setSeries(seriesData.reverse());
      setDiscovery(discoveryData);
      setVendorMappings(mappings);
      setCredentials(credentialData);
      setEscalations(escalationData);
      setSavedSearches(savedSearchData);
      setRetention(retentionData);
      if (deviceId) setAssetHistory(await api.get<AssetHistoryItem[]>(`/assets/${deviceId}/history`).catch(() => []));
    } catch (err: any) {
      setMessage(err.message || 'Failed to load network operations');
    }
  };

  const createDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = networkDeviceSchema.safeParse(form);
    if (!parsed.success) {
      toast('error', parsed.error.issues[0]?.message || 'Check the equipment details');
      return;
    }
    const values = parsed.data;
    setSaving(true);
    try {
      const newConfig = { ...defaultConfig, managementIp: values.ipAddress };
      const created = await api.post<NetworkDevice>('/assets', {
        name: values.name,
        deviceCategory: 'NETWORK_DEVICE',
        manufacturer: values.manufacturer || values.equipmentType,
        model: values.model,
        serialNumber: values.serialNumber,
        location: values.location,
        ipAddress: values.ipAddress,
        macAddress: values.macAddress,
        enrollmentStatus: 'UNMANAGED',
        managementMode: 'NETWORK',
        complianceStatus: 'UNKNOWN',
        notes: serializeConfig(newConfig, `Equipment type: ${values.equipmentType}`),
      });
      setDevices((current) => [created, ...current]);
      setSelected(created);
      setConfig(newConfig);
      setForm(emptyDeviceForm);
      setShowAdd(false);
      setMessage(`${created.name} added to network equipment`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to add equipment');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await api.patch<NetworkDevice>(`/assets/${selected.id}`, {
        ipAddress: config.managementIp || selected.ipAddress,
        purchaseDate: lifecycle.purchaseDate || null,
        warrantyExpiresAt: lifecycle.warrantyExpiresAt || null,
        notes: serializeConfig(config, selected.notes),
      });
      setSelected(updated);
      setDevices((current) => current.map((device) => (device.id === updated.id ? updated : device)));
      setMessage(`Configuration saved for ${updated.name}`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveDiscoverySchedule = async () => {
    setSaving(true);
    try {
      const updated = await api.put<DiscoverySchedule>('/assets/network/discovery/schedule', discoverySchedule);
      setDiscoverySchedule(updated);
      toast('success', updated.enabled ? 'Scheduled network discovery enabled.' : 'Scheduled network discovery disabled.');
    } catch (err: any) {
      toast('error', err.message || 'Failed to save discovery schedule');
    } finally {
      setSaving(false);
    }
  };

  const restoreDevice = async (device: NetworkDevice) => {
    if (deleting) return;
    setDeleting(true);
    try {
      const restored = await api.post<NetworkDevice>(`/assets/retired/${device.id}/restore`, {});
      queryClient.setQueryData<NetworkDevice[]>(retiredNetworkDevicesKey(user?.companyId, activeCompanyContext?.id), (current = []) => current.filter((item) => item.id !== device.id));
      setDevices((current) => [restored, ...current.filter((item) => item.id !== restored.id)]);
      setSelected(restored);
      setConfig(parseConfig(restored.notes));
      setShowRetired(false);
      toast('success', `${restored.name} restored to active network equipment.`);
    } catch (err: any) {
      toast('error', err.message || 'Failed to restore network equipment');
    } finally {
      setDeleting(false);
    }
  };

  const saveMonitoring = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await api.put<{ config: MonitoringConfig; snapshots: HealthSnapshot[]; syslogEvents: SyslogEvent[]; alertRules: AlertRule[] }>(`/assets/${selected.id}/network-monitoring`, monitoring);
      setMonitoring({ ...defaultMonitoring, ...data.config });
      setSnapshots(data.snapshots || []);
      setSyslogEvents(data.syslogEvents || []);
      setAlertRules(data.alertRules || []);
      setMessage(`Monitoring settings saved for ${selected.name}`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save monitoring settings');
    } finally {
      setSaving(false);
    }
  };

  const runPing = async () => {
    if (!selected) return;
    setPinging(true);
    try {
      const result = await api.post<{ snapshot: HealthSnapshot; triggeredAlerts: AlertRule[] }>(`/assets/${selected.id}/network-monitoring/ping`, {});
      setSnapshots((current) => [result.snapshot, ...current].slice(0, 10));
      setMessage(result.triggeredAlerts.length > 0 ? `${result.snapshot.status}: ${result.triggeredAlerts.length} alert rule matched` : `Ping result: ${result.snapshot.status}`);
    } catch (err: any) {
      setMessage(err.message || 'Ping check failed');
    } finally {
      setPinging(false);
    }
  };

  const runSnmp = async () => {
    if (!selected) return;
    setSnmpPolling(true);
    try {
      const result = await api.post<{ snapshot: HealthSnapshot; interfaces: InterfaceMetric[]; firmware: FirmwareItem }>(`/assets/${selected.id}/network-monitoring/snmp`, {});
      setSnapshots((current) => [result.snapshot, ...current].slice(0, 10));
      setInterfaces(result.interfaces || []);
      if (result.firmware) setFirmware((current) => [result.firmware, ...current].slice(0, 25));
      setMessage(`SNMP poll collected ${(result.interfaces || []).length} interfaces`);
    } catch (err: any) {
      setMessage(err.message || 'SNMP poll failed');
    } finally {
      setSnmpPolling(false);
    }
  };

  const createAlertRule = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const rule = await api.post<AlertRule>(`/assets/${selected.id}/alert-rules`, alertForm);
      setAlertRules((current) => [rule, ...current]);
      setAlertForm(emptyAlertRule);
      setMessage('Alert rule created');
    } catch (err: any) {
      setMessage(err.message || 'Failed to create alert rule');
    } finally {
      setSaving(false);
    }
  };

  const createIpReservation = async () => {
    setSaving(true);
    try {
      const reservation = await api.post<IpReservation>('/assets/network/ip-reservations', { ...ipForm, assetId: selected?.id });
      setIpReservations((current) => [...current, reservation]);
      setIpForm(emptyIpReservation);
      setMessage('IP reservation created');
    } catch (err: any) {
      setMessage(err.message || 'Failed to reserve IP');
    } finally {
      setSaving(false);
    }
  };

  const createMaintenanceWindow = async () => {
    setSaving(true);
    try {
      const window = await api.post<MaintenanceWindow>('/assets/network/maintenance-windows', { ...maintenanceForm, assetId: selected?.id });
      setMaintenanceWindows((current) => [window, ...current]);
      setMaintenanceForm(emptyMaintenance);
      setMessage('Maintenance window created');
    } catch (err: any) {
      setMessage(err.message || 'Failed to create maintenance window');
    } finally {
      setSaving(false);
    }
  };

  const createConfigBackup = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const backup = await api.post<ConfigBackup>(`/assets/${selected.id}/config-backups`, { source: 'manual', configText: backupText });
      setConfigBackups((current) => [backup, ...current]);
      setBackupText('');
      setMessage('Config backup saved');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save config backup');
    } finally {
      setSaving(false);
    }
  };

  const scanSubnet = async () => {
    setSaving(true);
    try {
      const found = await api.post<DiscoveryResult[]>('/assets/network/discovery/scan', { subnet: discoverySubnet, limit: 64 });
      setDiscovery((current) => [...found, ...current]);
      setMessage(`Discovery found ${found.length} online hosts`);
    } catch (err: any) {
      setMessage(err.message || 'Discovery scan failed');
    } finally {
      setSaving(false);
    }
  };

  const queueAction = async (action: string, payload: Record<string, any> = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const queued = await api.post<DeviceAction>(`/assets/${selected.id}/device-actions`, { action, payload });
      setDeviceActions((current) => [queued, ...current]);
      setMessage(`${action.replaceAll('_', ' ')} queued`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to queue action');
    } finally {
      setSaving(false);
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.action.startsWith('EXECUTE:')) {
      await executeAction(pendingAction.action.slice('EXECUTE:'.length));
      setPendingAction(null);
      return;
    }
    const payload = ['BOUNCE_POE', 'DISABLE_PORT', 'ENABLE_PORT'].includes(pendingAction.action)
      ? { port: pendingAction.port }
      : {};
    await queueAction(pendingAction.action, payload);
    setPendingAction(null);
  };

  const executeAction = async (actionId: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      const executed = await api.post<DeviceAction>(`/assets/${selected.id}/device-actions/${actionId}/execute`, {});
      setDeviceActions((current) => current.map((item) => item.id === actionId ? executed : item));
      setMessage(`Action ${executed.status.toLowerCase()}`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to execute action');
    } finally {
      setSaving(false);
    }
  };

  const runVendorSync = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await api.post<{ snapshot: HealthSnapshot; interfaces?: InterfaceMetric[]; firmware?: FirmwareItem }>(`/assets/${selected.id}/vendor-sync`, {});
      setSnapshots((current) => [result.snapshot, ...current].slice(0, 10));
      if (result.interfaces) setInterfaces(result.interfaces);
      if (result.firmware) setFirmware((current) => [result.firmware!, ...current].slice(0, 25));
      setMessage('Vendor controller sync completed');
      await fetchNetworkOperations(selected.id);
    } catch (err: any) {
      setMessage(err.message || 'Vendor sync failed');
    } finally {
      setSaving(false);
    }
  };

  const createCredential = async () => {
    setSaving(true);
    try {
      const created = await api.post<NetworkCredential>('/assets/network/credentials', { ...credentialForm, assetId: selected?.id });
      setCredentials((current) => [created, ...current]);
      setCredentialForm(emptyCredential);
      setMessage('Credential saved');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save credential');
    } finally {
      setSaving(false);
    }
  };

  const testCredential = async (id: string) => {
    try {
      const result = await api.post<{ id: string; status: string }>(`/assets/network/credentials/${id}/test`, {});
      setCredentials((current) => current.map((item) => item.id === id ? { ...item, lastTestStatus: result.status } : item));
      setMessage(`Credential test ${result.status}`);
    } catch (err: any) {
      setMessage(err.message || 'Credential test failed');
    }
  };

  const saveRetention = async () => {
    const updated = await api.put<RetentionPolicy>('/assets/network/retention-policy', retention);
    setRetention(updated);
    setMessage('Retention policy saved');
  };

  const loadConfigDiff = async () => {
    if (!selected) return;
    const diff = await api.get<{ diff: { type: string; line: string }[] }>(`/assets/${selected.id}/config-backups/diff`);
    setBackupDiff(diff.diff || []);
  };

  const filteredSyslog = useMemo(() => {
    const needle = syslogFilter.toLowerCase();
    return syslogEvents.filter((event) => [event.severity, event.facility, event.message].join(' ').toLowerCase().includes(needle));
  }, [syslogEvents, syslogFilter]);

  const updateVlan = (index: number, field: keyof VlanConfig, value: string) => {
    setConfig((current) => ({
      ...current,
      vlans: current.vlans.map((vlan, idx) => (idx === index ? { ...vlan, [field]: value } : vlan)),
    }));
  };

  const updateWifi = (index: number, field: keyof WifiConfig, value: string | boolean) => {
    setConfig((current) => ({
      ...current,
      wifi: current.wifi.map((ssid, idx) => (idx === index ? { ...ssid, [field]: value } : ssid)),
    }));
  };

  const updateRule = (index: number, field: keyof FirewallRule, value: string) => {
    setConfig((current) => ({
      ...current,
      firewall: current.firewall.map((rule, idx) => (idx === index ? { ...rule, [field]: value } : rule)),
    }));
  };

  const tabItems = [
    { key: 'overview', Icon: Cpu, label: 'Overview' },
    { key: 'topology', Icon: Globe2, label: 'Topology' },
    { key: 'vlans', Icon: Cable, label: 'VLANs', hidden: !canEditNetwork },
    { key: 'wifi', Icon: Wifi, label: 'Wi-Fi', hidden: !canEditNetwork },
    { key: 'firewall', Icon: Shield, label: 'Firewall', hidden: !canEditNetwork },
    { key: 'dhcp', Icon: Server, label: 'DHCP', hidden: !canEditNetwork },
    { key: 'monitoring', Icon: Activity, label: 'Monitoring' },
    { key: 'interfaces', Icon: Cable, label: 'Interfaces' },
    { key: 'firmware', Icon: Server, label: 'Firmware' },
    { key: 'discovery', Icon: Search, label: 'Discovery', hidden: !canEditNetwork },
    { key: 'actions', Icon: RefreshCw, label: 'Actions', hidden: !canRunActions },
    { key: 'vendors', Icon: Globe2, label: 'Vendors' },
    { key: 'credentials', Icon: KeyRound, label: 'Credentials', hidden: !canManageCredentials },
    { key: 'alerts', Icon: AlertTriangle, label: 'Alerts' },
    { key: 'ipam', Icon: SlidersHorizontal, label: 'IPAM', hidden: !canEditNetwork },
    { key: 'backups', Icon: Save, label: 'Backups', hidden: !canEditNetwork },
    { key: 'maintenance', Icon: RefreshCw, label: 'Maintenance', hidden: !canEditNetwork },
    { key: 'ops', Icon: SlidersHorizontal, label: 'Ops', hidden: !canManageOps },
  ].filter((item) => !item.hidden);

  return (
    <RequireCompanyContext area="Network monitoring">
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Network management</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Network Console</h1>
          <p className="mt-1 text-sm text-gray-500">Add your routers, firewalls, switches, and access points, then stage their configuration in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canDeleteNetwork && (
            <button onClick={() => {
              const next = !showRetired;
              setShowRetired(next);
            }} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {showRetired ? 'Hide retired' : `Retired devices${retiredDevices.length ? ` (${retiredDevices.length})` : ''}`}
            </button>
          )}
          <button onClick={fetchDevices} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          {canEditNetwork && (
            <button onClick={() => setShowAdd((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add equipment
            </button>
          )}
        </div>
      </div>

      {message && <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}

      {showRetired && canDeleteNetwork && (
        <RetiredNetworkDevices devices={retiredDevices} busy={deleting || retiredQuery.isFetching} onRefresh={() => void retiredQuery.refetch()} onRestore={restoreDevice} />
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.label}</span>
                <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <NetworkInventoryTools
          devices={devices}
          selectedCount={inventoryActions.selectedIds.size}
          canImport={canEditNetwork}
          canBulkRetire={canDeleteNetwork}
          busy={saving || deleting || inventoryActions.busy}
          onImport={inventoryActions.importDevices}
          onBulkRetire={() => inventoryActions.setBulkRetireOpen(true)}
          onClearSelection={inventoryActions.clearSelection}
        />
      </div>

      {showAdd && canEditNetwork && (
        <form onSubmit={createDevice} className="mt-5 rounded border border-gray-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Equipment name *</span>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Type</span>
              <select value={form.equipmentType} onChange={(event) => setForm({ ...form, equipmentType: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {equipmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Management IP</span>
              <input value={form.ipAddress} onChange={(event) => setForm({ ...form, ipAddress: event.target.value })} placeholder="192.168.1.1" className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Manufacturer</span>
              <input value={form.manufacturer} onChange={(event) => setForm({ ...form, manufacturer: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Model</span>
              <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Serial</span>
              <input value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">Location</span>
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700">MAC address</span>
              <input value={form.macAddress} onChange={(event) => setForm({ ...form, macAddress: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save equipment'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <NetworkDeviceList devices={filteredDevices} selectedId={selected?.id} loading={loading} search={search} onSearch={setSearch} onSelect={selectDevice} selectedIds={inventoryActions.selectedIds} onToggleSelection={inventoryActions.toggleSelection} canSelect={canDeleteNetwork} />

        <section className="rounded border border-gray-200 bg-white">
          {!selected ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-gray-500">
              <Router className="mb-3 h-10 w-10" aria-hidden="true" />
              <p className="max-w-sm text-sm">Add or select network equipment to configure ports, wireless networks, DHCP, firewall policy, and monitoring.</p>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 p-5">
                <NetworkDeviceHeader device={selected} canEdit={canEditNetwork} canRetire={canDeleteNetwork} saving={saving} retiring={deleting || inventoryActions.busy} onSave={saveConfig} onRetire={() => inventoryActions.setRemoveCandidate(selected)} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {tabItems.map(({ key, Icon, label }) => {
                    const TabIcon = Icon;
                    return (
                      <button key={String(key)} onClick={() => setTab(key as NetworkTab)} className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium ${tab === key ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <TabIcon className="h-4 w-4" aria-hidden="true" />
                        {String(label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5">
                {tab === 'overview' && (
                  <NetworkDeviceOverview device={selected} config={config} onConfigChange={(patch) => setConfig({ ...config, ...patch })} lifecycle={lifecycle} onLifecycleChange={(patch) => setLifecycle({ ...lifecycle, ...patch })} history={assetHistory} />
                )}

                {tab === 'topology' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {devices.map((device) => (
                      <button key={device.id} onClick={() => selectDevice(device)} className={`rounded border p-4 text-left hover:bg-blue-50 ${selected.id === device.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-600"><NetworkDeviceGlyph type={`${device.manufacturer} ${device.model}`} /></span>
                          <span className={`rounded border px-2 py-0.5 text-xs font-medium ${networkStatusClass(device.complianceStatus === 'COMPLIANT' ? 'active' : 'UNKNOWN')}`}>{device.complianceStatus || 'UNKNOWN'}</span>
                        </div>
                        <div className="mt-3 font-medium text-gray-950">{device.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{device.ipAddress || 'No management IP'}</div>
                        <div className="mt-3 h-px bg-gray-200" />
                        <div className="mt-3 text-xs text-gray-500">{device.location || 'Unassigned site'}</div>
                      </button>
                    ))}
                  </div>
                )}

                {tab === 'vlans' && (
                  <ConfigList title="VLANs" onAdd={() => setConfig({ ...config, vlans: [...config.vlans, { id: String(config.vlans.length + 30), name: 'New VLAN', subnet: '', gateway: '' }] })}>
                    {config.vlans.map((vlan, index) => (
                      <div key={`${vlan.id}-${index}`} className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-4">
                        <TextField label="ID" value={vlan.id} onChange={(value) => updateVlan(index, 'id', value)} />
                        <TextField label="Name" value={vlan.name} onChange={(value) => updateVlan(index, 'name', value)} />
                        <TextField label="Subnet" value={vlan.subnet} onChange={(value) => updateVlan(index, 'subnet', value)} />
                        <TextField label="Gateway" value={vlan.gateway} onChange={(value) => updateVlan(index, 'gateway', value)} />
                      </div>
                    ))}
                  </ConfigList>
                )}

                {tab === 'wifi' && (
                  <ConfigList title="Wireless networks" onAdd={() => setConfig({ ...config, wifi: [...config.wifi, { id: `ssid-${config.wifi.length + 1}`, name: 'New SSID', security: 'WPA2/WPA3', vlan: '10', enabled: true }] })}>
                    {config.wifi.map((ssid, index) => (
                      <div key={`${ssid.id}-${index}`} className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[1fr_1fr_120px_120px]">
                        <TextField label="SSID" value={ssid.name} onChange={(value) => updateWifi(index, 'name', value)} />
                        <TextField label="Security" value={ssid.security} onChange={(value) => updateWifi(index, 'security', value)} />
                        <TextField label="VLAN" value={ssid.vlan} onChange={(value) => updateWifi(index, 'vlan', value)} />
                        <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                          <input type="checkbox" checked={ssid.enabled} onChange={(event) => updateWifi(index, 'enabled', event.target.checked)} />
                          Enabled
                        </label>
                      </div>
                    ))}
                  </ConfigList>
                )}

                {tab === 'firewall' && (
                  <ConfigList title="Firewall rules" onAdd={() => setConfig({ ...config, firewall: [...config.firewall, { id: `rule-${config.firewall.length + 1}`, name: 'New rule', source: 'Any', destination: 'Any', service: 'Any', action: 'ALLOW' }] })}>
                    {config.firewall.map((rule, index) => (
                      <div key={`${rule.id}-${index}`} className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_120px]">
                        <TextField label="Name" value={rule.name} onChange={(value) => updateRule(index, 'name', value)} />
                        <TextField label="Source" value={rule.source} onChange={(value) => updateRule(index, 'source', value)} />
                        <TextField label="Destination" value={rule.destination} onChange={(value) => updateRule(index, 'destination', value)} />
                        <TextField label="Service" value={rule.service} onChange={(value) => updateRule(index, 'service', value)} />
                        <label>
                          <span className="text-sm font-medium text-gray-700">Action</span>
                          <select value={rule.action} onChange={(event) => updateRule(index, 'action', event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                            <option value="ALLOW">Allow</option>
                            <option value="DENY">Deny</option>
                          </select>
                        </label>
                      </div>
                    ))}
                  </ConfigList>
                )}

                {tab === 'dhcp' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                      <input type="checkbox" checked={config.dhcpServer} onChange={(event) => setConfig({ ...config, dhcpServer: event.target.checked })} />
                      DHCP server enabled
                    </label>
                    <TextField label="DHCP range" value={config.dhcpRange} onChange={(value) => setConfig({ ...config, dhcpRange: value })} />
                    <TextField label="DNS servers" value={config.dnsServers} onChange={(value) => setConfig({ ...config, dnsServers: value })} />
                  </div>
                )}

                {tab === 'monitoring' && (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-4">
                      <label className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                        <input type="checkbox" checked={monitoring.pingEnabled} onChange={(event) => setMonitoring({ ...monitoring, pingEnabled: event.target.checked })} />
                        Ping checks
                      </label>
                      <NumberField label="Ping interval seconds" value={monitoring.pingIntervalSec} onChange={(value) => setMonitoring({ ...monitoring, pingIntervalSec: value })} />
                      <label className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                        <input type="checkbox" checked={monitoring.snmpEnabled} onChange={(event) => setMonitoring({ ...monitoring, snmpEnabled: event.target.checked })} />
                        SNMP polling
                      </label>
                      <label className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                        <input type="checkbox" checked={monitoring.syslogEnabled} onChange={(event) => setMonitoring({ ...monitoring, syslogEnabled: event.target.checked })} />
                        Syslog ingestion
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <TextField label="SNMP version" value={monitoring.snmpVersion || ''} onChange={(value) => setMonitoring({ ...monitoring, snmpVersion: value })} />
                      <TextField label="SNMP community" value={monitoring.snmpCommunity || ''} onChange={(value) => setMonitoring({ ...monitoring, snmpCommunity: value })} />
                      <TextField label="SNMP username" value={monitoring.snmpUsername || ''} onChange={(value) => setMonitoring({ ...monitoring, snmpUsername: value })} />
                      <NumberField label="Syslog port" value={monitoring.syslogPort} onChange={(value) => setMonitoring({ ...monitoring, syslogPort: value })} />
                      <TextField label="Vendor" value={monitoring.vendor || ''} onChange={(value) => setMonitoring({ ...monitoring, vendor: value })} />
                      <TextField label="Controller URL" value={monitoring.vendorControllerUrl || ''} onChange={(value) => setMonitoring({ ...monitoring, vendorControllerUrl: value })} />
                      <TextField label="Site ID" value={monitoring.vendorSiteId || ''} onChange={(value) => setMonitoring({ ...monitoring, vendorSiteId: value })} />
                      <TextField label="API key" value={monitoring.vendorApiKey || ''} onChange={(value) => setMonitoring({ ...monitoring, vendorApiKey: value })} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={saveMonitoring} disabled={saving} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Save monitoring
                      </button>
                      <button onClick={runPing} disabled={pinging || !selected.ipAddress} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <Activity className="h-4 w-4" aria-hidden="true" />
                        {pinging ? 'Pinging...' : 'Run ping'}
                      </button>
                      <button onClick={runSnmp} disabled={snmpPolling || !monitoring.snmpEnabled} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <Cable className="h-4 w-4" aria-hidden="true" />
                        {snmpPolling ? 'Polling SNMP...' : 'Run SNMP poll'}
                      </button>
                    </div>

                    <div className="rounded border border-gray-200 p-4">
                      <div className="text-sm font-semibold text-gray-950">Latency and packet loss trend</div>
                      <SimpleTrend data={series} />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded border border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-950">Health snapshots</div>
                        <div className="divide-y divide-gray-200">
                          {snapshots.map((snapshot) => (
                            <div key={snapshot.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                              <div>
                                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${networkStatusClass(snapshot.status === 'ONLINE' ? 'active' : 'UNKNOWN')}`}>{snapshot.status}</span>
                                <div className="mt-2 text-gray-600">{snapshot.message || snapshot.source}</div>
                                <div className="mt-1 text-xs text-gray-500">{formatDate(snapshot.createdAt)}</div>
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                <div>{snapshot.latencyMs ?? '-'} ms</div>
                                <div>{snapshot.packetLossPct ?? '-'}% loss</div>
                              </div>
                            </div>
                          ))}
                          {snapshots.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No health checks yet</div>}
                        </div>
                      </div>

                      <div className="rounded border border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-950">Syslog events</div>
                        <div className="divide-y divide-gray-200">
                          <div className="border-b border-gray-200 p-3">
                            <input value={syslogFilter} onChange={(event) => setSyslogFilter(event.target.value)} placeholder="Filter syslog by severity, facility, or text" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                          </div>
                          {filteredSyslog.map((event) => (
                            <div key={event.id} className="px-4 py-3 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-gray-800">{event.severity || 'INFO'}</span>
                                <span className="text-xs text-gray-500">{formatDate(event.receivedAt)}</span>
                              </div>
                              <div className="mt-1 text-gray-600">{event.message}</div>
                            </div>
                          ))}
                          {filteredSyslog.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No matching syslog events</div>}
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-950">Alert rules</div>
                      <div className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[1.2fr_1fr_90px_100px_1fr_auto]">
                        <TextField label="Name" value={alertForm.name} onChange={(value) => setAlertForm({ ...alertForm, name: value })} />
                        <label>
                          <span className="text-sm font-medium text-gray-700">Metric</span>
                          <select value={alertForm.metric} onChange={(event) => setAlertForm({ ...alertForm, metric: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm">
                            <option value="offline">Offline</option>
                            <option value="latency_ms">Latency</option>
                            <option value="packet_loss_pct">Packet loss</option>
                            <option value="cpu_pct">CPU</option>
                            <option value="memory_pct">Memory</option>
                            <option value="wan_failover">WAN failover</option>
                            <option value="port_down">Port down</option>
                            <option value="ap_offline">AP offline</option>
                          </select>
                        </label>
                        <TextField label="Op" value={alertForm.operator} onChange={(value) => setAlertForm({ ...alertForm, operator: value })} />
                        <TextField label="Threshold" value={alertForm.threshold} onChange={(value) => setAlertForm({ ...alertForm, threshold: value })} />
                        <TextField label="Notify email" value={alertForm.notifyEmail} onChange={(value) => setAlertForm({ ...alertForm, notifyEmail: value })} />
                        <button onClick={createAlertRule} disabled={saving} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Add
                        </button>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {alertRules.map((rule) => (
                          <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{rule.name}</div>
                              <div className="text-xs text-gray-500">{rule.metric} {rule.operator} {rule.threshold}</div>
                            </div>
                            <span className={`rounded border px-2 py-0.5 text-xs font-medium ${rule.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{rule.severity}</span>
                          </div>
                        ))}
                        {alertRules.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No alert rules configured</div>}
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'interfaces' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={runSnmp} disabled={snmpPolling || !monitoring.snmpEnabled} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                        <Cable className="h-4 w-4" />
                        {snmpPolling ? 'Polling...' : 'Refresh from SNMP'}
                      </button>
                    </div>
                    <SimpleTable
                      empty="No interface data yet. Enable SNMP and run a poll."
                      headers={['Port', 'Status', 'Speed', 'In', 'Out', 'Errors', 'VLAN', 'Connected']}
                      rows={interfaces.map((item) => [
                        item.name || `ifIndex ${item.ifIndex}`,
                        item.status || 'UNKNOWN',
                        item.speedMbps ? `${item.speedMbps} Mbps` : '-',
                        item.inOctets ? String(item.inOctets) : '-',
                        item.outOctets ? String(item.outOctets) : '-',
                        `${item.inErrors || 0}/${item.outErrors || 0}`,
                        item.vlan || '-',
                        item.connectedMac || '-',
                      ])}
                    />
                  </div>
                )}

                {tab === 'firmware' && (
                  <SimpleTable
                    empty="No firmware data yet. SNMP polling records system descriptions here."
                    headers={['Checked', 'Vendor', 'Model', 'Firmware', 'Latest', 'EOL/CVE']}
                    rows={firmware.map((item) => [
                      formatDate(item.checkedAt),
                      item.vendor || '-',
                      item.model || '-',
                      item.firmwareVersion || '-',
                      item.latestVersion || '-',
                      item.eolStatus || item.cveSummary || 'UNKNOWN',
                    ])}
                  />
                )}

                {tab === 'discovery' && (
                  <NetworkDiscoveryPanel subnet={discoverySubnet} onSubnetChange={setDiscoverySubnet} onScan={scanSubnet} results={discovery} schedule={discoverySchedule} onScheduleChange={(patch) => setDiscoverySchedule({ ...discoverySchedule, ...patch })} onSaveSchedule={saveDiscoverySchedule} busy={saving} />
                )}

                {tab === 'actions' && (
                  <div className="space-y-4">
                    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Actions can interrupt service. Queue the action first, review it below, then execute it when you are ready.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['RESTART', 'BACKUP_CONFIG', 'SYNC_CONTROLLER', 'BOUNCE_POE', 'DISABLE_PORT', 'ENABLE_PORT'].map((action) => (
                        <button key={action} onClick={() => setPendingAction({ action, port: '' })} disabled={saving} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                          <RefreshCw className="h-4 w-4" />
                          {action.replaceAll('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <SimpleTable
                      empty="No actions queued yet"
                      headers={['Created', 'Action', 'Status']}
                      rows={deviceActions.map((item) => [formatDate(item.createdAt), item.action.replaceAll('_', ' '), item.status])}
                    />
                    <div className="flex flex-wrap gap-2">
                      {deviceActions.filter((item) => item.status === 'QUEUED').slice(0, 6).map((item) => (
                        <button key={item.id} onClick={() => setPendingAction({ action: `EXECUTE:${item.id}`, port: '' })} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <RefreshCw className="h-4 w-4" />
                          Execute {item.action.replaceAll('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'vendors' && (
                  <div className="space-y-4">
                    <div className="rounded border border-gray-200 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-950">Vendor controller sync</h3>
                          <p className="mt-1 text-sm text-gray-500">Uses the vendor, controller URL, site ID, serial number, and encrypted API key from Monitoring settings.</p>
                        </div>
                        <button onClick={runVendorSync} disabled={saving || !monitoring.vendor} className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                          <Globe2 className="h-4 w-4" />
                          Sync vendor API
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {vendorMappings.map((mapping) => (
                        <div key={mapping.vendor} className="rounded border border-gray-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-950">{mapping.label}</h3>
                              <p className="mt-1 text-xs text-gray-500">{mapping.auth}</p>
                            </div>
                            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">{mapping.vendor}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {mapping.supported.map((item) => <span key={item} className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{item}</span>)}
                          </div>
                          <div className="mt-3 space-y-1 text-xs text-gray-500">
                            {Object.entries(mapping.endpoints).map(([name, endpoint]) => <div key={name} className="truncate"><span className="font-medium">{name}:</span> {endpoint}</div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'credentials' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 rounded border border-gray-200 p-4 md:grid-cols-[1fr_140px_140px_1fr_1fr_auto]">
                      <TextField label="Name" value={credentialForm.name} onChange={(value) => setCredentialForm({ ...credentialForm, name: value })} />
                      <TextField label="Vendor" value={credentialForm.vendor} onChange={(value) => setCredentialForm({ ...credentialForm, vendor: value })} />
                      <TextField label="Auth mode" value={credentialForm.authMode} onChange={(value) => setCredentialForm({ ...credentialForm, authMode: value })} />
                      <TextField label="Username" value={credentialForm.username} onChange={(value) => setCredentialForm({ ...credentialForm, username: value })} />
                      <TextField label="Secret" value={credentialForm.secret} onChange={(value) => setCredentialForm({ ...credentialForm, secret: value })} />
                      <button onClick={createCredential} disabled={saving} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"><Save className="h-4 w-4" /> Save</button>
                    </div>
                    <div className="overflow-hidden rounded border border-gray-200">
                      <table className="w-full table-fixed">
                        <thead className="bg-gray-50"><tr>{['Name', 'Vendor', 'Auth', 'User', 'Test', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200">
                          {credentials.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-800">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.vendor || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.authMode || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.username || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.lastTestStatus || 'UNTESTED'}</td>
                              <td className="px-4 py-3 text-sm"><button onClick={() => testCredential(item.id)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">Test</button></td>
                            </tr>
                          ))}
                          {credentials.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No credentials saved</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tab === 'alerts' && (
                  <div className="rounded border border-gray-200">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-950">Active alert events</div>
                    <div className="divide-y divide-gray-200">
                      {alertEvents.map((event) => (
                        <div key={event.id} className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="font-medium text-gray-950">{event.title}</span>
                            <span className="text-xs text-gray-500">{formatDate(event.triggeredAt)}</span>
                          </div>
                          {event.details && <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-600">{event.details}</pre>}
                        </div>
                      ))}
                      {alertEvents.length === 0 && <div className="px-4 py-8 text-sm text-gray-500">No active alerts</div>}
                    </div>
                  </div>
                )}

                {tab === 'ipam' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 rounded border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                      <TextField label="Subnet" value={ipForm.subnet} onChange={(value) => setIpForm({ ...ipForm, subnet: value })} />
                      <TextField label="IP address" value={ipForm.ipAddress} onChange={(value) => setIpForm({ ...ipForm, ipAddress: value })} />
                      <TextField label="Hostname" value={ipForm.hostname} onChange={(value) => setIpForm({ ...ipForm, hostname: value })} />
                      <TextField label="MAC" value={ipForm.macAddress} onChange={(value) => setIpForm({ ...ipForm, macAddress: value })} />
                      <button onClick={createIpReservation} disabled={saving} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"><Plus className="h-4 w-4" /> Reserve</button>
                    </div>
                    <SimpleTable empty="No IP reservations yet" rows={ipReservations.map((item) => [item.subnet, item.ipAddress, item.hostname || '-', item.macAddress || '-', item.status])} headers={['Subnet', 'IP', 'Hostname', 'MAC', 'Status']} />
                  </div>
                )}

                {tab === 'backups' && (
                  <div className="space-y-4">
                    <label>
                      <span className="text-sm font-medium text-gray-700">Paste device configuration</span>
                      <textarea rows={8} value={backupText} onChange={(event) => setBackupText(event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm" />
                    </label>
                    <button onClick={createConfigBackup} disabled={saving || !backupText.trim()} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"><Save className="h-4 w-4" /> Save backup</button>
                    <button onClick={loadConfigDiff} disabled={configBackups.length < 2} className="ml-2 inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">Compare latest</button>
                    <SimpleTable empty="No config backups yet" rows={configBackups.map((item) => [formatDate(item.createdAt), item.source, item.checksum?.slice(0, 16) || '-'])} headers={['Created', 'Source', 'Checksum']} />
                    {backupDiff.length > 0 && (
                      <div className="max-h-96 overflow-auto rounded border border-gray-200 bg-gray-950 p-3 font-mono text-xs">
                        {backupDiff.map((line, index) => (
                          <div key={index} className={line.type === 'added' ? 'text-emerald-300' : line.type === 'removed' ? 'text-red-300' : 'text-gray-400'}>
                            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '} {line.line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'maintenance' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 rounded border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <TextField label="Name" value={maintenanceForm.name} onChange={(value) => setMaintenanceForm({ ...maintenanceForm, name: value })} />
                      <TextField label="Starts at" value={maintenanceForm.startsAt} onChange={(value) => setMaintenanceForm({ ...maintenanceForm, startsAt: value })} />
                      <TextField label="Ends at" value={maintenanceForm.endsAt} onChange={(value) => setMaintenanceForm({ ...maintenanceForm, endsAt: value })} />
                      <button onClick={createMaintenanceWindow} disabled={saving} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"><Plus className="h-4 w-4" /> Add</button>
                    </div>
                    <SimpleTable empty="No maintenance windows yet" rows={maintenanceWindows.map((item) => [item.name, formatDate(item.startsAt), formatDate(item.endsAt), item.suppressAlerts ? 'Suppress alerts' : 'Notify'])} headers={['Name', 'Starts', 'Ends', 'Mode']} />
                  </div>
                )}

                {tab === 'ops' && (
                  <div className="space-y-5">
                    <div className="grid gap-4 rounded border border-gray-200 p-4 md:grid-cols-4">
                      <NumberField label="Snapshot days" value={retention.snapshotDays} onChange={(value) => setRetention({ ...retention, snapshotDays: value })} />
                      <NumberField label="Syslog days" value={retention.syslogDays} onChange={(value) => setRetention({ ...retention, syslogDays: value })} />
                      <NumberField label="Max concurrent polls" value={retention.maxConcurrentPolls} onChange={(value) => setRetention({ ...retention, maxConcurrentPolls: value })} />
                      <NumberField label="Vendor backoff sec" value={retention.vendorBackoffSec} onChange={(value) => setRetention({ ...retention, vendorBackoffSec: value })} />
                      <button onClick={saveRetention} className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"><Save className="h-4 w-4" /> Save retention</button>
                    </div>
                    <SimpleTable empty="No escalation policies yet" headers={['Name', 'Severity', 'Second', 'Manager', 'Enabled']} rows={escalations.map((item) => [item.name, item.severity, `${item.secondDelayMin} min`, `${item.managerDelayMin} min`, item.enabled ? 'Yes' : 'No'])} />
                    <SimpleTable empty="No saved syslog searches yet" headers={['Name', 'Query', 'Severity', 'Facility']} rows={savedSearches.map((item) => [item.name, item.query || '-', item.severity || '-', item.facility || '-'])} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4">
          <div className="w-full max-w-md rounded border border-gray-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-950">
              {pendingAction.action.startsWith('EXECUTE:') ? 'Execute queued action?' : `Queue ${pendingAction.action.replaceAll('_', ' ')}?`}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Confirm this change for {selected?.name}. Reboots, PoE bounces, and port state changes can interrupt users.
            </p>
            {['BOUNCE_POE', 'DISABLE_PORT', 'ENABLE_PORT'].includes(pendingAction.action) && (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-gray-700">Port name or number</span>
                <input value={pendingAction.port} onChange={(event) => setPendingAction({ ...pendingAction, port: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="1, ge-0/0/1, ether2" />
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPendingAction(null)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmPendingAction} disabled={saving || (['BOUNCE_POE', 'DISABLE_PORT', 'ENABLE_PORT'].includes(pendingAction.action) && !pendingAction.port.trim())} className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(inventoryActions.removeCandidate)}
        title={`Retire ${inventoryActions.removeCandidate?.name || 'device'}?`}
        description={inventoryActions.removalImpact
          ? `${inventoryActions.removalImpact.action} Dependencies retained: ${inventoryActions.removalImpact.activeTickets} active tickets, ${inventoryActions.removalImpact.topologyLinks} topology links, ${inventoryActions.removalImpact.activeAlerts} active alerts, and ${inventoryActions.removalImpact.ipReservations} IP reservations.`
          : 'Checking tickets, topology links, alerts, and IP reservations before retirement...'}
        confirmLabel="Retire device"
        busy={inventoryActions.busy || (Boolean(inventoryActions.removeCandidate) && !inventoryActions.removalImpact)}
        onCancel={() => inventoryActions.setRemoveCandidate(null)}
        onConfirm={inventoryActions.retireOne}
      />
      <ConfirmDialog
        open={inventoryActions.bulkRetireOpen}
        title={`Retire ${inventoryActions.selectedIds.size} selected device${inventoryActions.selectedIds.size === 1 ? '' : 's'}?`}
        description="The selected devices will be hidden from active inventory. Their configurations, tickets, topology, monitoring history, and audit records are retained, and each device can be restored later."
        confirmLabel="Retire selected"
        busy={inventoryActions.busy}
        onCancel={() => inventoryActions.setBulkRetireOpen(false)}
        onConfirm={inventoryActions.bulkRetire}
      />
    </div>
    </RequireCompanyContext>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" />
    </label>
  );
}

function SimpleTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-hidden rounded border border-gray-200">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="truncate px-4 py-3 text-sm text-gray-700">{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-gray-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTrend({ data }: { data: HealthSnapshot[] }) {
  const points = data.slice(-30);
  const maxLatency = Math.max(1, ...points.map((point) => Number(point.latencyMs || 0)));
  if (points.length === 0) {
    return <div className="mt-3 flex h-56 items-center justify-center rounded border border-dashed border-gray-300 text-sm text-gray-500">No trend data yet</div>;
  }

  return (
    <div className="mt-3 h-56 rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex h-full items-end gap-1">
        {points.map((point) => {
          const latencyHeight = Math.max(3, Math.round((Number(point.latencyMs || 0) / maxLatency) * 100));
          const lossHeight = Math.max(3, Math.round(Number(point.packetLossPct || 0)));
          return (
            <div key={point.id} className="flex min-w-0 flex-1 items-end justify-center gap-0.5" title={`${point.latencyMs || 0} ms, ${point.packetLossPct || 0}% loss`}>
              <span className="block w-2 rounded-t bg-blue-600" style={{ height: `${latencyHeight}%` }} />
              <span className="block w-2 rounded-t bg-red-500" style={{ height: `${lossHeight}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-blue-600" /> Latency</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500" /> Packet loss</span>
      </div>
    </div>
  );
}

function ConfigList({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd: () => void }) {
  return (
    <div className="overflow-hidden rounded border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {title}
        </div>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
      {children}
      <div className="flex justify-end gap-2 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <Edit3 className="h-4 w-4" aria-hidden="true" />
        <span>Rows can be edited inline and saved to the selected equipment.</span>
        <Trash2 className="hidden h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
