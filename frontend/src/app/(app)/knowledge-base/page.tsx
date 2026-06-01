import { FeatureWorkspace } from '../../../components/features/FeatureWorkspace';

export default function KnowledgeBasePage() {
  return (
    <FeatureWorkspace
      moduleKey="knowledge-base"
      eyebrow="Support Intelligence"
      title="Knowledge Base"
      description="Create internal technician articles, customer help articles, reusable runbooks, and AI-answerable service knowledge."
      primaryAction="New article"
      secondaryAction="Review drafts"
      apiSources={['tickets']}
      recordsTitle="Knowledge Opportunities"
      recordsHint="Recent tickets that can become articles, runbooks, or AI agent knowledge."
      metrics={[
        { label: 'Internal articles', value: 'Ready', tone: 'blue' },
        { label: 'Customer articles', value: 'Ready', tone: 'green' },
        { label: 'Runbooks', value: 'Mapped', tone: 'green' },
        { label: 'AI answers', value: 'Enabled', tone: 'amber' },
      ]}
      workflows={[
        { title: 'Ticket to article', detail: 'Turn repeated ticket resolutions into reviewed knowledge articles.', action: 'Create article' },
        { title: 'Customer publishing', detail: 'Publish safe customer-facing answers without exposing internal notes.', action: 'Publish help' },
        { title: 'AI source control', detail: 'Mark approved articles as usable by the AI agent.', action: 'Manage AI sources' },
      ]}
      automationItems={[
        'Suggest articles when similar tickets are opened.',
        'Flag stale articles after product or vendor changes.',
        'Restrict AI responses to approved knowledge sources.',
      ]}
    />
  );
}
