'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, ArrowUpCircle, Bot, CalendarDays, CheckCircle2, ClipboardList, Database, ExternalLink, Lightbulb, MessageSquarePlus, Play, Search, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { api } from '../../../lib/api';

interface AgentStep {
  id: string;
  title: string;
  detail: string;
  tool?: string;
  requiresApproval?: boolean;
}

interface AgentIntent {
  primary: string;
  secondary?: string[];
  confidence: number;
  entities: Record<string, string | undefined>;
}

interface AgentPlan {
  goal: string;
  mode: string;
  model?: AgentModel;
  intent?: AgentIntent;
  summary: string;
  contextNotes?: string[];
  snapshot: Record<string, number>;
  steps: AgentStep[];
  requiredApprovals: string[];
  suggestedActions?: string[];
  recommendations?: AgentRecommendation[];
  riskSummary?: string;
  results?: any[];
  finalAnswer?: string;
}

interface AgentAnswer {
  question: string;
  mode?: string;
  model?: AgentModel;
  intent?: AgentIntent;
  answer: string;
  facts?: string[];
  suggestedActions?: string[];
  recommendations?: AgentRecommendation[];
  contextNotes?: string[];
  snapshot?: Record<string, number>;
  results?: any[];
}

interface AgentModel {
  provider: string;
  model: string | null;
  status: string;
}

