'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { mutate } from 'swr';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Company, Contact } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const key = `/crm/companies/${id}`;
  const { data: company, error: loadError } = useApi<Company & { contacts: Contact[] }>(key);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (company) setNotes(company.notes ?? '');
  }, [company]);

  async function saveNotes() {
    setError(null);
    setSavingNotes(true);
    try {
      await api.patch(`/crm/companies/${id}`, { notes });
      mutate(key);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setSavingNotes(false);
    }
  }

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteResult, setInviteResult] = useState<{ email: string; temporaryPassword: string } | null>(null);

  async function addContact(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/crm/contacts', {
        companyId: id,
        firstName: contactFirstName,
        lastName: contactLastName,
        email: contactEmail || undefined,
      });
      setContactFirstName('');
      setContactLastName('');
      setContactEmail('');
      mutate(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function inviteClient(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteResult(null);
    try {
      const result = await api.post<{ user: { email: string }; temporaryPassword: string }>(
        `/crm/companies/${id}/invite-client`,
        { email: inviteEmail, firstName: inviteFirstName, lastName: inviteLastName },
      );
      setInviteResult({ email: result.user.email, temporaryPassword: result.temporaryPassword });
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  if (loadError) return <p className="text-sm text-red-600">Impossible de charger cette entreprise.</p>;
  if (!company) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">{company.name}</h1>
        <p className="text-sm text-slate-500">{company.isClient ? 'Client' : 'Prospect'}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          {notesSaved && <span className="text-xs text-green-600">Enregistré</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Historique des échanges, contexte, points d'attention..."
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes || notes === (company.notes ?? '')}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {savingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Contacts</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {company.contacts.map((contact) => (
            <li key={contact.id} className="text-slate-700">
              {contact.firstName} {contact.lastName} {contact.email ? `— ${contact.email}` : ''}
            </li>
          ))}
          {company.contacts.length === 0 && <li className="text-slate-400">Aucun contact.</li>}
        </ul>
        <form onSubmit={addContact} className="flex flex-wrap items-end gap-3">
          <Field label="Prénom" value={contactFirstName} onChange={setContactFirstName} />
          <Field label="Nom" value={contactLastName} onChange={setContactLastName} />
          <Field label="Email" value={contactEmail} onChange={setContactEmail} required={false} />
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Ajouter un contact
          </button>
        </form>
      </section>

      {company.isClient && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Portail client</h2>
          <p className="mb-3 text-sm text-slate-500">
            Invitez un contact de cette entreprise à accéder à son espace client (projets, documents, devis, factures).
          </p>
          <form onSubmit={inviteClient} className="flex flex-wrap items-end gap-3">
            <Field label="Prénom" value={inviteFirstName} onChange={setInviteFirstName} />
            <Field label="Nom" value={inviteLastName} onChange={setInviteLastName} />
            <Field label="Email" type="email" value={inviteEmail} onChange={setInviteEmail} />
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Inviter
            </button>
          </form>
          {inviteResult && (
            <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Compte créé pour {inviteResult.email}. Mot de passe temporaire à transmettre :{' '}
              <code className="font-mono">{inviteResult.temporaryPassword}</code>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
