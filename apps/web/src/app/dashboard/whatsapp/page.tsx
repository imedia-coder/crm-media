'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { api, ApiError } from '@/lib/api';
import { Contact, WhatsAppConversation, WhatsAppConversationWithMessages } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const CONVERSATIONS_KEY = '/whatsapp/conversations';
const POLL_INTERVAL_MS = 20000;

export default function WhatsAppInboxPage() {
  const { data: conversations } = useApi<WhatsAppConversation[]>(CONVERSATIONS_KEY, {
    refreshInterval: POLL_INTERVAL_MS,
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const threadKey = conversationId ? `${CONVERSATIONS_KEY}/${conversationId}` : null;
  const { data: thread } = useApi<WhatsAppConversationWithMessages>(threadKey, {
    refreshInterval: POLL_INTERVAL_MS,
  });

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  useEffect(() => {
    setLinking(false);
  }, [conversationId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || !conversationId) return;
    setError(null);
    setInput('');
    setSending(true);
    try {
      await api.post(`${CONVERSATIONS_KEY}/${conversationId}/messages`, { body: text });
      mutate(threadKey);
      mutate(CONVERSATIONS_KEY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await sendMessage();
  }

  async function unlinkContact() {
    if (!conversationId) return;
    await api.delete(`${CONVERSATIONS_KEY}/${conversationId}/link`);
    mutate(threadKey);
    mutate(CONVERSATIONS_KEY);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-64 shrink-0 overflow-y-auto rounded-xl border border-border bg-card shadow-sm p-3">
        <p className="mb-3 px-2 text-sm font-semibold text-foreground">Conversations</p>
        <div className="space-y-1">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setConversationId(conv.id)}
              className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                conv.id === conversationId ? 'bg-primary text-white' : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <p className="truncate font-medium">
                {conv.contact ? `${conv.contact.firstName} ${conv.contact.lastName}` : conv.displayName || conv.phoneNumber}
              </p>
              <p className={`truncate text-xs ${conv.id === conversationId ? 'text-white/70' : 'text-slate-400'}`}>
                {conv.contact ? conv.phoneNumber : 'Non lié'}
              </p>
            </button>
          ))}
          {conversations?.length === 0 && <p className="px-2 text-sm text-slate-400">Aucune conversation.</p>}
        </div>
      </aside>

      <section className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
        {thread ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <p className="font-medium text-foreground">
                  {thread.contact ? `${thread.contact.firstName} ${thread.contact.lastName}` : thread.displayName || thread.phoneNumber}
                </p>
                <p className="text-xs text-slate-400">{thread.phoneNumber}</p>
              </div>
              {thread.contact ? (
                <button onClick={unlinkContact} className="text-xs text-slate-500 underline">
                  Délier le contact
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge value="NON_LIE" />
                  <button
                    onClick={() => setLinking((v) => !v)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Lier / créer un contact
                  </button>
                </div>
              )}
            </div>

            {linking && conversationId && (
              <LinkContactPanel
                conversationId={conversationId}
                phoneNumber={thread.phoneNumber}
                onLinked={() => {
                  setLinking(false);
                  mutate(threadKey);
                  mutate(CONVERSATIONS_KEY);
                }}
              />
            )}

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {thread.messages.length === 0 && <p className="text-sm text-slate-400">Aucun message pour l&apos;instant.</p>}
              {thread.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      msg.direction === 'OUTBOUND' ? 'bg-primary text-white' : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.body}
                    {msg.status === 'FAILED' && <p className="mt-1 text-xs text-red-200">Échec de l&apos;envoi</p>}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-4 pb-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="flex items-end gap-3 border-t border-slate-200 p-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                placeholder="Écrivez votre message... (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-slate-400">Sélectionnez une conversation.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function LinkContactPanel({
  conversationId,
  phoneNumber,
  onLinked,
}: {
  conversationId: string;
  phoneNumber: string;
  onLinked: () => void;
}) {
  const { data: contacts } = useApi<Contact[]>('/crm/contacts');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = (contacts ?? []).filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function link(contactId: string) {
    setError(null);
    try {
      await api.patch(`${CONVERSATIONS_KEY}/${conversationId}/link`, { contactId });
      onLinked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function createAndLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const contact = await api.post<Contact>('/crm/contacts', { firstName, lastName, phone: phoneNumber });
      await link(contact.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div className="border-b border-slate-200 bg-muted/50 p-4">
      {!creating ? (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un contact existant..."
            className="mb-2 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="mb-2 max-h-32 overflow-y-auto">
            {filtered.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => link(c.id)}
                className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-white"
              >
                {c.firstName} {c.lastName} {c.phone ? <span className="text-xs text-slate-400">({c.phone})</span> : null}
              </button>
            ))}
            {search && filtered.length === 0 && <p className="px-2 py-1 text-sm text-slate-400">Aucun résultat.</p>}
          </div>
          <button onClick={() => setCreating(true)} className="text-xs text-primary underline">
            Créer un nouveau contact
          </button>
        </>
      ) : (
        <form onSubmit={createAndLink} className="flex flex-wrap items-end gap-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            required
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            required
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-xs text-slate-400">Téléphone : {phoneNumber}</span>
          <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            Créer et lier
          </button>
          <button type="button" onClick={() => setCreating(false)} className="text-xs text-slate-500 underline">
            Annuler
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
