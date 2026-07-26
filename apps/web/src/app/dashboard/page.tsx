'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Field } from '@/components/form-field';
import { StatCard } from '@/components/stat-card';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DashboardSummary } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { mutate } from 'swr';

const CURRENCY = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

type PlanningEntry = {
  date: string;
  kind: 'appointment' | 'task' | 'project';
  label: string;
  href: string;
  detail?: string;
};

export default function DashboardHome() {
  const { displayName } = useAuth();
  const { data, isLoading, error } = useApi<DashboardSummary>('/dashboard/summary');

  const [showApptForm, setShowApptForm] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptStart, setApptStart] = useState('');
  const [apptEnd, setApptEnd] = useState('');
  const [apptError, setApptError] = useState<string | null>(null);

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setApptError(null);
    try {
      await api.post('/planning/appointments', { title: apptTitle, startAt: apptStart, endAt: apptEnd });
      setApptTitle('');
      setApptStart('');
      setApptEnd('');
      setShowApptForm(false);
      mutate('/dashboard/summary');
    } catch (err) {
      setApptError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  const planning: PlanningEntry[] = data
    ? [
        ...data.upcomingAppointments.map((a) => ({
          date: a.startAt,
          kind: 'appointment' as const,
          label: a.title,
          href: '/dashboard/planning',
          detail: a.company?.name ?? a.project?.name,
        })),
        ...data.upcomingTaskDeadlines.map((t) => ({
          date: t.dueDate as string,
          kind: 'task' as const,
          label: t.title,
          href: `/dashboard/projects/${t.projectId}`,
          detail: t.project?.name,
        })),
        ...data.upcomingProjectDeadlines.map((p) => ({
          date: p.dueDate as string,
          kind: 'project' as const,
          label: p.name,
          href: `/dashboard/projects/${p.id}`,
          detail: 'Livraison projet',
        })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const kindLabel: Record<PlanningEntry['kind'], string> = {
    appointment: 'RDV',
    task: 'Tâche',
    project: 'Projet',
  };
  const kindColor: Record<PlanningEntry['kind'], string> = {
    appointment: 'bg-blue-100 text-blue-700',
    task: 'bg-amber-100 text-amber-700',
    project: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Bonjour {displayName?.split(' ')[0] ?? ''}</h1>
      <p className="mb-6 text-sm text-slate-500">Vue d&apos;ensemble de votre agence.</p>

      {error && <p className="mb-4 text-sm text-red-600">Impossible de charger le tableau de bord.</p>}

      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Entreprises"
              value={String(data.stats.totalCompanies)}
              sublabel={`${data.stats.totalClients} clients`}
            />
            <StatCard label="Projets actifs" value={String(data.stats.activeProjects)} />
            <StatCard
              label="Pipeline ouvert"
              value={CURRENCY.format(data.stats.openDealsValue)}
              sublabel={`${data.stats.openDealsCount} opportunités`}
            />
            <StatCard
              label="Factures impayées"
              value={CURRENCY.format(data.stats.unpaidInvoicesTotal)}
              sublabel={data.stats.overdueInvoicesCount > 0 ? `${data.stats.overdueInvoicesCount} en retard` : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Planning — rendez-vous et échéances</h2>
                <button onClick={() => setShowApptForm((v) => !v)} className="text-sm text-primary underline">
                  {showApptForm ? 'Annuler' : '+ Nouveau RDV'}
                </button>
              </div>

              {showApptForm && (
                <form onSubmit={createAppointment} className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-3">
                  <div className="min-w-[180px] flex-1">
                    <Field label="Titre" value={apptTitle} onChange={setApptTitle} placeholder="Appel de suivi client" />
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Début</span>
                    <input
                      type="datetime-local"
                      value={apptStart}
                      onChange={(e) => setApptStart(e.target.value)}
                      required
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Fin</span>
                    <input
                      type="datetime-local"
                      value={apptEnd}
                      onChange={(e) => setApptEnd(e.target.value)}
                      required
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-white shadow-sm transition-colors hover:bg-primary-hover">
                    Créer
                  </button>
                  {apptError && <p className="w-full text-sm text-red-600">{apptError}</p>}
                </form>
              )}

              <div className="divide-y divide-slate-100">
                {planning.map((entry, i) => (
                  <Link
                    key={i}
                    href={entry.href}
                    className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kindColor[entry.kind]}`}>
                        {kindLabel[entry.kind]}
                      </span>
                      <div>
                        <p className="text-slate-900">{entry.label}</p>
                        {entry.detail && <p className="text-xs text-slate-500">{entry.detail}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </Link>
                ))}
                {planning.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">Rien de prévu pour l&apos;instant.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Accès rapide</h2>
              <div className="space-y-1">
                {[
                  { href: '/dashboard/crm/companies', label: 'Entreprises' },
                  { href: '/dashboard/crm/deals', label: 'Pipeline' },
                  { href: '/dashboard/projects', label: 'Projets' },
                  { href: '/dashboard/documents', label: 'Documents' },
                  { href: '/dashboard/billing/quotes', label: 'Devis' },
                  { href: '/dashboard/billing/invoices', label: 'Factures' },
                  { href: '/dashboard/planning', label: 'Planning complet' },
                ].map((s) => (
                  <Link key={s.href} href={s.href} className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
