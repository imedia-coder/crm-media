'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Company, Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [projectsData, companiesData] = await Promise.all([
      api.get<Project[]>('/projects'),
      api.get<Company[]>('/crm/companies'),
    ]);
    setProjects(projectsData);
    setCompanies(companiesData);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : 'Erreur de chargement'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/projects', { name, companyId: companyId || undefined });
      setName('');
      setCompanyId('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Projets</h1>

      <form onSubmit={onSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
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
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Créer
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Projet</th>
              <th className="px-4 py-2">Entreprise</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Tâches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects?.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-slate-900 underline">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{project.company?.name ?? '—'}</td>
                <td className="px-4 py-2">
                  <Badge value={project.status} />
                </td>
                <td className="px-4 py-2 text-slate-600">{project._count?.tasks ?? 0}</td>
              </tr>
            ))}
            {projects?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Aucun projet pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
