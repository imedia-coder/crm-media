'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { api, ApiError } from '@/lib/api';
import { downloadJson } from '@/lib/download';
import { TeamMember } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INVITED: 'Invité',
  DISABLED: 'Désactivé',
};

export default function TeamPage() {
  const key = '/users';
  const { data: members, error: loadError } = useApi<TeamMember[]>(key);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
    </div>
  );
}
