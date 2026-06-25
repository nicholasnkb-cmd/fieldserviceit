'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, Bot, Building2, CheckCircle2, Edit3, FilePlus2, Filter, Search, Tag, Ticket, X } from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../components/ui/Toast';
import { useAuthStore } from '../../../stores/authStore';

type Article = {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category?: string;
  tags: string[];
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'INTERNAL' | 'CUSTOMER' | 'PUBLIC';
  articleType: 'ARTICLE' | 'RUNBOOK' | 'FAQ' | 'TROUBLESHOOTING';
  aiEnabled: boolean;
  reviewDueAt?: string | null;
  updatedAt: string;
  createdAt: string;
  sourceTicket?: { id: string; ticketNumber?: string; title?: string } | null;
  owner?: { firstName?: string; lastName?: string } | null;
  company?: { id: string; name?: string | null } | null;
};

const blankForm = {
  title: '',
  summary: '',
  content: '',
  category: 'General',
  tags: '',
  status: 'DRAFT',
  visibility: 'INTERNAL',
  articleType: 'ARTICLE',
  aiEnabled: false,
  sourceTicketId: '',
  companyId: '',
  reviewDueAt: '',
};

const statusOptions = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
const visibilityOptions = ['INTERNAL', 'CUSTOMER', 'PUBLIC'];
const typeOptions = ['ARTICLE', 'RUNBOOK', 'FAQ', 'TROUBLESHOOTING'];

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'REVIEW') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'ARCHIVED') return 'bg-gray-100 text-gray-500 border-gray-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const { user, activeCompanyContext } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const canPickCompany = user?.role === 'SUPER_ADMIN' && !activeCompanyContext?.id;

  const categories = useMemo(() => {
    const names = new Set<string>();
    articles.forEach((article) => names.add(article.category || 'Uncategorized'));
    summary?.categories?.forEach((item: any) => names.add(item.category));
    return Array.from(names).sort();
  }, [articles, summary]);

  const staleCount = useMemo(() => {
    const now = Date.now();
    return articles.filter((article) => article.reviewDueAt && new Date(article.reviewDueAt).getTime() < now && article.status !== 'ARCHIVED').length;
  }, [articles]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      if (visibility) params.set('visibility', visibility);
      const [articleResponse, summaryResponse] = await Promise.all([
        api.get(`/knowledge-base${params.toString() ? `?${params}` : ''}`),
        api.get('/knowledge-base/summary'),
      ]);
      const list = getListData<Article>(articleResponse);
      setArticles(list);
      setSummary(summaryResponse);
      const requestedArticleId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('article') : null;
      setSelected((current) => list.find((article) => article.id === requestedArticleId) || list.find((article) => article.id === current?.id) || list[0] || null);
    } catch (err: any) {
      setError(err?.body?.message || err?.message || 'Knowledge base could not be loaded.');
      setArticles([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canPickCompany) return;
    api.get('/admin/companies?limit=100')
      .then((data) => setCompanies(getListData(data).filter((company: any) => company?.id && company.isActive !== false)))
      .catch(() => setCompanies([]));
  }, [canPickCompany]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...blankForm, companyId: activeCompanyContext?.id || companies[0]?.id || '' });
    setFormOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title || '',
      summary: article.summary || '',
      content: article.content || '',
      category: article.category || 'General',
      tags: (article.tags || []).join(', '),
      status: article.status || 'DRAFT',
      visibility: article.visibility || 'INTERNAL',
      articleType: article.articleType || 'ARTICLE',
      aiEnabled: article.aiEnabled,
      sourceTicketId: article.sourceTicket?.id || '',
      companyId: article.company?.id || activeCompanyContext?.id || '',
      reviewDueAt: article.reviewDueAt ? article.reviewDueAt.slice(0, 10) : '',
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast('error', 'Title and content are required');
      return;
    }
    if (canPickCompany && !form.companyId) {
      toast('error', 'Select a company for this article');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags,
        companyId: form.companyId || undefined,
        sourceTicketId: form.sourceTicketId || undefined,
        reviewDueAt: form.reviewDueAt || null,
      };
      const saved = editingId
        ? await api.patch(`/knowledge-base/${editingId}`, payload)
        : await api.post('/knowledge-base', payload);
      toast('success', editingId ? 'Article updated' : 'Article created');
      setSelected(saved);
      setFormOpen(false);
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Article could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (article: Article, patch: Partial<Article>) => {
    try {
      const updated = await api.patch(`/knowledge-base/${article.id}`, patch);
      toast('success', 'Article updated');
      setSelected(updated);
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Article could not be updated');
    }
  };

  const archiveArticle = async (article: Article) => {
    try {
      await api.delete(`/knowledge-base/${article.id}`);
      toast('success', 'Article archived');
      await load();
    } catch (err: any) {
      toast('error', err?.body?.message || err?.message || 'Article could not be archived');
    }
  };

  const published = summary?.statuses?.PUBLISHED || articles.filter((article) => article.status === 'PUBLISHED').length;
  const drafts = summary?.statuses?.DRAFT || articles.filter((article) => article.status === 'DRAFT').length;
  const review = summary?.statuses?.REVIEW || articles.filter((article) => article.status === 'REVIEW').length;
  const aiSources = articles.filter((article) => article.aiEnabled).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Support Intelligence</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="mt-1 text-sm text-gray-500">Structured internal articles, customer help, reusable runbooks, and approved AI sources.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4" /> Refresh
              </button>
              <button onClick={openNew} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90">
                <FilePlus2 className="h-4 w-4" /> New article
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Published', published, CheckCircle2, 'text-emerald-600'],
              ['Drafts', drafts, Edit3, 'text-blue-600'],
              ['In review', review, BookOpen, 'text-amber-600'],
              ['AI sources', aiSources, Bot, 'text-indigo-600'],
              ['Stale reviews', summary?.staleCount ?? staleCount, Archive, 'text-red-600'],
            ].map(([label, value, Icon, color]: any) => (
              <div key={label} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-6 py-5 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <aside className="space-y-4">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Search</span>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') load(); }}
                    className="min-w-0 flex-1 text-sm outline-none" placeholder="Title, body, tags..." />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Visibility</span>
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <option value="">All audiences</option>
                  {visibilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <button onClick={load} className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Apply filters</button>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
            <div className="mt-3 space-y-1">
              <button onClick={() => setCategory('')} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${!category ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>All categories</span><span>{articles.length}</span>
              </button>
              {categories.map((name) => (
                <button key={name} onClick={() => setCategory(name)} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${category === name ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span className="truncate">{name}</span>
                  <span>{articles.filter((article) => (article.category || 'Uncategorized') === name).length}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="rounded-md border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Articles</h2>
            <p className="text-xs text-gray-500">{loading ? 'Loading knowledge...' : `${articles.length} articles found`}</p>
          </div>
          {error && <div className="m-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {!error && articles.length === 0 && !loading && (
            <div className="px-4 py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">No articles yet</p>
              <p className="mt-1 text-sm text-gray-500">Create a runbook, customer answer, or internal troubleshooting note.</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <button key={article.id} onClick={() => setSelected(article)}
                className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${selected?.id === article.id ? 'bg-primary/5' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(article.status)}`}>{article.status}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{article.visibility}</span>
                  {article.aiEnabled && <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"><Bot className="h-3 w-3" /> AI</span>}
                  {article.company?.name && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"><Building2 className="h-3 w-3" /> {article.company.name}</span>}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">{article.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{article.summary || article.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>{article.category || 'Uncategorized'}</span>
                  <span>{article.articleType}</span>
                  <span>Updated {formatDate(article.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </main>

        <section className="rounded-md border border-gray-200 bg-white">
          {selected ? (
            <>
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(selected.status)}`}>{selected.status}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{selected.visibility}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-gray-900">{selected.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{selected.summary || 'No summary provided.'}</p>
                  </div>
                  <button onClick={() => openEdit(selected)} className="rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50" aria-label="Edit article">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                  {(selected.tags || []).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"><Tag className="h-3 w-3" /> {tag}</span>
                  ))}
                  {selected.sourceTicket && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"><Ticket className="h-3 w-3" /> {selected.sourceTicket.ticketNumber}</span>
                  )}
                  {selected.company?.name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"><Building2 className="h-3 w-3" /> {selected.company.name}</span>
                  )}
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-700">{selected.content}</pre>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <button onClick={() => quickUpdate(selected, { status: selected.status === 'PUBLISHED' ? 'REVIEW' : 'PUBLISHED' } as any)}
                    className="rounded-md border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">
                    {selected.status === 'PUBLISHED' ? 'Move to review' : 'Publish'}
                  </button>
                  <button onClick={() => quickUpdate(selected, { aiEnabled: !selected.aiEnabled } as any)}
                    className="rounded-md border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">
                    {selected.aiEnabled ? 'Remove AI source' : 'Approve for AI'}
                  </button>
                  <button onClick={() => quickUpdate(selected, { status: 'REVIEW' } as any)}
                    className="rounded-md border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">
                    Send to review
                  </button>
                  <button onClick={() => archiveArticle(selected)}
                    className="rounded-md border border-red-200 px-3 py-2 font-medium text-red-600 hover:bg-red-50">
                    Archive
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Select an article to preview it.</p>
            </div>
          )}
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">{editingId ? 'Edit article' : 'New article'}</h2>
              <button onClick={() => setFormOpen(false)} className="rounded-md p-2 text-gray-400 hover:bg-gray-100" aria-label="Close form"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 p-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Summary</span>
                <input value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Category</span>
                  <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Type</span>
                  <select value={form.articleType} onChange={(event) => setForm({ ...form, articleType: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Review due</span>
                  <input type="date" value={form.reviewDueAt} onChange={(event) => setForm({ ...form, reviewDueAt: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {canPickCompany && (
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Company</span>
                    <select value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Select company...</option>
                      {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Visibility</span>
                  <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {visibilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Source ticket ID</span>
                  <input value={form.sourceTicketId} onChange={(event) => setForm({ ...form, sourceTicketId: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Tags</span>
                <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="wifi, onboarding, firewall" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Content</span>
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })}
                  className="mt-1 min-h-64 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.aiEnabled} onChange={(event) => setForm({ ...form, aiEnabled: event.target.checked })}
                  className="rounded border-gray-300" />
                Approved source for AI answers
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button onClick={() => setFormOpen(false)} className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
