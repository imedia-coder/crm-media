'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Field } from '@/components/form-field';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ tenantName, firstName, lastName, email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">Créer votre agence</h1>
        <p className="mb-6 text-sm text-slate-500">Démarrez votre espace en quelques secondes.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom de l'agence" value={tenantName} onChange={setTenantName} placeholder="Mon Agence" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" value={firstName} onChange={setFirstName} />
            <Field label="Nom" value={lastName} onChange={setLastName} />
          </div>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@agence.com" />
          <Field label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="8 caractères minimum" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer mon agence'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-primary underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
