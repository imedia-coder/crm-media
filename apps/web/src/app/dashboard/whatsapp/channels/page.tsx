'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { WhatsAppChannel } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const CHANNELS_KEY = '/whatsapp/channels';

export default function WhatsAppChannelsPage() {
  const { data: channels, isLoading } = useApi<WhatsAppChannel[]>(CHANNELS_KEY);
  const [name, setName] = useState('');
  const [whapiToken, setWhapiToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(CHANNELS_KEY, { name, whapiToken });
      setName('');
      setWhapiToken('');
      mutate(CHANNELS_KEY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function removeChannel(id: string) {
    await api.delete(`${CHANNELS_KEY}/${id}`);
    mutate(CHANNELS_KEY);
  }

  async function copyWebhookUrl(id: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Connexion WhatsApp</h1>

      <form
        onSubmit={onSubmit}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card shadow-sm p-4"
      >
        <div className="min-w-[200px] flex-1">
          <Field label="Nom du canal" value={name} onChange={setName} placeholder="WhatsApp Support" />
        </div>
        <div className="min-w-[260px] flex-1">
          <Field
            label="Token Whapi.Cloud"
            value={whapiToken}
            onChange={setWhapiToken}
            type="password"
            placeholder="Jeton d'accès du canal Whapi.Cloud"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Connecter
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels?.map((channel) => (
          <div key={channel.id} className="rounded-xl border border-border bg-card shadow-sm p-4">
            <div className="mb-2 flex items-start justify-between">
              <p className="font-medium text-slate-900">{channel.name}</p>
              <Badge value={channel.status} />
            </div>
            <p className="mb-3 text-sm text-slate-500">{channel.phoneNumber ?? 'Numéro non encore détecté'}</p>

            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              URL de webhook (à coller dans le tableau de bord Whapi.Cloud)
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={channel.webhookUrl}
                onFocus={(e) => e.target.select()}
                className="w-full flex-1 rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground"
              />
              <button
                onClick={() => copyWebhookUrl(channel.id, channel.webhookUrl)}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copiedId === channel.id ? 'Copié !' : 'Copier'}
              </button>
            </div>

            <button
              onClick={() => removeChannel(channel.id)}
              className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Déconnecter
            </button>
          </div>
        ))}
        {channels?.length === 0 && (
          <p className="col-span-full py-6 text-center text-slate-400">Aucun canal WhatsApp connecté.</p>
        )}
      </div>
    </div>
  );
}
