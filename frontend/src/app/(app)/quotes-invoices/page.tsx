import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function QuotesInvoicesPage() {
  return (
    <FeatureWorkspace
      moduleKey="quotes-invoices"
      eyebrow="Revenue Workflow"
      title="Quotes and Invoices"
      description="Convert ticket work into estimates, approved jobs, invoices, and payment links while preserving the service history."
      primaryAction="Create quote"
      secondaryAction="Invoice queue"
      apiSources={['tickets']}
      recordsTitle="Billable Ticket Queue"
      recordsHint="Tickets that can become quotes, approved jobs, or invoices."
      metrics={[
        { label: 'Draft quotes', value: 'Ready', tone: 'blue' },
        { label: 'Awaiting approval', value: 'Tracked', tone: 'amber' },
        { label: 'Invoices', value: 'Mapped', tone: 'green' },
        { label: 'Payments', value: 'Stripe-ready', tone: 'green' },
      ]}
      workflows={[
        { title: 'Ticket to quote', detail: 'Build estimates from labor, parts, travel, and fixed service fees.', action: 'Build quote' },
        { title: 'Approval to job', detail: 'Lock approved scope and convert the quote into scheduled work.', action: 'Convert job' },
        { title: 'Invoice and payment', detail: 'Send invoice records and payment links through the billing flow.', action: 'Create invoice' },
      ]}
      automationItems={[
        'Notify customers when quote approval is required.',
        'Prevent invoice creation until required completion fields are present.',
        'Send payment status back to ticket and company history.',
      ]}
    />
  );
}
