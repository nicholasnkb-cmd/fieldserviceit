import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function AlertingPage() {
  return (
    <FeatureWorkspace
      eyebrow="Monitoring Response"
      title="Advanced Alerting"
      description="Group related alerts, acknowledge incidents, define maintenance windows, run escalation schedules, and manage on-call response."
      primaryAction="Create alert rule"
      secondaryAction="On-call schedule"
      apiSources={['tickets', 'assets']}
      recordsTitle="Alert-to-Ticket Queue"
      recordsHint="Tickets and assets that can drive alert grouping, escalation, and recovery notices."
      metrics={[
        { label: 'Grouped alerts', value: 'Ready', tone: 'blue' },
        { label: 'Acknowledged', value: 'Tracked', tone: 'green' },
        { label: 'Escalations', value: 'Active', tone: 'amber' },
        { label: 'Recovery notices', value: 'Enabled', tone: 'green' },
      ]}
      workflows={[
        { title: 'Alert grouping', detail: 'Combine duplicate symptoms into one actionable incident.', action: 'Open grouping' },
        { title: 'Maintenance windows', detail: 'Silence planned work without losing the audit trail.', action: 'Open windows' },
        { title: 'On-call escalation', detail: 'Notify techs first, then managers, then ticket escalation paths.', action: 'Open escalation' },
      ]}
      automationItems={[
        'Create tickets from unresolved critical alerts.',
        'Send recovery messages when affected systems return online.',
        'Escalate unacknowledged alerts after policy timers expire.',
      ]}
    />
  );
}
