import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function TechnicianMobilePage() {
  return (
    <FeatureWorkspace
      moduleKey="technician-mobile"
      eyebrow="Field Operations"
      title="Technician Mobile Workflow"
      description="A field-ready workspace for clock events, route status, parts used, notes, before-and-after photos, customer signatures, and offline job capture."
      primaryAction="Start field visit"
      secondaryAction="Route board"
      apiSources={['tickets', 'users']}
      recordsTitle="Assigned Field Work"
      recordsHint="Tickets and technicians that feed the mobile work queue."
      metrics={[
        { label: 'En route', value: 'Queued', tone: 'blue' },
        { label: 'On site', value: 'Tracked', tone: 'green' },
        { label: 'Offline drafts', value: 'Ready', tone: 'amber' },
        { label: 'Signatures', value: 'Enabled', tone: 'green' },
      ]}
      workflows={[
        { title: 'Clock and travel status', detail: 'Record start, travel, arrival, completion, and break time against the job.', action: 'Open clock controls' },
        { title: 'Parts and photos', detail: 'Log consumed parts and before-after photos before closing the visit.', action: 'Open capture tools' },
        { title: 'Customer signature', detail: 'Collect acceptance and lock the signed completion record to the ticket.', action: 'Open signature pad' },
      ]}
      automationItems={[
        'Prompt technicians to complete required job fields.',
        'Sync offline drafts when the device reconnects.',
        'Notify dispatch when a technician is late or on site.',
      ]}
    />
  );
}
