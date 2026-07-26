'use client';

import { PipelineStageReport, ProjectProfitability, RevenueMonth } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const CURRENCY = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export default function ReportingPage() {
  const { data: revenue, isLoading: revenueLoading } = useApi<RevenueMonth[]>('/reporting/revenue?months=12');
  const { data: pipeline, isLoading: pipelineLoading } = useApi<PipelineStageReport[]>('/reporting/pipeline');
  const { data: projects, isLoading: projectsLoading } = useApi<ProjectProfitability[]>('/reporting/projects');

  const revenueMax = Math.max(1, ...(revenue?.map((r) => r.total) ?? [1]));
  const pipelineMax = Math.max(1, ...(pipeline?.map((p) => p.dealCount) ?? [1]));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Reporting</h1>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Chiffre d&apos;affaires encaissé (12 derniers mois)</h2>
        {revenueLoading && <p className="text-sm text-slate-400">Chargement...</p>}
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {revenue?.map((r) => (
            <div key={r.month} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-slate-500">{r.total > 0 ? CURRENCY.format(r.total) : ''}</span>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${Math.max(2, (r.total / revenueMax) * 120)}px` }}
              />
              <span className="text-xs text-slate-400">{r.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Conversion du pipeline</h2>
        {pipelineLoading && <p className="text-sm text-slate-400">Chargement...</p>}
        <div className="space-y-2">
          {pipeline?.map((stage) => (
            <div key={stage.stageId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-slate-700">{stage.name}</span>
              <div className="h-4 flex-1 rounded-full bg-slate-100">
                <div
                  className={`h-4 rounded-full ${stage.isWon ? 'bg-accent' : stage.isLost ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.max(2, (stage.dealCount / pipelineMax) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-sm text-slate-600">{stage.dealCount}</span>
              <span className="w-24 shrink-0 text-right text-xs text-slate-400">{CURRENCY.format(stage.totalValue)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Rentabilité des projets</h2>
        {projectsLoading && <p className="text-sm text-slate-400">Chargement...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Projet</th>
                <th className="py-2 pr-4">Entreprise</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">Heures passées</th>
                <th className="py-2 pr-4">Tâches faites</th>
                <th className="py-2 pr-4">Facturé</th>
                <th className="py-2 pr-4">Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects?.map((p) => (
                <tr key={p.projectId}>
                  <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{p.company ?? '—'}</td>
                  <td className="py-2 pr-4 text-slate-600">{p.budget ? CURRENCY.format(p.budget) : '—'}</td>
                  <td className="py-2 pr-4 text-slate-600">{p.hoursLogged} h</td>
                  <td className="py-2 pr-4 text-slate-600">{p.taskCompletion}%</td>
                  <td className="py-2 pr-4 text-slate-600">{CURRENCY.format(p.invoicedTotal)}</td>
                  <td className="py-2 pr-4 text-slate-600">{CURRENCY.format(p.paidTotal)}</td>
                </tr>
              ))}
              {projects?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Aucun projet pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
