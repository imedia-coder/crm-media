'use client';

import Link from 'next/link';
import { Subcontractor } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function SubcontractorsPage() {
  const { data: subcontractors, isLoading, error } = useApi<Subcontractor[]>('/subcontractors');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sous-traitants</h1>
        <Link
          href="/dashboard/subcontractors/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Nouveau sous-traitant
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">Impossible de charger les sous-traitants.</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Entreprise</th>
              <th className="px-4 py-2">Prestation</th>
              <th className="px-4 py-2">Ajouté le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subcontractors?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/subcontractors/${s.id}`} className="font-medium text-slate-900 underline">
                    {s.firstName} {s.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{s.companyName ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{s.serviceType ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {subcontractors?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Aucun sous-traitant pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
