import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function InventoryPage() {
  return (
    <FeatureWorkspace
      moduleKey="inventory"
      eyebrow="Parts Control"
      title="Inventory and Parts"
      description="Track warehouse and van stock, low inventory alerts, parts assigned to tickets, and purchase order requests."
      primaryAction="Add part"
      secondaryAction="Low-stock rules"
      apiSources={['assets', 'tickets']}
      recordsTitle="Linked Assets and Work"
      recordsHint="Assets and tickets that can consume, reserve, or request parts."
      metrics={[
        { label: 'Van stock', value: 'Tracked', tone: 'blue' },
        { label: 'Low stock', value: 'Alerting', tone: 'amber' },
        { label: 'Ticket usage', value: 'Mapped', tone: 'green' },
        { label: 'PO requests', value: 'Ready', tone: 'green' },
      ]}
      workflows={[
        { title: 'Parts reservation', detail: 'Reserve required parts before dispatching work to a technician.', action: 'Reserve parts' },
        { title: 'Van inventory', detail: 'Assign stock to technicians and reconcile usage after each job.', action: 'Open van stock' },
        { title: 'Purchase requests', detail: 'Generate replenishment requests when stock crosses thresholds.', action: 'Open PO queue' },
      ]}
      automationItems={[
        'Create low-stock alerts per location or technician van.',
        'Attach consumed parts to ticket cost history.',
        'Flag unavailable parts before scheduling work.',
      ]}
    />
  );
}