interface ConversationItem {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentRecommendation {
  id: string;
  label: string;
  prompt: string;
  reason: string;
  actionType: 'ask' | 'plan' | 'navigate';
  confidence: 'high' | 'review';
  href?: string;
}

const starterGoals = [
  'Give me a morning briefing',
  'What needs attention today?',
  'Which open tickets need attention first?',
  'Find stale or unmanaged devices',
  'Review active network alerts',
  'Review RMM provider sync health',
];

const defaultSnapshot = { tickets: 0, openTickets: 0, assets: 0, enrolledDevices: 0, activeNetworkAlerts: 0, rmmProviders: 0 };

export default function AiAgentPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [goal, setGoal] = useState(starterGoals[0]);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [approvedActions, setApprovedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'error'>('info');
  const [answer, setAnswer] = useState<AgentAnswer | null>(null);
  const [history, setHistory] = useState<ConversationItem[]>([]);

  const approvalSet = useMemo(() => new Set(approvedActions), [approvedActions]);
  const activeSnapshot = plan?.snapshot || answer?.snapshot || defaultSnapshot;
  const activeIntent = plan?.intent || answer?.intent;
  const activeSuggestions = plan?.suggestedActions || answer?.suggestedActions || [];
  const activeRecommendations = plan?.recommendations || answer?.recommendations || [];
  const activeNotes = plan?.contextNotes || answer?.contextNotes || [];

  const requestPlan = async () => {
    setLoading('plan');
    setMessage('');
    try {
      const data = await api.post<AgentPlan>('/ai-agent/plan', { goal, history, currentPage: pathname });
      setPlan(data);
      setAnswer(null);
      setApprovedActions([]);
      setHistory((current) => [
        ...current,
        { role: 'user' as const, content: goal },
        { role: 'assistant' as const, content: data.summary },
      ].slice(-8));
    } catch (err: any) {
      setMessageTone('error');
      setMessage(err.message || 'Failed to create plan');
    } finally {
      setLoading('');
    }
  };

  const askQuestion = async () => {
    setLoading('ask');
    setMessage('');
    try {
      const data = await api.post<AgentAnswer>('/ai-agent/ask', { question: goal, history, currentPage: pathname });
      setAnswer(data);
      setMessageTone('info');
      setMessage('');
      setHistory((current) => [
        ...current,
        { role: 'user' as const, content: goal },
        { role: 'assistant' as const, content: data.answer },
      ].slice(-8));
    } catch (err: any) {
      setMessageTone('error');
      setMessage(err.message || 'Agent could not answer');
    } finally {
      setLoading('');
    }
  };

  const executePlan = async () => {
    setLoading('execute');
    setMessage('');
    try {
      const data = await api.post<AgentPlan>('/ai-agent/execute', { goal, approvedActions, history, currentPage: pathname });
      setPlan(data);
      setAnswer(null);
      setMessageTone('info');
      setMessage(data.finalAnswer || 'Agent run complete');
      setHistory((current) => [
        ...current,
        { role: 'user' as const, content: goal },
        { role: 'assistant' as const, content: data.finalAnswer || data.summary },
      ].slice(-8));
    } catch (err: any) {
      setMessageTone('error');
      setMessage(err.message || 'Failed to execute plan');
    } finally {
      setLoading('');
    }
  };

  const toggleApproval = (tool: string) => {
    setApprovedActions((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]);
  };

  const applyPrompt = (prompt: string) => {
    setGoal(prompt);
    setMessage('');
    setMessageTone('info');
  };

  const runRecommendation = (recommendation: AgentRecommendation) => {
    if (recommendation.actionType === 'navigate' && recommendation.href) {
      router.push(recommendation.href);
      return;
    }
    applyPrompt(recommendation.prompt);
    setMessageTone('info');
    setMessage(recommendation.actionType === 'plan' ? 'Prompt loaded for planning.' : 'Prompt loaded.');
  };

  const recommendationIcon = (recommendation: AgentRecommendation) => {
    if (recommendation.id.includes('morning')) return <CalendarDays className="h-4 w-4" aria-hidden="true" />;
    if (recommendation.id.includes('assign')) return <UserPlus className="h-4 w-4" aria-hidden="true" />;
    if (recommendation.id.includes('escalate')) return <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />;
    if (recommendation.id.includes('reply') || recommendation.id.includes('ticket')) return <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />;
    if (recommendation.actionType === 'navigate') return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
    return <Sparkles className="h-4 w-4" aria-hidden="true" />;
  };

  return (
    <div className="p-6">
      <div className="border-b border-gray-200 pb-5">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Bot className="h-4 w-4" aria-hidden="true" />
          AI operations
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950">AI Agent</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Triage tickets, assets, compliance, network health, RMM syncs, and approved service actions.
        </p>
      </div>

      {message && (
        <div className={`mt-4 flex items-start gap-2 rounded border p-3 text-sm ${
          messageTone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'
        }`}>
          {messageTone === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded border border-gray-200 bg-white p-5">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Goal or question</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ask about tickets, assets, compliance, RMM, network alerts, or an action you want planned"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {starterGoals.map((item) => (
              <button key={item} onClick={() => applyPrompt(item)} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={askQuestion}
              disabled={!!loading}
              className="inline-flex items-center justify-center gap-2 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {loading === 'ask' ? 'Answering...' : 'Ask'}
            </button>
            <button
              onClick={requestPlan}
              disabled={!!loading}
              className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {loading === 'plan' ? 'Thinking...' : 'Create plan'}
            </button>
            <button
              onClick={executePlan}
              disabled={!plan || !!loading}
              className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {loading === 'execute' ? 'Running...' : 'Run approved actions'}
            </button>
            {!!history.length && (
              <button
                onClick={() => {
                  setHistory([]);
                  setPlan(null);
                  setAnswer(null);
                  setMessageTone('info');
                  setMessage('Conversation context cleared');
                }}
                disabled={!!loading}
                className="rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60"
              >
                Clear context
              </button>
            )}
          </div>

          {activeIntent && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded border border-gray-200 p-3">
                <div className="text-xs uppercase text-gray-500">Intent</div>
                <div className="mt-1 text-sm font-semibold text-gray-950">{activeIntent.primary}</div>
                {!!activeIntent.secondary?.length && (
                  <div className="mt-1 text-xs text-gray-500">Also: {activeIntent.secondary.join(', ')}</div>
                )}
              </div>
              <div className="rounded border border-gray-200 p-3">
                <div className="text-xs uppercase text-gray-500">Confidence</div>
                <div className="mt-1 text-sm font-semibold text-gray-950">{activeIntent.confidence}%</div>
              </div>
              <div className="rounded border border-gray-200 p-3">
                <div className="text-xs uppercase text-gray-500">Entities</div>
                <div className="mt-1 truncate text-sm font-semibold text-gray-950">
                  {Object.values(activeIntent.entities || {}).filter(Boolean).join(', ') || 'none'}
                </div>
              </div>
            </div>
          )}

          {answer && (
            <div className="mt-6 rounded border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-blue-950">Answer</h2>
                {answer.model && (
                  <span className="rounded border border-blue-200 bg-white/70 px-2 py-0.5 text-xs text-blue-700">
                    {answer.model.model || answer.model.provider} · {answer.model.status}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-blue-900">{answer.answer}</p>
              {answer.model?.status === 'not-configured' && (
                <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Model reasoning is not configured. This answer used the built-in operational fallback.
                </p>
              )}
              {!!answer.facts?.length && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {answer.facts.map((fact) => (
                    <div key={fact} className="rounded border border-blue-200 bg-white/70 px-3 py-2 text-xs text-blue-900">{fact}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!answer && !plan && !loading && (
            <div className="mt-6 rounded border border-dashed border-gray-300 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-950">Ask like you would ask an operations lead</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Start with a daily triage question, then turn the best recommendation into a plan when action is needed.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      'Give me a morning briefing',
                      'Which open tickets look urgent?',
                      'Find stale devices and suggest next steps',
                    ].map((item) => (
                      <button key={item} onClick={() => applyPrompt(item)} className="rounded bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {plan && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-950">Plan</h2>
                <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  {plan.model?.model || plan.mode} · {plan.model?.status || plan.mode}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{plan.summary}</p>
              {plan.riskSummary && <p className="mt-1 text-xs text-amber-700">{plan.riskSummary}</p>}

              <div className="mt-4 space-y-3">
                {plan.steps.map((step, index) => (
                  <div key={step.id} className="rounded border border-gray-200 p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-950">{step.title}</h3>
                          {step.tool && <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">{step.tool.replaceAll('_', ' ')}</span>}
                          {step.requiresApproval && <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">approval</span>}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{step.detail}</p>
                        {step.requiresApproval && step.tool && (
                          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={approvalSet.has(step.tool)}
                              onChange={() => toggleApproval(step.tool!)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            Approve {step.tool.replaceAll('_', ' ')}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          {!!history.length && (
            <section className="rounded border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-gray-950">Conversation context</h2>
              </div>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {history.map((item, index) => (
                  <div key={`${item.role}-${index}`} className={`rounded p-2 text-xs ${item.role === 'user' ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-900'}`}>
                    <span className="font-semibold">{item.role === 'user' ? 'You' : 'Agent'}:</span> {item.content}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-950">Workspace snapshot</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(activeSnapshot).map(([key, value]) => (
                <div key={key} className="rounded border border-gray-200 p-3">
                  <div className="text-xs uppercase text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="mt-1 text-xl font-semibold text-gray-950">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {!!activeRecommendations.length && (
            <section className="rounded border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-gray-950">Quick actions</h2>
              </div>
              <div className="mt-3 space-y-3">
                {activeRecommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => runRecommendation(item)}
                    className="w-full rounded border border-gray-200 p-3 text-left hover:border-primary/30 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                        {recommendationIcon(item)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-950">{item.label}</span>
                          <span className={`rounded border px-2 py-0.5 text-xs ${
                            item.confidence === 'high' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}>
                            {item.confidence === 'high' ? 'High confidence' : 'Needs review'}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">{item.reason}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!activeRecommendations.length && !!activeSuggestions.length && (
            <section className="rounded border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-gray-950">Suggested prompts</h2>
              </div>
              <div className="mt-3 space-y-2">
                {activeSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applyPrompt(item)}
                    className="flex w-full items-start gap-2 rounded p-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!activeNotes.length && (
            <section className="rounded border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-gray-950">Scope</h2>
              </div>
              <div className="mt-3 space-y-2">
                {activeNotes.map((item) => (
                  <p key={item} className="text-sm text-gray-600">{item}</p>
                ))}
              </div>
            </section>
          )}

          <section className="rounded border border-gray-200 bg-white p-5">
            <details>
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-950">
                <Search className="h-4 w-4 text-primary" aria-hidden="true" />
                Tool evidence
              </summary>
              <div className="mt-4 space-y-3">
                {(plan?.results || answer?.results || []).map((result, index) => (
                  <div key={`${result.tool}-${index}`} className="rounded border border-gray-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900">{String(result.tool || 'tool').replaceAll('_', ' ')}</span>
                      <span className={`rounded border px-2 py-0.5 text-xs ${result.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {result.status}
                      </span>
                    </div>
                    <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-600">{JSON.stringify(result.data || result.message || {}, null, 2)}</pre>
                  </div>
                ))}
                {!(plan?.results || answer?.results)?.length && <p className="text-sm text-gray-500">Ask a question or run a plan to see tool evidence.</p>}
              </div>
            </details>
          </section>
        </aside>
      </div>
    </div>
  );
}
