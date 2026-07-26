'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Company, Project } from '@/lib/types';
import { useApi } from '@/lib/use-api';

function progress(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const done = project.tasks.filter((t) => t.status === 'DONE').length;
  return Math.round((done / project.tasks.length) * 100);
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useApi<Project[]>('/projects');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/projects', { name, companyId: companyId || undefined, dueDate: dueDate || undefined });
      setName('');
      setCompanyId('');
      setDueDate('');
      mutate('/projects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Projets</h1>

      <form onSubmit={onSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <Field label="Nom du projet" value={name} onChange={setName} placeholder="Refonte site web" />
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
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Échéance</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
          Créer
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => {
          const pct = progress(project);
          const overdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'DONE';
          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <p className="font-medium text-slate-900">{project.name}</p>
                <Badge value={project.status} />
              </div>
              <p className="mb-3 text-sm text-slate-500">{project.company?.name ?? 'Interne'}</p>
              <div className="mb-1 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{pct}% des tâches faites</span>
                {project.dueDate && (
                  <span className={overdue ? 'font-medium text-red-600' : ''}>
                    {new Date(project.dueDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {projects?.length === 0 && (
          <p className="col-span-full py-6 text-center text-slate-400">Aucun projet pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
