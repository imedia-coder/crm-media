'use client';

import { FormEvent, useState } from 'react';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Appointment, Company, Project } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { mutate } from 'swr';

export default function PlanningPage() {
  const { data: appointments, isLoading } = useApi<Appointment[]>('/planning/appointments');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const { data: projects } = useApi<Project[]>('/projects');

  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/planning/appointments', {
        title,
        startAt,
        endAt,
        location: location || undefined,
        companyId: companyId || undefined,
        projectId: projectId || undefined,
      });
      setTitle('');
      setStartAt('');
      setEndAt('');
      setLocation('');
      setCompanyId('');
      setProjectId('');
      mutate('/planning/appointments');
      mutate('/dashboard/summary');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function remove(id: string) {
    await api.delete(`/planning/appointments/${id}`);
    mutate('/planning/appointments');
    mutate('/dashboard/summary');
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Planning</h1>

      <form onSubmit={createAppointment} className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card shadow-sm p-4">
        <div className="min-w-[200px] flex-1">
          <Field label="Titre" value={title} onChange={setTitle} placeholder="RDV client, réunion d'équipe..." />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Début</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fin</span>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <Field label="Lieu" value={location} onChange={setLocation} required={false} placeholder="Visio, bureau..." />
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
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Projet</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
          Créer
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Titre</th>
              <th className="px-4 py-2">Début</th>
              <th className="px-4 py-2">Fin</th>
              <th className="px-4 py-2">Lié à</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments?.map((appt) => (
              <tr key={appt.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{appt.title}</td>
                <td className="px-4 py-2 text-slate-600">
                  {new Date(appt.startAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {new Date(appt.endAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-2 text-slate-600">{appt.company?.name ?? appt.project?.name ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(appt.id)} className="text-sm text-red-600 underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {appointments?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucun rendez-vous planifié.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
