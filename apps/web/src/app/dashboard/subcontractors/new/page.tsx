'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Subcontractor } from '@/lib/types';
import { formValuesToPayload, SubcontractorForm, SubcontractorFormValues } from '../subcontractor-form';

export default function NewSubcontractorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: SubcontractorFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await api.post<Subcontractor>('/subcontractors', formValuesToPayload(values));
      router.push(`/dashboard/subcontractors/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Nouveau sous-traitant</h1>
      <SubcontractorForm onSubmit={handleSubmit} submitLabel="Enregistrer" isSubmitting={isSubmitting} error={error} />
    </div>
  );
}
