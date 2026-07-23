'use client';

import { Fragment, FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { api, ApiError } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { Invoice, Quote } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CARD', 'STRIPE', 'PAYPAL', 'OTHER'];

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useApi<Invoice[]>('/billing/invoices');
  const { data: acceptedQuotes } = useApi<Quote[]>('/billing/quotes?status=ACCEPTED');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partialFormFor, setPartialFormFor] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);

  function refresh() {
    mutate('/billing/invoices');
    mutate('/dashboard/summary');
  }

  async function createFromQuote(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/billing/invoices/from-quote/${selectedQuoteId}`);
      setSelectedQuoteId('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function send(id: string) {
    setError(null);
    try {
      await api.post(`/billing/invoices/${id}/send`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function markPaid(id: string) {
    setError(null);
    try {
      await api.post(`/billing/invoices/${id}/mark-paid`, {});
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function recordPartialPayment(e: FormEvent, invoiceId: string) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/billing/invoices/${invoiceId}/payments`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      setPartialFormFor(null);
      setPaymentAmount('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Factures</h1>

      <form onSubmit={createFromQuote} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block flex-1 max-w-sm">
          <span className="mb-1 block text-sm font-medium text-slate-700">Créer depuis un devis accepté</span>
          <select
            value={selectedQuoteId}
            onChange={(e) => setSelectedQuoteId(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Sélectionner un devis...</option>
            {acceptedQuotes?.map((q) => (
              <option key={q.id} value={q.id}>
                {q.number} — {q.company?.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={!selectedQuoteId}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Créer la facture
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Numéro</th>
              <th className="px-4 py-2">Entreprise</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Total TTC</th>
              <th className="px-4 py-2">Reste dû</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices?.map((invoice) => (
              <Fragment key={invoice.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{invoice.number}</td>
                  <td className="px-4 py-2 text-slate-600">{invoice.company?.name}</td>
                  <td className="px-4 py-2">
                    <Badge value={invoice.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {invoice.totals?.total.toFixed(2)} {invoice.currency}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {invoice.amountDue?.toFixed(2)} {invoice.currency}
                  </td>
                  <td className="px-4 py-2 text-right space-x-3">
                    {invoice.status === 'DRAFT' && (
                      <button onClick={() => send(invoice.id)} className="text-sm text-slate-900 underline">
                        Envoyer
                      </button>
                    )}
                    {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                      <>
                        <button onClick={() => markPaid(invoice.id)} className="text-sm font-medium text-green-700 underline">
                          Client a payé
                        </button>
                        <button
                          onClick={() => setPartialFormFor(partialFormFor === invoice.id ? null : invoice.id)}
                          className="text-sm text-slate-500 underline"
                        >
                          Paiement partiel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => downloadFile(`/billing/invoices/${invoice.id}/pdf`, `${invoice.number}.pdf`)}
                      className="text-sm text-slate-600 underline"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
                {partialFormFor === invoice.id && (
                  <tr>
                    <td colSpan={6} className="bg-slate-50 px-4 py-3">
                      <form onSubmit={(e) => recordPartialPayment(e, invoice.id)} className="flex items-end gap-3">
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-700">Montant</span>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            required
                            className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-700">Méthode</span>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
                          Enregistrer
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {invoices?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Aucune facture pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
