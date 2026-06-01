import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function SecurityCenterPage() {
  return (
    <FeatureWorkspace
      eyebrow="Governance"
      title="Compliance and Security Center"
      description="Centralize audit exports, role permission review, MFA enforcement, suspicious login alerts, credential rotation, and security posture reporting."
      primaryAction="Run security review"
      secondaryAction="Export audit"
      apiSources={['users', 'assets']}
      recordsTitle="Security Scope"
      recordsHint="Users and assets that feed access reviews, posture checks, and compliance exports."
      metrics={[
        { label: 'Audit exports', value: 'Ready', tone: 'blue' },
        { label: 'Permission reviews', value: 'Mapped', tone: 'green' },
        { label: 'Credential rotation', value: 'Due', tone: 'amber' },
        { label: 'Suspicious login', value: 'Watch', tone: 'red' },
      ]}
      workflows={[
        { title: 'Role review', detail: 'Compare user access against assigned role and business need.', action: 'Open role review' },
        { title: 'Credential rotation', detail: 'Track secret age and require rotation for exposed or stale credentials.', action: 'Open vault review' },
        { title: 'Audit export', detail: 'Package user, ticket, credential, billing, and admin actions for review.', action: 'Export audit' },
      ]}
      automationItems={[
        'Warn admins about stale credentials and exposed secrets.',
        'Detect unusual login or permission-change patterns.',
        'Generate compliance reports by company and date range.',
      ]}
    />
  );
}
