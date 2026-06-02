'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { api, getListData } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
};

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  total: number;
  taxRate: number;
  discountTotal: number;
  validUntil?: string;
  convertedInvoiceId?: string;
  ticket?: { ticketNumber?: string; title?: string };
  lines: LineItem[];
  updatedAt?: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  dueAt?: string;
  ticket?: { ticketNumber?: string; title?: string };
  quote?: { quoteNumber?: string };
  updatedAt?: string;
};

const emptyLine = (): LineItem => ({ description: '', quantity: 1, unitPrice: 0, taxable: true });

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function QuotesInvoicesPage() {
  const [tab, setTab] = useState<'quotes' | 'invoices'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    ticketId: '',
    taxRate: 0,
    discountTotal: 0,
    validUntil: '',
    notes: '',
    terms: '',
    lines: [emptyLine()],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const search = query.trim();
      const params = new URLSearchParams({ status, limit: '100' });
      if (search) params.set('search', search);
      const [summaryRes, quoteRes, invoiceRes, ticketRes] = await Promise.all([
        api.get('/quotes-invoices/summary'),
        api.get(`/quotes-invoices/quotes?${params.toString()}`),
        api.get(`/quotes-invoices/invoices?${params.toString()}`),
        api.get('/tickets?limit=100').catch(() => []),
      ]);
      setSummary(summaryRes);
      setQuotes(getListData(quoteRes));
      setInvoices(getListData(invoiceRes));
      setTickets(getListData(ticketRes));
    } catch (err: any) {
      setError(err.message || 'Failed to load quotes and invoices');
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadData();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const taxableSubtotal = form.lines.filter((line) => line.taxable).reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const taxTotal = Math.max(0, taxableSubtotal - Number(form.discountTotal || 0)) * (Number(form.taxRate || 0) / 100);
    return {
      subtotal,
      taxTotal,
      total: Math.max(0, subtotal - Number(form.discountTotal || 0) + taxTotal),
    };
  }, [form.discountTotal, form.lines, form.taxRate]);

  const metrics = [
    { label: 'Draft quotes', value: summary?.quotes?.DRAFT || 0, icon: ClipboardList },
    { label: 'Awaiting approval', value: summary?.quotes?.SENT || 0, icon: Send },
    { label: 'Open invoices', value: currency.format(summary?.openInvoiceTotal || 0), icon: FileText },
    { label: 'Paid revenue', value: currency.format(summary?.paidInvoiceTotal || 0), icon: CheckCircle2 },
  ];

  const createQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/quotes-invoices/quotes', {
        ...form,
        ticketId: form.ticketId || undefined,
        validUntil: form.validUntil || undefined,
      });
      setForm({
        title: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        ticketId: '',
        taxRate: 0,
        discountTotal: 0,
        validUntil: '',
        notes: '',
        terms: '',
        lines: [emptyLine()],
      });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create quote');
    } finally {
      setSaving(false);
    }
  };

  const patchQuote = async (quote: Quote, body: any) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/quotes-invoices/quotes/${quote.id}`, body);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update quote');
    } finally {
      setSaving(false);
    }
  };

  const convertQuote = async (quote: Quote) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/quotes-invoices/quotes/${quote.id}/convert`, {});
      setTab('invoices');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to convert quote');
    } finally {
      setSaving(false);
    }
  };

  const patchInvoice = async (invoice: Invoice, body: any) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/quotes-invoices/invoices/${invoice.id}`, body);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <section className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Revenue Workflow</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Quotes and Invoices</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Create service estimates, send quotes for approval, convert approved work into invoices, and track payment status by company and ticket.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} />
              Create quote
            </button>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-sm font-medium">{label}</p>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      {showForm && (
        <form onSubmit={createQuote} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <input required value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Quote title" />
            <input value={form.customerName} onChange={(e) => setForm((c) => ({ ...c, customerName: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Customer name" />
            <input type="email" value={form.customerEmail} onChange={(e) => setForm((c) => ({ ...c, customerEmail: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Customer email" />
            <input value={form.customerPhone} onChange={(e) => setForm((c) => ({ ...c, customerPhone: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Customer phone" />
            <select value={form.ticketId} onChange={(e) => setForm((c) => ({ ...c, ticketId: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary lg:col-span-2">
              <option value="">No linked ticket</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>{ticket.ticketNumber || ticket.id} - {ticket.title}</option>
              ))}
            </select>
            <input type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm((c) => ({ ...c, taxRate: Number(e.target.value) }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Tax rate" />
            <input type="date" value={form.validUntil} onChange={(e) => setForm((c) => ({ ...c, validUntil: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>

          <div className="space-y-2">
            {form.lines.map((line, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_110px_130px_90px_40px]">
                <input required value={line.description} onChange={(e) => updateLine(index, { description: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Line item description" />
                <input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
                  <input type="checkbox" checked={line.taxable} onChange={(e) => updateLine(index, { taxable: e.target.checked })} />
                  Tax
                </label>
                <button type="button" onClick={() => setForm((c) => ({ ...c, lines: c.lines.filter((_, i) => i !== index) }))} disabled={form.lines.length === 1} className="rounded-md border border-gray-300 text-sm text-gray-600 disabled:opacity-40">x</button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button type="button" onClick={() => setForm((c) => ({ ...c, lines: [...c.lines, emptyLine()] }))} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Plus size={16} />
              Add line
            </button>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Subtotal: <strong>{currency.format(totals.subtotal)}</strong></span>
              <span>Tax: <strong>{currency.format(totals.taxTotal)}</strong></span>
              <span>Total: <strong>{currency.format(totals.total)}</strong></span>
            </div>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving && <Loader2 className="animate-spin" size={16} />}
              Save quote
            </button>
          </div>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            {(['quotes', 'invoices'] as const).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {item === 'quotes' ? 'Quotes' : 'Invoices'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 text-sm outline-none" placeholder="Search customer, ticket, or number" />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="ALL">All statuses</option>
              {(tab === 'quotes' ? ['DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'EXPIRED', 'CONVERTED'] : ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'VOID', 'OVERDUE']).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Loading records...</div>
          ) : tab === 'quotes' ? (
            quotes.length ? quotes.map((quote) => (
              <div key={quote.id} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{quote.quoteNumber}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{quote.status}</span>
                    <p className="truncate text-sm font-semibold text-gray-950">{quote.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {[quote.customerName || quote.customerEmail, quote.ticket?.ticketNumber, quote.validUntil ? `Valid ${formatDate(quote.validUntil)}` : null, quote.updatedAt ? `Updated ${formatDate(quote.updatedAt)}` : null].filter(Boolean).join(' | ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-950">{currency.format(quote.total || 0)}</span>
                  <button disabled={saving || quote.status === 'SENT'} onClick={() => patchQuote(quote, { status: 'SENT' })} className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">Send</button>
                  <button disabled={saving || quote.status === 'APPROVED'} onClick={() => patchQuote(quote, { status: 'APPROVED' })} className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">Approve</button>
                  <button disabled={saving || Boolean(quote.convertedInvoiceId)} onClick={() => convertQuote(quote)} className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">Convert</button>
                </div>
              </div>
            )) : <div className="p-4 text-sm text-gray-500">No quotes found.</div>
          ) : invoices.length ? invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{invoice.invoiceNumber}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{invoice.status}</span>
                  <p className="truncate text-sm font-semibold text-gray-950">{invoice.title}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {[invoice.customerName || invoice.customerEmail, invoice.quote?.quoteNumber, invoice.ticket?.ticketNumber, invoice.dueAt ? `Due ${formatDate(invoice.dueAt)}` : null].filter(Boolean).join(' | ')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-950">{currency.format(invoice.balanceDue ?? invoice.total ?? 0)}</span>
                <button disabled={saving || invoice.status === 'SENT'} onClick={() => patchInvoice(invoice, { status: 'SENT' })} className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">Send</button>
                <button disabled={saving || invoice.status === 'PAID'} onClick={() => patchInvoice(invoice, { status: 'PAID' })} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"><CreditCard size={13} /> Paid</button>
                <button disabled={saving || invoice.status === 'VOID'} onClick={() => patchInvoice(invoice, { status: 'VOID' })} className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">Void</button>
              </div>
            </div>
          )) : <div className="p-4 text-sm text-gray-500">No invoices found.</div>}
        </div>
      </section>
    </div>
  );
}
