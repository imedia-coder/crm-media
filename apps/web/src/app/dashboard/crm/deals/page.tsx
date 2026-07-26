'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Company, Deal, PipelineStage } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function DealsPage() {
  const { data: stages, isLoading: stagesLoading } = useApi<PipelineStage[]>('/crm/pipeline-stages');
  const { data: deals, isLoading: dealsLoading } = useApi<Deal[]>('/crm/deals');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  async function createDeal(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/crm/deals', {
        title,
        companyId: companyId || undefined,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      });
      setTitle('');
      setCompanyId('');
      setEstimatedValue('');
      mutate('/crm/deals');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function moveDeal(dealId: string, stageId: string) {
    setError(null);
    try {
      await api.post(`/crm/deals/${dealId}/move`, { stageId });
      mutate('/crm/deals');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Pipeline commercial</h1>

      <form onSubmit={createDeal} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <Field label="Titre de l'opportunité" value={title} onChange={setTitle} placeholder="Refonte site web" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Entreprise</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Valeur estimée (€)" value={estimatedValue} onChange={setEstimatedValue} required={false} />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
          Créer
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {(stagesLoading || dealsLoading) && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages?.map((stage) => {
          const stageAccent = stage.isWon ? 'bg-accent' : stage.isLost ? 'bg-destructive' : 'bg-secondary';
          return (
            <div key={stage.id} className="w-64 shrink-0 rounded-xl bg-muted p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${stageAccent}`} />
                <p className="text-sm font-semibold text-foreground">{stage.name}</p>
              </div>
              <div className="space-y-2">
                {deals
                  ?.filter((d) => d.stageId === stage.id)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className={`rounded-lg border-l-4 border-y border-r border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md ${
                        stage.isWon ? 'border-l-accent' : stage.isLost ? 'border-l-destructive' : 'border-l-secondary'
                      }`}
                    >
                      <p className="font-medium text-foreground">{deal.title}</p>
                      {deal.company && <p className="text-xs text-muted-foreground">{deal.company.name}</p>}
                      {deal.estimatedValue && (
                        <p className="text-xs font-medium text-accent">{deal.estimatedValue} €</p>
                      )}
                      <select
                        value={deal.stageId}
                        onChange={(e) => moveDeal(deal.id, e.target.value)}
                        className="mt-2 w-full rounded-md border border-border px-1.5 py-1 text-xs transition-colors focus:border-primary focus:outline-none"
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
