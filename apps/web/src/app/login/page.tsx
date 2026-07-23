'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Field } from '@/components/form-field';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ tenantSlug, email, password, mfaCode: mfaCode || undefined });
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
        <h1 className="mb-1 text-2xl font-semibold">Connexion</h1>
        <p className="mb-6 text-sm text-slate-500">Accédez à votre espace agence.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Slug de l'agence" value={tenantSlug} onChange={setTenantSlug} placeholder="mon-agence" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@agence.com" />
          <Field label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <Field
            label="Code MFA (si activé)"
            value={mfaCode}
            onChange={setMfaCode}
            placeholder="123456"
            required={false}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Pas encore d&apos;agence ?{' '}
          <Link href="/register" className="font-medium text-slate-900 underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
