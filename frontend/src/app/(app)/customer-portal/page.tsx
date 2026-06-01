import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function CustomerPortalPage() {
  return (
    <FeatureWorkspace
      moduleKey="customer-portal"
      eyebrow="Customer Experience"
      title="Customer Portal"
      description="Give customers a single place to review ticket history, approve work, upload photos, sign off on completion, and rate service quality."
      primaryAction="New portal request"
      secondaryAction="Approval queue"
      apiSources={['tickets']}
      recordsTitle="Customer Ticket Activity"
      recordsHint="Recent requests that can receive approvals, attachments, signatures, and satisfaction follow-up."
      metrics={[
        { label: 'Open requests', value: 'Live', tone: 'blue' },
        { label: 'Pending approvals', value: 'Ready', tone: 'amber' },
        { label: 'Signed off', value: 'Tracked', tone: 'green' },
        { label: 'Ratings', value: 'Enabled', tone: 'green' },
      ]}
      workflows={[
        { title: 'Estimate approvals', detail: 'Route quotes and change approvals back to the requester before work begins.', action: 'Open approvals' },
        { title: 'Photo and document uploads', detail: 'Attach customer evidence directly to the related ticket timeline.', action: 'Open uploads' },
        { title: 'Completion sign-off', detail: 'Capture customer acceptance, completion notes, and service rating.', action: 'Open sign-off' },
      ]}
      automationItems={[
        'Notify customers when work is awaiting approval.',
        'Remind requesters to rate completed work.',
        'Expose ticket history without giving internal admin access.',
      ]}
    />
  );
}
