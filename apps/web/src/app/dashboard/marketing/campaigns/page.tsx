'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Campaign, Company } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useApi<Campaign[]>('/marketing/campaigns');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [objective, setObjective] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/marketing/campaigns', { name, companyId: companyId || undefined, objective: objective || undefined });
      setName('');
      setCompanyId('');
      setObjective('');
      mutate('/marketing/campaigns');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Campagnes</h1>

      <form onSubmit={onSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <Field label="Nom de la campagne" value={name} onChange={setName} placeholder="Lancement produit été" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Entreprise</span>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Objectif" value={objective} onChange={setObjective} required={false} placeholder="Notoriété, ventes..." />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Créer
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns?.map((campaign) => (
          <div key={campaign.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-start justify-between">
              <p className="font-medium text-slate-900">{campaign.name}</p>
              <Badge value={campaign.status} />
            </div>
            <p className="mb-1 text-sm text-slate-500">{campaign.company?.name ?? 'Interne'}</p>
            {campaign.objective && <p className="mb-2 text-sm text-slate-500">{campaign.objective}</p>}
            <p className="text-xs text-slate-400">{campaign._count?.contentItems ?? 0} contenus</p>
          </div>
        ))}
        {campaigns?.length === 0 && (
          <p className="col-span-full py-6 text-center text-slate-400">Aucune campagne pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
