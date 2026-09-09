'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { mutate } from 'swr';
import { api, ApiError } from '@/lib/api';
import { Subcontractor } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { formValuesToPayload, SubcontractorForm, SubcontractorFormValues, subcontractorToFormValues } from '../subcontractor-form';

export default function SubcontractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const key = `/subcontractors/${id}`;
  const { data: subcontractor, error: loadError } = useApi<Subcontractor>(key);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(values: SubcontractorFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.patch(key, formValuesToPayload(values));
      await mutate(key);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer définitivement ce sous-traitant ?')) return;
    setIsDeleting(true);
    try {
      await api.delete(key);
      router.push('/dashboard/subcontractors');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
      setIsDeleting(false);
    }
  }

  if (loadError) return <p className="text-sm text-red-600">Impossible de charger ce sous-traitant.</p>;
  if (!subcontractor) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">
            {subcontractor.firstName} {subcontractor.lastName}
          </h1>
          <p className="text-sm text-slate-500">Fiche interne — sous-traitant</p>
        </div>
        <div className="flex gap-2">
          {saved && <span className="self-center text-xs text-green-600">Enregistré ✓</span>}
          <button
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            🖨️ Imprimer / Enregistrer en PDF
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="mb-6 hidden print:block">
        <h1 className="text-xl font-semibold">
          Formulaire de renseignements — {subcontractor.firstName} {subcontractor.lastName}
        </h1>
        <p className="text-sm text-slate-500">Document interne confidentiel</p>
      </div>

      <SubcontractorForm
        initial={subcontractorToFormValues(subcontractor)}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer les modifications"
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
