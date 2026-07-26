'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { mutate } from 'swr';
import { api, ApiError, streamChat } from '@/lib/api';
import { AiConversation, AiConversationWithMessages, AiMessage } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const CONVERSATIONS_KEY = '/ai/conversations';

export default function AssistantPage() {
  const { data: conversations } = useApi<AiConversation[]>(CONVERSATIONS_KEY);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    api.get<AiConversationWithMessages>(`/ai/conversations/${conversationId}`).then((conv) => {
      if (!cancelled) setMessages(conv.messages);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput('');
    setSending(true);

    const userMessage: AiMessage = {
      id: `local-user-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: AiMessage = {
      id: `local-assistant-${Date.now()}`,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const { conversationId: returnedId } = await streamChat(
        { conversationId: conversationId ?? undefined, message: text },
        (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        },
      );
      if (!conversationId) setConversationId(returnedId);
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

  async function removeConversation(id: string) {
    await api.delete(`/ai/conversations/${id}`);
    if (id === conversationId) startNewConversation();
    mutate(CONVERSATIONS_KEY);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-64 shrink-0 overflow-y-auto rounded-xl border border-border bg-card shadow-sm p-3">
        <button
          onClick={startNewConversation}
          className="mb-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Nouvelle conversation
        </button>
        <div className="space-y-1">
          {conversations?.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                conv.id === conversationId ? 'bg-primary text-white' : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <button onClick={() => setConversationId(conv.id)} className="flex-1 truncate text-left">
                {conv.title || 'Sans titre'}
              </button>
              <button
                onClick={() => removeConversation(conv.id)}
                className={`ml-2 text-xs opacity-0 group-hover:opacity-100 ${
                  conv.id === conversationId ? 'text-slate-300' : 'text-red-500'
                }`}
              >
                ✕
              </button>
            </div>
          ))}
          {conversations?.length === 0 && <p className="px-2 text-sm text-slate-400">Aucune conversation.</p>}
        </div>
      </aside>

      <section className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-slate-400">
              Posez une question, demandez de rédiger un email, de résumer une information ou de brainstormer une
              idée de contenu.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'USER' ? 'bg-primary text-white' : 'bg-muted text-foreground'
                }`}
              >
                {msg.content || (sending && i === messages.length - 1 ? '...' : '')}
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
      </section>
    </div>
  );
}
