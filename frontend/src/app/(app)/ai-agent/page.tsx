'use client';

import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, ClipboardList, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../../lib/api';

interface AgentStep {
  id: string;
  title: string;
  detail: string;
  tool?: string;
  requiresApproval?: boolean;
}

interface AgentPlan {
  goal: string;
  mode: string;
  summary: string;
  snapshot: Record<string, number>;
  steps: AgentStep[];
  requiredApprovals: string[];
  results?: any[];
  finalAnswer?: string;
}

const starterGoals = [
  'Create a ticket to enroll a new laptop for accounting',
  'Check fleet compliance and summarize risky devices',
  'Generate an MDM enrollment token for a new Windows laptop',
];

export default function AiAgentPage() {
  const [goal, setGoal] = useState(starterGoals[0]);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [approvedActions, setApprovedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');

  const approvalSet = useMemo(() => new Set(approvedActions), [approvedActions]);

  const requestPlan = async () => {
    setLoading('plan');
    setMessage('');
    try {
      const data = await api.post<AgentPlan>('/ai-agent/plan', { goal });
      setPlan(data);
      setApprovedActions([]);
    } catch (err: any) {
      setMessage(err.message || 'Failed to create plan');
    } finally {
      setLoading('');
    }
  };

  const executePlan = async () => {
    setLoading('execute');
    setMessage('');
    try {
      const data = await api.post<AgentPlan>('/ai-agent/execute', { goal, approvedActions });
      setPlan(data);
      setMessage(data.finalAnswer || 'Agent run complete');
    } catch (err: any) {
      setMessage(err.message || 'Failed to execute plan');
    } finally {
      setLoading('');
    }
  };

  const toggleApproval = (tool: string) => {
    setApprovedActions((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]);
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
          Give the agent a goal, review its plan, approve write actions, and let it carry out safe operational tasks.
        </p>
      </div>

      {message && <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded border border-gray-200 bg-white p-5">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Goal</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Tell the agent what you want done"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {starterGoals.map((item) => (
              <button key={item} onClick={() => setGoal(item)} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
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
          </div>

          {plan && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-950">Plan</h2>
                <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">{plan.mode}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{plan.summary}</p>

              <div className="mt-4 space-y-3">
                {plan.steps.map((step, index) => (
                  <div key={step.id} className="rounded border border-gray-200 p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-950">{step.title}</h3>
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
          <section className="rounded border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-950">Workspace snapshot</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(plan?.snapshot || { tickets: 0, assets: 0, openTickets: 0, enrolledDevices: 0 }).map(([key, value]) => (
                <div key={key} className="rounded border border-gray-200 p-3">
                  <div className="text-xs uppercase text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="mt-1 text-xl font-semibold text-gray-950">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-950">Results</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(plan?.results || []).map((result, index) => (
                <div key={`${result.tool}-${index}`} className="rounded border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-900">{String(result.tool || 'tool').replaceAll('_', ' ')}</span>
                    <span className={`rounded border px-2 py-0.5 text-xs ${result.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {result.status}
                    </span>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-600">{JSON.stringify(result.data || result.message || {}, null, 2)}</pre>
                </div>
              ))}
              {!plan?.results?.length && <p className="text-sm text-gray-500">No actions have run yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
