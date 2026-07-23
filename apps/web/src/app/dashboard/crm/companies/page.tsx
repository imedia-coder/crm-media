'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Company } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function CompaniesPage() {
  const { data: companies, isLoading, error: loadError } = useApi<Company[]>('/crm/companies');
  const [name, setName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/crm/companies', { name, isClient });
      setName('');
      setIsClient(false);
      mutate('/crm/companies');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Entreprises</h1>

      <form onSubmit={onSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <Field label="Nom de l'entreprise" value={name} onChange={setName} placeholder="Acme SARL" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={isClient} onChange={(e) => setIsClient(e.target.checked)} />
          Client
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loadError && <p className="mb-4 text-sm text-red-600">Impossible de charger les entreprises.</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Client depuis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies?.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/crm/companies/${company.id}`} className="font-medium text-slate-900 underline">
                    {company.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{company.isClient ? 'Client' : 'Prospect'}</td>
                <td className="px-4 py-2 text-slate-600">
                  {company.clientSince ? new Date(company.clientSince).toLocaleDateString('fr-FR') : '—'}
                </td>
              </tr>
            ))}
            {companies?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Aucune entreprise pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
