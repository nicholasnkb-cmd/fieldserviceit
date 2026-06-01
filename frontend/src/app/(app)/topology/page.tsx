import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function TopologyPage() {
  return (
    <FeatureWorkspace
      eyebrow="Network Visibility"
      title="Network Topology Map"
      description="Map sites, switches, access points, firewalls, uplinks, WAN status, connected devices, and affected services."
      primaryAction="Discover topology"
      secondaryAction="Site map"
      apiSources={['assets']}
      recordsTitle="Network Nodes"
      recordsHint="Assets that can appear in topology, dependency, and outage impact views."
      metrics={[
        { label: 'Sites', value: 'Mapped', tone: 'blue' },
        { label: 'Uplinks', value: 'Tracked', tone: 'green' },
        { label: 'WAN status', value: 'Live-ready', tone: 'amber' },
        { label: 'Impact paths', value: 'Enabled', tone: 'green' },
      ]}
      workflows={[
        { title: 'Device relationships', detail: 'Use LLDP/CDP, MAC tables, and controller APIs to link devices.', action: 'Open relationships' },
        { title: 'Outage impact', detail: 'Show downstream assets and tickets affected by a failed device or WAN.', action: 'Open impact view' },
        { title: 'Site hierarchy', detail: 'Filter topology by company, site, rack, closet, and device role.', action: 'Open hierarchy' },
      ]}
      automationItems={[
        'Update topology after discovery and SNMP polling.',
        'Flag disconnected APs, ports, and uplinks.',
        'Link topology impact directly to alert and ticket workflows.',
      ]}
    />
  );
}
