'use client';

import Link from 'next/link';
import { useState } from 'react';
import { mutate } from 'swr';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread } = useApi<{ count: number }>('/notifications/unread-count', { refreshInterval: 20000 });
  const { data: notifications } = useApi<Notification[]>(open ? '/notifications' : null);

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
    mutate('/notifications');
    mutate('/notifications/unread-count');
  }

  async function markAllRead() {
    await api.post('/notifications/read-all');
    mutate('/notifications');
    mutate('/notifications/unread-count');
  }

  const count = unread?.count ?? 0;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
        Notifications
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-slate-500 underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '#'}
                onClick={() => {
                  if (!n.readAt) markRead(n.id);
                  setOpen(false);
                }}
                className={`block border-b border-slate-50 px-3 py-2 text-sm hover:bg-slate-50 ${!n.readAt ? 'bg-blue-50/50' : ''}`}
              >
                <p className="text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </Link>
            ))}
            {notifications?.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Aucune notification.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
