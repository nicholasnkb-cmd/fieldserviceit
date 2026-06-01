import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function SlaPage() {
  return (
    <FeatureWorkspace
      moduleKey="sla"
      eyebrow="Service Performance"
      title="SLA Tracking"
      description="Define business hours, priority timers, response and resolution targets, breach warnings, and SLA reporting."
      primaryAction="Create SLA rule"
      secondaryAction="Breach review"
      apiSources={['tickets']}
      recordsTitle="SLA Ticket Watchlist"
      recordsHint="Open tickets that should be measured against response and resolution targets."
      metrics={[
        { label: 'Response timers', value: 'Active', tone: 'green' },
        { label: 'Resolution timers', value: 'Active', tone: 'green' },
        { label: 'At risk', value: 'Watch', tone: 'amber' },
        { label: 'Breaches', value: 'Reportable', tone: 'red' },
      ]}
      workflows={[
        { title: 'Business hours', detail: 'Apply support calendars and holidays to SLA calculations.', action: 'Open calendars' },
        { title: 'Priority targets', detail: 'Map critical, high, medium, and low tickets to response commitments.', action: 'Open targets' },
        { title: 'Breach reporting', detail: 'Export SLA performance by company, site, technician, and queue.', action: 'Open reports' },
      ]}
      automationItems={[
        'Warn technicians before a response or resolution breach.',
        'Escalate at-risk tickets based on priority.',
        'Include SLA performance in executive reporting.',
      ]}
    />
  );
}
