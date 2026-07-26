'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { LineItemsEditor } from '@/components/line-items-editor';
import { api, ApiError } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { Company, LineItem, Quote } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function QuotesPage() {
  const { data: quotes, isLoading } = useApi<Quote[]>('/billing/quotes');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const [companyId, setCompanyId] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]);
  const [error, setError] = useState<string | null>(null);

  async function createQuote(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/billing/quotes', { companyId, lines });
      setCompanyId('');
      setLines([{ description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]);
      mutate('/billing/quotes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function transition(id: string, action: 'send' | 'accept' | 'decline') {
    setError(null);
    try {
      await api.post(`/billing/quotes/${id}/${action}`);
      mutate('/billing/quotes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Devis</h1>

      <form onSubmit={createQuote} className="mb-8 space-y-3 rounded-xl border border-border bg-card shadow-sm p-4">
        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-medium text-slate-700">Entreprise</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Sélectionner...</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <LineItemsEditor lines={lines} onChange={setLines} />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
          Créer le devis
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Numéro</th>
              <th className="px-4 py-2">Entreprise</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Total TTC</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes?.map((quote) => (
              <tr key={quote.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{quote.number}</td>
                <td className="px-4 py-2 text-slate-600">{quote.company?.name}</td>
                <td className="px-4 py-2">
                  <Badge value={quote.status} />
                </td>
                <td className="px-4 py-2 text-slate-600">{quote.totals?.total.toFixed(2)} {quote.currency}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  {quote.status === 'DRAFT' && (
                    <button onClick={() => transition(quote.id, 'send')} className="text-sm text-slate-900 underline">
                      Envoyer
                    </button>
                  )}
                  {quote.status === 'SENT' && (
                    <>
                      <button onClick={() => transition(quote.id, 'accept')} className="text-sm text-green-700 underline">
                        Accepter
                      </button>
                      <button onClick={() => transition(quote.id, 'decline')} className="text-sm text-red-700 underline">
                        Refuser
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => downloadFile(`/billing/quotes/${quote.id}/pdf`, `${quote.number}.pdf`)}
                    className="text-sm text-slate-600 underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
            {quotes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucun devis pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
