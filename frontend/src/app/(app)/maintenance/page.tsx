import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function MaintenancePage() {
  return (
    <FeatureWorkspace
      moduleKey="maintenance"
      eyebrow="Preventive Service"
      title="Recurring Maintenance"
      description="Schedule recurring site visits, inspections, config backups, firmware reviews, and network health checks."
      primaryAction="Schedule maintenance"
      secondaryAction="Maintenance calendar"
      apiSources={['assets', 'tickets']}
      recordsTitle="Maintenance Candidates"
      recordsHint="Assets and service tickets that can be placed into recurring maintenance plans."
      metrics={[
        { label: 'Site visits', value: 'Planned', tone: 'blue' },
        { label: 'Inspections', value: 'Ready', tone: 'green' },
        { label: 'Backups', value: 'Queued', tone: 'amber' },
        { label: 'Firmware review', value: 'Tracked', tone: 'green' },
      ]}
      workflows={[
        { title: 'Recurring schedules', detail: 'Create weekly, monthly, quarterly, or annual maintenance tasks.', action: 'Open scheduler' },
        { title: 'Inspection templates', detail: 'Standardize checklists for networks, workstations, servers, and sites.', action: 'Open templates' },
        { title: 'Maintenance windows', detail: 'Coordinate planned work with alert suppression and customer notices.', action: 'Open windows' },
      ]}
      automationItems={[
        'Generate recurring tickets before scheduled service windows.',
        'Suppress monitoring noise during approved maintenance.',
        'Attach inspection results to the asset history.',
      ]}
    />
  );
}
