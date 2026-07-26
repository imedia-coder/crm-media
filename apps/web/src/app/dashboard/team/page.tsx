'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { downloadJson } from '@/lib/download';
import { Role, TeamMember } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INVITED: 'Invité',
  DISABLED: 'Désactivé',
};

interface PurgeResult {
  purgedAt: string;
  staleRefreshTokensDeleted: number;
  readNotificationsDeleted: number;
}

export default function TeamPage() {
  const key = '/users';
  const { data: members, error: loadError } = useApi<TeamMember[]>(key);
  const { data: roles } = useApi<Role[]>('/users/roles');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);

  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteResult, setInviteResult] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  async function inviteMember(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteResult(null);
    setInviting(true);
    try {
      const result = await api.post<{ user: { email: string }; temporaryPassword: string }>('/users/invite', {
        firstName: inviteFirstName,
        lastName: inviteLastName,
        email: inviteEmail,
        roleId: inviteRoleId || undefined,
      });
      setInviteResult({ email: result.user.email, temporaryPassword: result.temporaryPassword });
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      setInviteRoleId('');
      mutate(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setInviting(false);
    }
  }

  async function runPurge() {
    setError(null);
    setPurging(true);
    setPurgeResult(null);
    try {
      const result = await api.post<PurgeResult>('/admin/retention/purge', {});
      setPurgeResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setPurging(false);
    }
  }

  async function exportMember(member: TeamMember) {
    setError(null);
    setBusyId(member.id);
    try {
      const data = await api.get(`/users/${member.id}/export`);
      downloadJson(`donnees-personnelles-${member.firstName}-${member.lastName}.json`, data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  async function anonymizeMember(member: TeamMember) {
    if (
      !window.confirm(
        `Anonymiser le compte de ${member.firstName} ${member.lastName} ? Cette action est irréversible : son identité sera effacée et son compte définitivement désactivé.`,
      )
    ) {
      return;
    }
    setError(null);
    setBusyId(member.id);
    try {
      await api.post(`/users/${member.id}/anonymize`, {});
      mutate(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  if (loadError) return <p className="text-sm text-red-600">Impossible de charger l&apos;équipe.</p>;
  if (!members) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Équipe</h1>
        <p className="text-sm text-slate-500">
          Comptes internes de l&apos;agence. Utilisez les actions RGPD pour répondre à une demande d&apos;accès ou
          d&apos;effacement, notamment lors du départ d&apos;un collaborateur.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rôle</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">
                  {member.firstName} {member.lastName}
                  {member.anonymizedAt && (
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      Anonymisé (RGPD)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-500">{member.email}</td>
                <td className="px-4 py-2 text-slate-500">{member.role?.name ?? '—'}</td>
                <td className="px-4 py-2 text-slate-500">{STATUS_LABELS[member.status] ?? member.status}</td>
                <td className="px-4 py-2">
                  {!member.anonymizedAt && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportMember(member)}
                        disabled={busyId === member.id}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Exporter
                      </button>
                      <button
                        onClick={() => anonymizeMember(member)}
                        disabled={busyId === member.id}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Anonymiser
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucun membre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Inviter un collaborateur</h2>
        <form onSubmit={inviteMember} className="flex flex-wrap items-end gap-3">
          <Field label="Prénom" value={inviteFirstName} onChange={setInviteFirstName} />
          <Field label="Nom" value={inviteLastName} onChange={setInviteLastName} />
          <Field label="Email" type="email" value={inviteEmail} onChange={setInviteEmail} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Rôle</span>
            <select
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Aucun</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {inviting ? 'Envoi...' : 'Inviter'}
          </button>
        </form>
        {inviteResult && (
          <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Compte créé pour {inviteResult.email}. Mot de passe temporaire à transmettre :{' '}
            <code className="font-mono">{inviteResult.temporaryPassword}</code>
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Politique de rétention des données (RGPD)</h2>
        <p className="mb-3 text-sm text-slate-500">
          Une purge automatique s&apos;exécute chaque nuit : jetons de connexion expirés depuis plus de 30 jours et
          notifications lues depuis plus de 180 jours sont définitivement supprimés. Vous pouvez aussi la lancer
          maintenant.
        </p>
        <button
          onClick={runPurge}
          disabled={purging}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {purging ? 'Purge en cours...' : 'Lancer la purge maintenant'}
        </button>
        {purgeResult && (
          <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
            Purge effectuée : {purgeResult.staleRefreshTokensDeleted} jeton(s) et{' '}
            {purgeResult.readNotificationsDeleted} notification(s) supprimés.
          </p>
        )}
      </section>
    </div>
  );
}
