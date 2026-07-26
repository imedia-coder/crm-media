'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Campaign, Company, ContentItem, ContentType } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const TYPES: ContentType[] = ['POST', 'STORY', 'REEL', 'VIDEO', 'ARTICLE', 'NEWSLETTER', 'OTHER'];

export default function ContentPage() {
  const { data: items, isLoading } = useApi<ContentItem[]>('/marketing/content');
  const { data: companies } = useApi<Company[]>('/crm/companies');
  const { data: campaigns } = useApi<Campaign[]>('/marketing/campaigns');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<ContentType>('POST');
  const [hashtags, setHashtags] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');

  function refresh() {
    mutate('/marketing/content');
  }

  async function createContent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/marketing/content', {
        title,
        body: body || undefined,
        type,
        hashtags: hashtags ? hashtags.split(',').map((h) => h.trim()).filter(Boolean) : [],
        companyId: companyId || undefined,
        campaignId: campaignId || undefined,
      });
      setTitle('');
      setBody('');
      setHashtags('');
      setCompanyId('');
      setCampaignId('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function action(id: string, path: string, body?: unknown) {
    setError(null);
    try {
      await api.post(`/marketing/content/${id}/${path}`, body);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function submitSchedule(e: FormEvent, id: string) {
    e.preventDefault();
    await action(id, 'schedule', { scheduledAt: scheduleAt });
    setScheduleFor(null);
    setScheduleAt('');
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Calendrier éditorial</h1>

      <form onSubmit={createContent} className="mb-8 space-y-3 rounded-xl border border-border bg-card shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Field label="Titre" value={title} onChange={setTitle} placeholder="Post lancement produit" />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as ContentType)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Entreprise</span>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {companies?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Campagne</span>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {campaigns?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Texte / légende..."
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Hashtags (séparés par des virgules)" value={hashtags} onChange={setHashtags} required={false} placeholder="#lancement, #agence" />
          </div>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
            Créer le brouillon
          </button>
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="space-y-3">
        {items?.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-card shadow-sm p-4">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {item.type} {item.company ? `— ${item.company.name}` : ''} {item.campaign ? `— ${item.campaign.name}` : ''}
                </p>
              </div>
              <Badge value={item.status} />
            </div>
            {item.body && <p className="mb-2 text-sm text-slate-600">{item.body}</p>}
            {item.hashtags.length > 0 && (
              <p className="mb-2 text-xs text-blue-600">{item.hashtags.join(' ')}</p>
            )}
            {item.scheduledAt && (
              <p className="mb-2 text-xs text-slate-500">
                Planifié : {new Date(item.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {item.status === 'DRAFT' && (
                <button onClick={() => action(item.id, 'submit')} className="text-sm text-slate-900 underline">
                  Soumettre à validation
                </button>
              )}
              {item.status === 'PENDING_VALIDATION' && (
                <>
                  <button onClick={() => action(item.id, 'validate')} className="text-sm text-green-700 underline">
                    Valider
                  </button>
                  <button onClick={() => action(item.id, 'reject')} className="text-sm text-red-700 underline">
                    Refuser
                  </button>
                </>
              )}
              {item.status === 'VALIDATED' && (
                <button onClick={() => setScheduleFor(scheduleFor === item.id ? null : item.id)} className="text-sm text-slate-900 underline">
                  Planifier
                </button>
              )}
              {item.status === 'SCHEDULED' && (
                <button onClick={() => action(item.id, 'publish')} className="text-sm text-green-700 underline">
                  Marquer comme publié
                </button>
              )}
            </div>

            {scheduleFor === item.id && (
              <form onSubmit={(e) => submitSchedule(e, item.id)} className="mt-3 flex items-end gap-3 rounded-md bg-slate-50 p-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-700">Date de publication</span>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    required
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-primary-hover">
                  Confirmer
                </button>
              </form>
            )}
          </div>
        ))}
        {items?.length === 0 && <p className="py-6 text-center text-slate-400">Aucun contenu pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
